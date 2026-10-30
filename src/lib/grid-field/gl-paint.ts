/**
 * Pintor WebGL2 del campo: la placa de video dibuja los puntos.
 *
 * El pintor 2D (`paintField`) llama a `fillRect` una vez por celda encendida: en
 * escritorio, unas 42 mil por cuadro y ~8 ms del hilo principal, más que toda la
 * simulación de cosmos. Era lo que impedía pintar a más de 30 cuadros por segundo.
 * Aquí el cuadro es una textura con el grupo de pintado de cada celda (el mismo de
 * `classifyField`) y un triángulo que cubre el canvas: por cada píxel, el shader
 * busca qué punto lo cubre y cuánto. Mismos niveles y colores, mismo tamaño de
 * punto (`dotSize`) y el mismo borde suavizado con un devicePixelRatio fraccionario.
 *
 * Solo toca el canvas que recibe. Sin WebGL2, el runner sigue con el pintor 2D.
 */

import {
  classifyField,
  dotInset,
  dotSize,
  fieldStep,
  LEVELS,
  type FrameInput,
  type GridField,
  type PaintBuffers,
  type Palettes,
} from './grid-field'

export interface GlPainter {
  paint(
    field: GridField,
    frame: FrameInput,
    buffers: PaintBuffers,
    palettes: Palettes,
    dpr: number,
  ): void
}

/** Grupos de pintado por paleta: nivel × punto (campo, sprite). */
const GROUPS = 2 * LEVELS

/** Un triángulo que cubre todo el canvas, sin buffers: sale del número de vértice. */
const VERTEX = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`

/**
 * El punto de una celda empieza en su esquina menos el margen (crece desde su
 * centro) y nunca pasa del paso: un píxel solo puede caer en el punto de su celda
 * o en el de la siguiente, en cada eje. Por eso mira cuatro celdas. `cover` es
 * cuánto del píxel cubre el punto en un eje. En una esquina, el 2D de Chrome toma
 * la menor de las dos, no el producto (el área): con un dpr fraccionario, las
 * esquinas salían más tenues. Medido el 2026-10-30; se copia el 2D.
 */
const FRAGMENT = `#version 300 es
precision highp float;
precision highp int;
precision highp usampler2D;
uniform usampler2D cells;
uniform vec4 colors[${GROUPS}];
uniform vec2 spots[${GROUPS}];
uniform float pitch;
uniform float top;
uniform ivec2 grid;
out vec4 color;

