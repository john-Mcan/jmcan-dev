# Sesión 2026-10-02: un hero vivo

El hero quedaba sin vida: el sprite era un loop que no sabía que había alguien mirando. Se buscó
algo orgánico, que reaccione en tiempo real y simbolice el trabajo entre una persona y una IA,
usando el mismo motor de la grilla. Esta nota resume lo que se probó, lo que se decidió y lo que
queda pendiente. El código vive en `src/lib/grid-field/live*.ts` (motor) y `src/lab/` (vistas
previas); nada de esto toca todavía la home de producción.

**Índice**

1. [Cómo ver los candidatos](#1-cómo-ver-los-candidatos)
2. [Decisiones](#2-decisiones)
3. [Candidatos](#3-candidatos)
4. [Lo que se descartó](#4-lo-que-se-descartó)
5. [El motor: escenarios vivos](#5-el-motor-escenarios-vivos)
6. [Pendiente: elegir el hero](#6-pendiente-elegir-el-hero)
7. [Pendiente: el header](#7-pendiente-el-header)
8. [Para pasar a producción](#8-para-pasar-a-producción)
9. [Ajustes del 2026-10-03: celdas de 6 px y cosmos](#9-ajustes-del-2026-10-03-celdas-de-6-px-y-cosmos)

## 1. Cómo ver los candidatos

Con `pnpm dev`, en `/lab/<variante>` (`sesion`, `arrecife`, `cosmos`, `enjambre`, `corrientes`,
`escarcha`, `julia`). Es la home con el hero candidato y el resto de las secciones, para ver también
el paso al siguiente escenario al hacer scroll.

- La ruta solo existe en `astro dev`: la inyecta una integración en `astro.config.ts` y nunca llega
  al build.
- Arriba a la izquierda hay una barra para cambiar de variante y de reacción al cursor en vivo. Cada
  variante abre con el cursor con que se eligió; el cambio dura lo que dure la página.

## 2. Decisiones

- **Hero a pantalla completa**, `100svh` menos el header. Se usa `svh`, no `dvh`: en móvil, `dvh`
  cambia con la barra del navegador y la simulación tendría que reiniciarse en cada cambio.
- **Layout:** el de «moho · sesión» para todos los candidatos. El texto va a la izquierda y el
  patrón vivo ocupa todo el hero alrededor. En escritorio, «John Mcan» va en una sola línea. Es
  `src/lab/HeroStage.astro`.
- **Voz: «nosotros».** La página habla en primera persona plural, la persona y la IA como una sola
  voz (no dos que conversan). La bajada provisional es «Construimos productos web completos, del
  modelo de datos a la interfaz».
- **Llamado** (`src/lab/HeroAsk.astro`):
  - «> ¿qué construimos?» con un input que lleva a `/contacto?m=…`, con el mensaje ya escrito.
    `ContactForm.astro` lee `m` y lo pone en el textarea.
  - Además, «Ver proyectos» y la línea de disponibilidad.
  - Se descartaron «> hola.», el saludo según la hora y las líneas que narraban lo que hacía el
    fondo.
- **Sin formas en el fondo.** Un fondo vivo reemplaza la necesidad de mostrar sprites: el hero ya
  no arma cubos, globos ni el monograma. Los sprites siguen en el resto del sitio (glifos de
  proyectos, contacto, 404).
- **El cursor reacciona por posición y nunca deja rastro.** Nada queda donde pasó el puntero: los
  patrones lo huelen, se estiran hacia él o le abren paso, y se relajan cuando se va. Se suma a la
  regla de no poner brillo bajo el cursor.
- **El texto es una isla.** Todo el contenido HTML del hero (`data-grid-shape` y
  `data-grid-island`) queda fuera del patrón, con margen: nunca hay un sprite detrás de texto. La
  única excepción es Julia (ver abajo).

## 3. Candidatos

| Variante   | Patrón      | Cursor   | Qué hace                                                                                                                                                                                                                                                                                                                                                                |
| ---------- | ----------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| sesion     | `mold-open` | atrae    | Moho (Physarum): miles de agentes siguen su propio rastro y forman una red de venas que se reorganiza sola. El cursor estira la red hacia él.                                                                                                                                                                                                                           |
| arrecife   | `mold-reef` | atrae    | El mismo moho, creciendo desde el borde inferior como un arrecife. **Solo escritorio:** en una caja vertical vive como red abierta (`habitatFor`).                                                                                                                                                                                                                      |
| cosmos     | `cosmos`    | atrae    | Gravedad (N-cuerpos de partícula-malla): la materia corre desde los dos lados y colapsa en una franja, y ahí nace un tornado que gira alrededor de ella, alimentado por un flujo que no se corta. Ver la sección 9.                                                                                                                                                     |
| enjambre   | `flock`     | nada     | Una bandada (boids) con estela corta propia; cada 7–13 s se sobresalta y se parte. Con «curiosa» rodea al cursor y con «tímida» le abre paso.                                                                                                                                                                                                                           |
| corrientes | `currents`  | remolino | Partículas en un viento que rodea el texto (la función de corriente se resuelve con el texto como obstáculo). «Remolino» hace girar la corriente alrededor del cursor; «roca» la obliga a rodearlo.                                                                                                                                                                     |
| escarcha   | `frost`     | atrae    | Agregación limitada por difusión: cristales fractales que nacen en el texto y crecen siempre hacia adelante; lo más viejo se apaga y se derrite por detrás. Cada 3–6 s sale una ola nueva desde el texto. «Atrae» estira las ramas hacia el cursor.                                                                                                                     |
| julia      | `julia`     | guía     | El conjunto de Julia de z² + c, en dendritas finas, con c recorriendo el borde de la cardioide de Mandelbrot. Va a lo largo de la diagonal que sube desde abajo al centro hasta arriba a la derecha (en móvil, más alta que la caja y corrida a la derecha). «Guía»: la posición del cursor elige la forma; en «nada» se queda en su lugar y cambia de estructura sola. |

Julia es la **excepción** a «nada detrás del texto»: pasa por debajo de las letras al 30 % de su luz
(`UNDER_TEXT`) en vez de cortarse en un rectángulo. Así se pidió.

## 4. Lo que se descartó

- **Formas armadas por la red** (el moho dibujando el monograma, el cubo…): forzaban un patrón
  heredado. Quedó el aprendizaje de cómo hacer legible una forma sobre una red: calmar la red
  alrededor y revelar la forma con su rastro. Sirve si algún día un glifo debe leerse sobre un fondo
  vivo.
- **Narración en vivo** («> armando un cubo_»): sin formas no tenía qué contar.
- **Red neuronal** (dendritas desde el nombre con pulsos): no convenció.
- **Ondas excitables** (modelo de Barkley, espirales): descartado.
- **Comida sembrada con el cursor:** dejaba rastro.
- Ideas que quedaron sin probar: moho que forrajea, dos mohos (dos especies que se entrelazan),
  tinta en agua.

## 5. El motor: escenarios vivos

Además de `loop` y `hold`, el runner tiene un programa `live`: una simulación que escribe su máscara
en cada cuadro, en vez de cuadros rasterizados.

- **Declaración:** `data-grid-stage="live:<patrón>"` y `data-grid-cursor="attract|repel|off"`, que el
  patrón lee en cada cuadro.
- **Lo que el runner le pasa** (`LiveContext`): la posición del puntero (solo la posición) y las
  islas (`data-grid-shape` y `data-grid-island` dentro de la caja). La versión de las islas sube solo
  cuando cambian, no en cada scroll.
- **Interfaz** (`src/lib/grid-field/live.ts`): un patrón implementa `LiveSource` con `frame` y
  `still`. `still` es el cuadro quieto para movimiento reducido: se asienta una sola vez, porque el
  runner lo pide en cada scroll.
- **Lo compartido** (`live.ts`): la escala de las simulaciones (`fineScale`: celdas de unos 6 px,
  2 × 2 del campo en móvil y 1 × 1 en escritorio; el runner pasa `cellPx`), islas, volcado a la
  máscara y el puntero suavizado.
- **Los patrones:** `physarum.ts` + `live-mold.ts`, `gravity.ts` + `live-cosmos.ts`,
  `live-flock.ts`, `live-currents.ts`, `live-frost.ts` y `live-julia.ts`. El registro está en
  `live-patterns.ts`, y
  `scripts/grid-field.ts` lo baja aparte (`import()`) solo en la página que tiene un escenario vivo.
- **Tests:** en `grid-field.test.ts`. Cada patrón se mueve, no imprime sobre el texto (Julia, solo
  atenuado), no pasa del tope de luz y asienta su cuadro quieto una vez.

**Peso** (build, gzip): el chunk de la grilla pasó de 8,0 a 9,3 KB en todas las páginas, por el
programa vivo y el helper de carga diferida. Cada patrón suelto pesa entre 1,4 y 2,3 KB (Julia 1,4;
moho 2,3). El chunk del lab trae los seis juntos (7,7 KB), pero solo lo baja `/lab`. Una home con un
solo patrón quedaría en unos 18 KB de los 20 del presupuesto.

## 6. Pendiente: elegir el hero

Falta decidir qué candidato usar, o si se usa más de uno a la vez. El motor imprime **un escenario a
la vez** (una sola máscara), así que «más de uno» se puede resolver de varias formas:

- **Alternarlos:** uno por visita, al azar o en orden.
- **Uno por contexto:** por tema (oscuro y claro), por dispositivo (el arrecife ya es solo de
  escritorio) o por hora.
- **Combinarlos en un solo patrón:** un `LiveSource` que mezcle dos simulaciones en la misma
  máscara, por ejemplo la red de moho con Julia al fondo. Es lo más caro y habría que medirlo en un
  móvil modesto.

## 7. Pendiente: el header

Se acordó así; falta implementarlo.

- **Sticky**, siempre a mano.
- **Logo como prompt:** el «jm» pasa a ser una línea de terminal, `jm ~/<ruta>▮`.
  - La ruta cambia con la sección a la vista: `~/`, `~/proyectos`, `~/trayectoria`, `~/contacto`.
  - En la página de un proyecto, `~/proyectos/<slug>`.
  - Sirve de orientación y de miga de pan.
  - El cursor ▮ va en ámbar: marca estado.
  - Un solo cursor parpadea a la vez, así que no compite con el del hero si ese llegara a tener
    uno.
- **Escritorio:** arriba de todo se ve como hoy (64 px, transparente). Al bajar pasa a compacto
  (unos 44 px), con fondo y una línea fina abajo.
- **Móvil:** se esconde al bajar y vuelve, compacto, al subir.
- **Sin `backdrop-filter: blur`:** detrás hay un canvas que repinta a 30 fps, y el blur se
  recalcularía en cada cuadro, que es caro en un móvil modesto. Mejor un fondo sólido semitransparente
  (alrededor del 90 % de `--bg`) con la línea fina.
- **Con el ClientRouter:** el header ya persiste entre navegaciones (`transition:name`). Al
  navegar, el estado compacto o escondido debe ajustarse a la posición del scroll de la página
  nueva.

## 8. Para pasar a producción

Cuando se elija el hero:

1. Mover `HeroStage` y `HeroAsk` a `src/components/sections/home/` (reemplazan a `Hero.astro`) y
   el copy a `src/i18n/ui/{es,en}.ts`: «¿qué construimos?», el placeholder, «Enviar» y la bajada en
   «nosotros». Revisar el resto del sitio, que todavía habla en primera persona singular.
2. Dejar en `live-patterns.ts` solo los patrones que se usen y borrar los demás, junto con sus tests.
3. Decidir si `/lab` se queda como herramienta de dev o se borra junto con `src/lab/`.
4. Documentar los escenarios vivos en `docs/grid-field-extending.md`: receta y reglas, incluida la
   excepción de Julia si queda.
5. Medir en Safari, Firefox y un móvil modesto. El costo por cuadro no se midió en el navegador; en
   Node, un paso del moho ronda 1 ms en una caja de escritorio.

## 9. Ajustes del 2026-10-03: celdas de 6 px y cosmos

**Celdas de 6 px en todos los patrones.**

- Antes todos vivían a media resolución: cada celda medía 12 px en escritorio y 6 en móvil, donde se
  veían mejor. Se probó 6 px en todos y se veían mucho mejor, así que quedó así: `fineScale` en
  `live.ts`, con el `cellPx` que pasa el runner. Julia ya medía 6 px.
- En escritorio hay cuatro veces más celdas. En Node, el moho pasó de ~0,7 a ~2,3 ms por cuadro, el
  enjambre ronda los 2,4 y la escarcha los 1,4. En móvil no cambia nada.
- Subieron los topes (moho 16 000 agentes, enjambre 2 400, corrientes 3 200, escarcha 2 000), y la
  escarcha derrite en proporción al área.
- Con eso se dieron por resueltos el enjambre (partículas más chicas y fluidas) y la escarcha: se
  pedía separar crecimiento y deshielo, pero lo que faltaba era la escala.

**Arrecife.** Trepaba siempre el bloque del texto: los agentes que esquivaban o chocaban una isla se
juntaban en su borde y la red lo recorría. Ahora (`shunIslands`) las islas no se huelen como pared y
el agente que entra renace en otro lado. Todavía trepa a veces, menos marcado, y se aceptó así: se ve
orgánico.

**Julia.**

- En «nada», c recorre el borde de la cardioide entre ~1,8 y ~2,5 con dos vaivenes (~37 y ~13 s): la
  estructura cambia de forma visible cada pocos segundos.
- La escala de c no pasa de ~1,006. Más afuera, en varios ángulos, la forma se rellena de gris, que
  ya se había descartado.
- En móvil es más alta que la caja (desborda arriba y abajo) y su eje va al 62 % del ancho.

**Cosmos (nuevo).** Se pidió una variante con la forma de la red cósmica: filamentos y nudos.

- Se descartaron el moho con cúmulos que lo alimentan (se veía como «sesión», una espuma pareja) y
  una red cósmica con gravedad apantallada, mareas y flujos (persistía, pero no convenció).
- Quedó la primera prueba de gravedad, con lo que gustó de ella: el arranque, con la materia que
  aparece y corre desde los dos lados hasta colapsar en una franja. A partir de ahí, la materia gira
  alrededor de la franja como un tornado visto de costado.
- `gravity.ts` es un N-cuerpos de partícula-malla (Poisson por FFT, caja periódica). En
  `live-cosmos.ts`:
  - El arranque es un campo de Zel'dovich (la textura de los filamentos) más un pozo hacia el eje, al
    76 % del ancho (62 % en móvil). Las ondas más largas del campo al azar se silencian: en cajas
    anchas armaban su propia franja.
  - El tornado nace sobre la franja y la sigue unos segundos: nace antes de que la franja termine de
    formarse y, quieto, quedaba a un costado.
  - Lo que llega al eje orbita en 3D, en tres hebras helicoidales que giran juntas. Lo de adelante
    brilla y lo de atrás queda tenue. Sin hebras, el giro no se ve.
  - El núcleo succiona la materia libre desde los dos lados. Cada partícula orbita un tiempo al azar
    (o hasta la cima), sube a su propio ritmo y renace lejos del eje, así el flujo no se corta. Con un
    tiempo fijo, lo que entraba junto salía junto y el tornado latía. Subiendo todas igual, los nudos
    llegaban enteros a la cima y renacían de golpe.
  - El texto apartaba la materia con un empuje de corto alcance (quitado el 2026-10-05, ver abajo).
    Como vacío gravitatorio dejaba un pozo en la caja periódica (cerca del 80 % del ancho), donde se
    armaba una franja propia junto al tornado.
  - El eje es una fracción fija del ancho y no sale del texto: el texto se mide antes de que cargue la
    fuente pixel y después se angosta, y el eje se corría.
- Pendiente: cuesta ~2,9 ms por cuadro en escritorio (Node), más que los otros patrones.

**Cosmos, ajustes del 2026-10-05.**

- **Todo nace igual.** La materia que renace (fin de la órbita o goteo) cae en un punto al azar de
  _toda_ la caja. Antes esquivaba las islas y una franja del 30 % del ancho alrededor del eje, y el
  nacimiento no era parejo.
- **El texto no existe para la simulación, en todos los anchos.** Se quitó el empuje de corto alcance
  (arriba) y el corte en recuadro: la materia pasa por debajo del texto con el 40 % de su luz
  (`UNDER_TEXT`), como Julia (30 %). Primero se hizo solo para cajas verticales (móvil), pero en
  escritorio seguía viéndose un halo vacío alrededor del texto, y se pidió lo mismo en todos los
  anchos («móvil» incluye escritorio).
- **Recuadros de CSS, en todos los anchos.** En `HeroAsk.astro`, `.live-open` vuelve transparentes el
  input y los botones (queda el borde; el principal lo marca de 2 px). Antes `.field`
  (semitransparente) y `.btn` (sólido) tapaban el ruido de la grilla. Es de todos los heros del
  laboratorio, no solo de cosmos.