float cover(float p, float a, float b) {
  return clamp(min(p + 1.0, b) - max(p, a), 0.0, 1.0);
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, top - gl_FragCoord.y) - 0.5;
  ivec2 c = ivec2(floor(p / pitch));
  color = vec4(0.0);
  for (int dx = 0; dx < 2; dx++) {
    for (int dy = 0; dy < 2; dy++) {
      ivec2 cell = c + ivec2(dx, dy);
      if (cell.x >= grid.x || cell.y >= grid.y) continue;
      int group = int(texelFetch(cells, ivec2(cell.y, cell.x), 0).r);
      if (group == 255) continue;
      vec2 spot = spots[group % ${GROUPS}];
      vec2 at = vec2(cell) * pitch - spot.x;
      color += colors[group >> 1] * min(cover(p.x, at.x, at.x + spot.y), cover(p.y, at.y, at.y + spot.y));
    }
  }
}`

type Uniform = 'colors' | 'spots' | 'pitch' | 'top' | 'grid'

/**
 * Un pintor WebGL2 para el canvas, o null si no hay WebGL2. El canvas queda tomado
 * por WebGL: si devuelve null porque el shader no compiló, ya no da un contexto 2D.
 */
export function createGlPainter(canvas: HTMLCanvasElement): GlPainter | null {
  const gl = canvas.getContext('webgl2', {
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'low-power',
  })
  if (!gl) return null

  // Por grupo: el color (paleta × nivel, premultiplicado) y el punto (nivel × sprite:
  // margen y lado, en px del dispositivo). Cambian con el tema, el dpr o la celda.
  const colors = new Float32Array(GROUPS * 4)
  const spots = new Float32Array(GROUPS * 2)
  let tunedFor: { palettes: Palettes; dpr: number; square: number; gap: number } | null = null
  let uniforms: Record<Uniform, WebGLUniformLocation | null> | null = null
  let texCols = 0
  let texRows = 0

  const compile = (type: number, source: string): WebGLShader | null => {
    const shader = gl.createShader(type)
    if (!shader) return null
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null
  }

  /** Programa, textura y estado; otra vez si el contexto se pierde y vuelve. */
  const setup = (): typeof uniforms => {
    const vertex = compile(gl.VERTEX_SHADER, VERTEX)
    const fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT)
    const program = gl.createProgram()
    if (!vertex || !fragment || !program) return null
    gl.attachShader(program, vertex)
    gl.attachShader(program, fragment)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null
    gl.useProgram(program)
    gl.bindVertexArray(gl.createVertexArray())

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture())
    // Una textura de enteros con filtro lineal (el de fábrica) está incompleta y se lee en 0.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
    gl.uniform1i(gl.getUniformLocation(program, 'cells'), 0)
    gl.clearColor(0, 0, 0, 0)
    texCols = 0
    texRows = 0
    tunedFor = null
    const at = (name: Uniform) => gl.getUniformLocation(program, name)
    return {
      colors: at('colors'),
      spots: at('spots'),
      pitch: at('pitch'),
      top: at('top'),
      grid: at('grid'),
    }
  }

  const tune = (
    field: GridField,
    palettes: Palettes,
    dpr: number,
    slots: NonNullable<typeof uniforms>,
  ) => {
    tunedFor = { palettes, dpr, square: field.square, gap: field.gap }
    for (let group = 0; group < GROUPS; group++) {
      const styles = group < LEVELS ? palettes.base : palettes.accent
      // `rgba(r,g,b,a)` (`levelStyles`): los mismos colores del pintor 2D.
      const [r = 0, g = 0, b = 0, a = 0] = (styles[group % LEVELS] ?? '')
        .slice(5, -1)
        .split(',')
        .map(Number)
      colors.set([(r / 255) * a, (g / 255) * a, (b / 255) * a, a], group * 4)
      const size = dotSize(field, palettes.spread, group >> 1, (group & 1) === 1, dpr)
      spots.set([dotInset(field.square, size, dpr) * dpr, size * dpr], group * 2)
    }
    gl.uniform4fv(slots.colors, colors)
    gl.uniform2fv(slots.spots, spots)
  }

  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault()
    uniforms = null
  })
  canvas.addEventListener('webglcontextrestored', () => {
    uniforms = setup()
  })

  uniforms = setup()
  if (!uniforms) return null

  return {
    paint(field, frame, buffers, palettes, dpr) {
      const slots = uniforms
      if (!slots) return
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.clear(gl.COLOR_BUFFER_BIT)
      if (!classifyField(field, frame, buffers)) return

      // Una celda por texel, en el orden de `levels` (column-major): x = fila, y = columna.
      const { R8UI, RED_INTEGER, TEXTURE_2D, UNSIGNED_BYTE } = gl
      if (field.cols !== texCols || field.rows !== texRows) {
        texCols = field.cols
        texRows = field.rows
        gl.texImage2D(
          TEXTURE_2D,
          0,
          R8UI,
          texRows,
          texCols,
          0,
          RED_INTEGER,
          UNSIGNED_BYTE,
          buffers.levels,
        )
      } else {
        gl.texSubImage2D(
          TEXTURE_2D,
          0,
          0,
          0,
          texRows,
          texCols,
          RED_INTEGER,
          UNSIGNED_BYTE,
          buffers.levels,
        )
      }
      if (
        tunedFor?.palettes !== palettes ||
        tunedFor.dpr !== dpr ||
        tunedFor.square !== field.square ||
        tunedFor.gap !== field.gap
      ) {
        tune(field, palettes, dpr, slots)
      }
      gl.uniform1f(slots.pitch, fieldStep(field) * dpr)
      gl.uniform1f(slots.top, canvas.height)
      gl.uniform2i(slots.grid, field.cols, field.rows)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    },
  }
}
