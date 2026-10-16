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
10. [Ajustes del 2026-10-05: Julia con zoom infinito y grilla de 4 px](#10-ajustes-del-2026-10-05-julia-con-zoom-infinito-y-grilla-de-4-px)
11. [Ajustes del 2026-10-15: cosmos v2](#11-ajustes-del-2026-10-15-cosmos-v2)
12. [2026-10-15: cosmos v2 en la home y el header](#12-2026-10-15-cosmos-v2-en-la-home-y-el-header)
13. [2026-10-15: header compacto, barrido y escritura](#13-2026-10-15-header-compacto-barrido-y-escritura)
14. [2026-10-15: ajustes para móvil, tras probar en teléfonos](#14-2026-10-15-ajustes-para-móvil-tras-probar-en-teléfonos)
15. [2026-10-15: navegación](#15-2026-10-15-navegación)

## 1. Cómo ver los candidatos

Con `pnpm dev`, en `/lab/<variante>` (`sesion`, `arrecife`, `cosmos`, `cosmosv2`, `enjambre`,
`corrientes`, `escarcha`, `julia`). Es la home con el hero candidato y el resto de las secciones,
para ver también el paso al siguiente escenario al hacer scroll.

- La ruta solo existe en `astro dev`: la inyecta una integración en `astro.config.ts` y nunca llega
  al build.
- Arriba a la izquierda hay una barra para cambiar de variante y de reacción al cursor en vivo. Cada
  variante abre con el cursor con que se eligió; el cambio dura lo que dure la página.
- La misma barra cambia la celda de la grilla en escritorio («grilla»: 6 px, 4 px o 4 px grueso).
  Vale para todo el laboratorio mientras dure la sesión; ver la sección 10.

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

| Variante   | Patrón         | Cursor   | Qué hace                                                                                                                                                                                                                                                                          |
| ---------- | -------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| sesion     | `mold-open`    | atrae    | Moho (Physarum): miles de agentes siguen su propio rastro y forman una red de venas que se reorganiza sola. El cursor estira la red hacia él.                                                                                                                                     |
| arrecife   | `mold-reef`    | atrae    | El mismo moho, creciendo desde el borde inferior como un arrecife. **Solo escritorio:** en una caja vertical vive como red abierta (`habitatFor`).                                                                                                                                |
| cosmos     | `cosmos`       | atrae    | Gravedad (N-cuerpos de partícula-malla): la materia corre desde los dos lados y colapsa en una franja, y ahí nace un tornado que gira alrededor de ella, alimentado por un flujo que no se corta. Ver la sección 9.                                                               |
| cosmosv2   | `cosmos-alone` | atrae    | Cosmos que entra con un fundido (sin barrido) y nunca suma materia: la del arranque cae al tornado y el fondo queda vacío. Ver la sección 11.                                                                                                                                     |
| enjambre   | `flock`        | nada     | Una bandada (boids) con estela corta propia; cada 7–13 s se sobresalta y se parte. Con «curiosa» rodea al cursor y con «tímida» le abre paso.                                                                                                                                     |
| corrientes | `currents`     | remolino | Partículas en un viento que rodea el texto (la función de corriente se resuelve con el texto como obstáculo). «Remolino» hace girar la corriente alrededor del cursor; «roca» la obliga a rodearlo.                                                                               |
| escarcha   | `frost`        | atrae    | Agregación limitada por difusión: cristales fractales que nacen en el texto y crecen siempre hacia adelante; lo más viejo se apaga y se derrite por detrás. Cada 3–6 s sale una ola nueva desde el texto. «Atrae» estira las ramas hacia el cursor.                               |
| julia      | `julia`        | guía     | Un zoom que no termina nunca en el conjunto de Julia de z² + c (c ≈ −0,8 + 0,156i: espirales y bulbos), con las ondas de su potencial alrededor, que corren hacia afuera. Ver la sección 10. «Guía»: la posición del cursor mueve c y cambia la forma; en «nada», c se mece sola. |

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

## 6. Elegir el hero

**Elegido el 2026-10-15: cosmos v2** (sección 12). Lo que sigue queda como referencia, por si se
quiere sumar otro.

Faltaba decidir qué candidato usar, o si se usa más de uno a la vez. El motor imprime **un escenario
a la vez** (una sola máscara), así que «más de uno» se puede resolver de varias formas:

- **Alternarlos:** uno por visita, al azar o en orden.
- **Uno por contexto:** por tema (oscuro y claro), por dispositivo (el arrecife ya es solo de
  escritorio) o por hora.
- **Combinarlos en un solo patrón:** un `LiveSource` que mezcle dos simulaciones en la misma
  máscara, por ejemplo la red de moho con Julia al fondo. Es lo más caro y habría que medirlo en un
  móvil modesto.

## 7. El header

Se acordó así y se implementó el 2026-10-15 (sección 12).

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

Lo hecho el 2026-10-15 está en las secciones 12 y 13; quedan pendientes los puntos 3 y 5. La voz
quedó resuelta al revés de lo previsto: el hero pasó a primera persona singular, como el resto del
sitio (sección 13).

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

## 10. Ajustes del 2026-10-05: Julia con zoom infinito y grilla de 4 px

Se pidió que Julia dejara de ser una figura quieta: que se viera lo que tiene de fractal (por más
zoom que se le dé, el detalle no se acaba) y que conservara el detalle de las ondas que forma. Un
primer intento de esa sesión (solo los filamentos, sin ondas) se descartó: eran «líneas que crecen».

**El zoom.** Va hacia un punto periódico repulsor p del conjunto (período 4, |λ| ≈ 7), y la vista
es la función de Poincaré de ese punto, no un zoom común: al acercar |λ| veces la imagen vuelve a ser
exactamente la misma, así que el zoom da la vuelta sin salto y sigue para siempre sin perder
precisión. Se eligió ese punto porque casi no gira (menos de 0,2 rad por cada e-pliegue de zoom): el
punto fijo α de c, el de las espirales, gira 47 rad por e-pliegue y la vista daba vueltas como un
trompo. c se mece con un radio de 0,03 y el puntero la lleva hasta ±0,08 por eje; en todo ese rango
el punto sigue repeliendo (|λ| entre 5,8 y 8,4) y se sigue con Newton. El detalle del método está en
el comentario de `live-julia.ts`.

**Lo que se ve.** Todo se mide en celdas, así que se ve igual a cualquier profundidad:

- El borde, con el estimador de distancia: no se pierden los filamentos más finos que una celda.
- Las ondas: el tiempo de escape suavizado en líneas finas que corren hacia afuera. Cerca del borde
  se juntan tanto que no entran en la grilla, y ahí se apagan.
- En la grilla, la luz media (0,3–0,6) se confunde con el ruido del campo: las líneas necesitan
  ~0,8. Una bruma gris donde las ondas no entran se leía como una mancha que tapaba las espirales, y
  se quitó.

**Peso.** ~3,5 ms por cuadro a 1838 px y ~0,8 en una caja de móvil (Chrome, escritorio).

**Grilla de 4 px (prueba).** `<html data-grid-cell="<paso>:<punto>">` fuerza la celda en escritorio
(desde 640 px), sin el presupuesto de celdas. Lo pone la barra del laboratorio. `fineScale` ya no
engrosa la simulación cuando la celda mide menos de 6 px: con 4 px, una celda de simulación por
celda.

- **4 px grueso** (punto de 2 px cada 4) es lo que mejor lee Julia: las espirales y las ondas se ven
  nítidas. Con punto de 1 px todo se apaga.
- Cuesta: con 4 px hay 2,3 veces más celdas. El cuadro pasa de ~10 a ~25 ms en una RTX 3060 Ti
  (Julia de 3,4 a ~9; el resto es pintar), contra 33 ms de presupuesto a 30 fps. Para adoptarlo en
  serio habría que abaratar el pintado (`ImageData` o WebGL2, ver
  `docs/grid-field-extending.md`, sección 6) o dejarlo solo para el hero.
- Pendiente: decidir si se queda.

## 11. Ajustes del 2026-10-15: cosmos v2

Se pidió una variante de cosmos (`/lab/cosmosv2`, patrón `cosmos-alone`) con dos cambios:

- **Entrada.** Sin el barrido de arriba hacia abajo: el fondo entero (ruido y partículas) entra con
  un fundido de 1,2 s, con las partículas ya listas. La página lo pide con `data-grid-intro="fade"`
  (en `HeroStage`, desde `intro` en `variants.ts`). El fundido espera al escenario y lo trae ya
  encendido; al navegar hacia la página, el campo baja a cero y sube igual.
- **Sin materia nueva.** La del arranque cae al tornado como en cosmos, y nada más: sin goteo ni
  renacer en el fondo. Lo que termina su órbita (o llega a la cima) vuelve a entrar al tornado en un
  punto al azar de su pared, como si llegara, y se suma girando a su hebra. Hacia los 15 s ya no
  queda nada en el fondo y el tornado se sostiene solo, con todas las partículas.
- Primero se probó un destete: formado el tornado, la materia dejaba de renacer en el fondo de a
  poco y el tornado se quedaba con la que tenía al formarse (~19 mil de 30 mil; el resto se
  apagaba). Se reemplazó por lo de arriba, más simple. Con las 30 mil, el tornado ocupa ~6 % más de
  celdas y se ve algo más lleno.
- Con el fondo vacío, el cursor ya no tiene materia libre que atraer o apartar: deja de verse su
  efecto.

## 12. 2026-10-15: cosmos v2 en la home y el header

**El hero.** La home usa cosmos v2: patrón `cosmos-alone`, cursor «atrae» y entrada en fundido.

- `HeroStage` y `HeroAsk` pasaron a `src/components/sections/home/` como `Hero.astro` y
  `HeroAsk.astro`; el `Hero.astro` viejo (el del sprite) se borró. `/lab` monta el mismo `Hero`
  con el patrón de cada variante (`pattern`, `cursor`, `intro`), así que lo que se ve en el
  laboratorio es lo que va a producción.
- El copy está en `src/i18n/ui/{es,en}.ts` (`hero.lead`, `hero.ask`, `hero.askPlaceholder`,
  `hero.askSubmit`), con la bajada en «nosotros». **Falta** la voz del resto del sitio, que sigue en
  primera persona singular («Escríbeme», «Cuéntame…»).
- Se quitaron el pool de sprites del hero viejo (monograma y saludo) y el programa `loop` del
  runner, que solo usaba ese pool.

**El peso.** Cada patrón vivo se baja aparte (`LOADERS` en `live-patterns.ts`), solo en la página
que lo usa: la home no paga los del laboratorio. En el build:

- Todas las páginas: 15,4 KB gz de JS en archivos (ClientRouter 4,7, prefetch 1,1, la grilla 9,5)
  más 1,5 KB de scripts inline (el tema y el header, entre otros).
- La home suma cosmos: 4,6 KB gz (4,0 de `live-cosmos` con la gravedad y 0,65 de `live.ts`).
  Queda en 20,0 KB en archivos, justo en el presupuesto, y en 21,5 con los inline. Cosmos es el
  patrón más pesado.

**El header** (`SiteHeader.astro`), como se acordó en la sección 7:

- La barra va fija y el `<header>` guarda su alto en el flujo: compactarla no mueve la página.
- Arriba de todo: 64 px, transparente. Al bajar más de 8 px: 44 px (`--header-compact-h`), con
  fondo al 90 % de `--bg` y la línea fina (`--line`).
- Bajo 768 px (el corte `md:`), además, se esconde al bajar (pasados 64 px) y vuelve compacto al
  subir. Hace falta moverse 6 px para que cambie de rumbo, y no se esconde si algo suyo tiene el
  foco.
- El prompt: `jm ~/<ruta>▮`. La ruta sale de `promptPath` (`src/i18n/routes.ts`): `~/proyectos`,
  `~/proyectos/<slug>`, `~/contacto`, `~/404`; en inglés, `~/projects`… En la home sigue a la
  sección que cruza el medio de la pantalla, marcada con `data-prompt`: `~/`, `~/proyectos`,
  `~/trayectoria` y `~/contacto` (`timeline.path` en el diccionario).
- **En un teléfono (bajo 640 px) la ruta no se muestra:** no entra junto a la navegación, y el
  prompt queda en `jm▮`. Desde 640 px, si una ruta no entra, se corta con «…».
- El cursor ▮ es un bloque en ámbar dibujado con CSS (no depende de que la fuente tenga el
  carácter) y parpadea; quieto con movimiento reducido.
- Al navegar, el header de la página nueva toma el estado de su scroll sin animarlo
  (`data-settling`).

## 13. 2026-10-15: header compacto, barrido y escritura

**El header** deja de cambiar de alto: mide 44 px (`--header-h`) desde la carga. Arriba de todo
sigue transparente y, al bajar más de 8 px, toma el fondo al 90 % de `--bg` y la línea fina
(`data-scrolled`). Se fue `--header-compact-h`. Con el header más bajo, el hero empieza 20 px antes.

**El tornado llega al header.** Su cima (`SUMMIT` en `live-cosmos.ts`) estaba al 3 % del alto de la
caja, y con el header de 64 px quedaba un hueco de unos 25 px entre ambos. Ahora es 0: el tornado
sube hasta el borde de arriba del hero, justo bajo el header.

**La entrada.** La home volvió al barrido de las otras páginas: `Hero.astro` usa `intro = 'sweep'`
por defecto. El fundido sigue en el motor para `/lab/cosmosv2`.

**Escritura tecla a tecla** (`src/lib/typewriter.ts`, 0,9 KB gz). Para pasar de un texto a otro
borra hasta lo que tienen en común y escribe el resto: de `~/proyectos` a `~/proyectos/atlas` solo
escribe `/atlas`. Cada tecla tarda entre 55 y 115 ms, al azar; cada borrado, 30 ms; entre borrar y
escribir hay una pausa de 200 ms. Si el destino cambia a mitad de camino, sigue desde donde está.
Mientras escribe marca `data-typing`. Con movimiento reducido, cambia de golpe.

- **El prompt del header** escribe la ruta al entrar y salir de las secciones de la home y al
  cambiar de página. En la página nueva, `astro:before-swap` copia la ruta que se ve al documento
  que entra, y el prompt la cambia desde ahí hasta la suya (`data-prompt-path`). En la primera carga
  no escribe nada: la ruta ya viene en el HTML. En reposo, arriba de la home, queda `jm ~/▮`. El
  cursor parpadea solo con la página bajada: arriba de todo (en cualquier página) y mientras
  escribe, queda quieto.
- **La pregunta del hero** rota entre las de `hero.asks`, con la misma escritura:
  «¿qué quieres construir?», «¿necesitas hacer una consulta?», «¿quieres aplicar la IA en algún
  proyecto?», «¿tienes alguna propuesta?», «¿pasas a saludar?» y un guiño, «escucha algo de música
  aquí», con «aquí» enlazado a la radio (nex-radio.com, en otra pestaña).
  - Cada pregunta trae su ejemplo para el input, que cambia cuando la pregunta termina de escribirse.
  - Cada una queda 4,5 s. La rotación espera, con la pregunta completa, si el puntero o el foco están
    en el formulario, si ya hay algo escrito en el input o si el hero no está a la vista: no cambia
    lo que alguien lee, responde o está por tocar, como el enlace.
  - Con movimiento reducido no rota: queda la primera.
  - Todas las preguntas van invisibles en la misma celda de una grilla (`.ask-ghost`) y reservan el
    alto de la más larga, así el input no salta. Desde 768 px van en una línea, como el nombre; en
    un teléfono, la más larga ocupa dos.
  - El input se llama siempre como la primera pregunta (`aria-label`): su nombre no cambia con la
    rotación.
  - Su cursor aparece solo mientras escribe y no parpadea: el que parpadea es el del header.

**La voz.** La bajada y las preguntas pasaron a primera persona singular («Construyo productos web
completos…»), como el resto del sitio; el «nosotros» quedó atrás.

**El peso.** Las páginas pasan de 15,4 a 16,9 KB gz en archivos: el script del header ahora es un
archivo (importa la escritura) y ya no va inline, y se suma `typewriter` (0,9). Los inline bajan de
1,5 a 0,6 KB. La home suma cosmos (4,6) y la rotación (0,6): 22,1 KB en archivos más 0,9 inline. El
presupuesto de 20 KB es una referencia que se puede pasar un poco.

## 14. 2026-10-15: ajustes para móvil, tras probar en teléfonos

La preview (`preview.johnmcan.dev`, `pnpm deploy:preview`) se probó en iPhone (Safari y Chrome) y en
Android.

**El fondo parpadeaba en Safari de iOS al hacer scroll.** Con `inset: 0`, el fondo fijo seguía el
alto de la barra del navegador, que se encoge al bajar: cada cuadro cambiaba su tamaño, el runner
re-medía el canvas y eso lo borraba. Ahora mide `100lvh` (`GridField.astro`).

**Los glifos, en su propia pantalla.** En un teléfono, el glifo se imprimía en el campo fijo y no
acompañaba al scroll (en iOS se entrecortaba), y como había un solo escenario, solo la fila del
centro mostraba el suyo: el resto de las cajas a la vista quedaba vacío. Ahora, bajo `md:`, cada
sprite sostenido se dibuja en un canvas dentro de su caja (`screens.ts`; ver la guía de la grilla,
«Pantallas propias»). En la lista, cada fila a la vista muestra su glifo: la activa en ámbar y el
resto en blanco al 50 % (lo eligió el usuario entre tres opciones). Lo mismo en el detalle de un
proyecto y en el 404. Escritorio sigue igual: el panel sticky en el campo.

**Cosmos en una caja vertical** (`PORTRAIT_TEMPO`): el usuario pidió que en el teléfono empiece y
llegue al tornado más rápido, con menos materia dispersa al inicio y el mismo tornado.

- Una parte de la materia (20 %) arranca ya en la franja, a 0,12 del ancho del eje, y el tirón
  inicial sube de 0,06 a 0,08 (con 0,12 la densidad del eje ya cumplía el colapso y el tornado
  nacía al instante, sin arranque).
- Colapso a 3 veces la masa media (no 4), plazo de 1,5 s (no 4), giro en 1,2 s (no 2,5), captura
  al doble y succión de 9 a 14.
- Medido en una caja de teléfono: nace a los ~0,7 s (antes, 2,2), arranca con el 20 % de la materia
  lejos del eje (antes, 28 %) y a los 3 s orbita el 86 % (antes, a los 6). La cantidad de materia
  no cambia: al final orbita toda.

**El tornado ya no cruza el borde.** El eje sigue a la franja y, en una caja vertical, se iba hasta
el 0,90 del ancho: el embudo, ancho arriba, cruzaba el borde derecho y asomaba por la izquierda.
Ahora la pared del embudo no pasa de los bordes (`EDGE`), y en vertical la succión y la captura usan
la distancia de la caja, no la periódica (la materia libre cruzaba el borde para llegar al eje por
el otro lado). Con la materia más junta al inicio, el eje queda entre 0,60 y 0,71 del ancho. Lo
cubre un test («cosmos solo, vertical: el tornado no cruza al otro borde»).

**El tornado no se corrige una vez formado.** El eje seguía a la franja hasta 5 s después de
nacer, y en el teléfono se veía correrse hacia la izquierda, como un ajuste (mediana 2,5 % del
ancho, hasta 6,4 %; más si el dedo atrae materia). Ahora, en una caja vertical, la sigue solo
mientras el tornado no se ve (giro bajo 0,25, `followSpin` de `PORTRAIT_TEMPO`): una vez visible,
queda donde nació. Escritorio sigue igual (ahí la franja se forma más tarde y el eje la acompaña):
comparado cuadro a cuadro con la versión anterior, no cambia ni un píxel.

**El header en un teléfono** (bajo 640 px) ya no se esconde al bajar. La ruta no entra junto a la
navegación, así que muestra una o la otra: arriba de todo y al subir, `jm▮` y la navegación; al
bajar (pasados 64 px), solo el prompt, que escribe `~/<ruta>` con todo el ancho. Al subir, primero
borra la ruta y recién entonces vuelve la navegación. El `~/` ahora se escribe con la ruta.

La ruta de la home cambiaba cuando el borde de la sección cruzaba el medio de la pantalla: con el
margen de arriba de cada sección, el header decía `~/proyectos` con el título todavía abajo. Ahora
cambia cuando ese borde pasa un cuarto de la pantalla (`SECTION_LINE`), con el título a ~37 % del
alto; al llegar al final de la página, la ruta es la de la última sección.

**El hero en un teléfono.** La bajada baja de 22 a 18 px (`text-lg`, desde `sm:` vuelve a
`text-lead`): pesaba tanto como la pregunta. La pregunta rotativa queda abajo en su celda, junto al
input: una de una línea se escribe en la fila de abajo y una de dos empieza ahí y sube al cortarse
(la celda sigue reservando el alto de la más larga). El `>` es parte de la primera línea, con
sangría francesa, y el cursor ya no ocupa ancho: antes saltaba solo a la segunda línea.

**El gesto atrás en Chrome para iOS** salía del sitio: de inicio a /proyectos, atrás llevaba a una
pestaña vacía. En Safari, Chrome para Android y Brave para Android andaba bien. El router de Astro
crea la entrada de cada página al terminar de bajarla, de forma asíncrona, y WebKit la marca como
creada sin interacción; Chrome para iOS, al volver desde una entrada así, se salta también la
anterior (la que el usuario cree estar viendo) y sale del sitio (ver
[withastro/astro#11919](https://github.com/withastro/astro/issues/11919), cerrado sin arreglo).
Un script inline en `BaseLayout.astro`, solo en Chrome, Edge y Firefox para iOS, crea la entrada en
el mismo toque, con la forma del estado del router, antes que él: el router la encuentra puesta y
no la repite. Probado emulando su user agent: una entrada por navegación, atrás y adelante a la
página correcta, el scroll recuperado y el formulario del hero; en un iPhone falta confirmarlo.

**La página de contacto** (pedido del usuario: en móvil se veía tosca), en los dos anchos: en un
teléfono el formulario va enseguida y el correo directo queda abajo, como alternativa; en
escritorio, dos columnas como antes. Se suma la línea de disponibilidad del hero; los campos van
rellenos y solo con la línea de abajo (`.field-line`), en ámbar con el foco; las etiquetas, en gris
y sin negrita; el botón, a todo el ancho en un teléfono.

**La página de proyectos**, pulida según su función (un índice para elegir trabajo): el título más
cerca del header y la bajada a 18 px en un teléfono, más una línea de índice («4 proyectos ·
2023–2026», `projects.indexCount`). En las filas (también las de la home), el resumen va junto al
glifo, ahora de 96 px, y el año con el stack debajo, a todo el ancho: en la columna angosta se
cortaban en dos líneas.

## 15. 2026-10-15: navegación

Las páginas internas no tenían cómo volver. Lo que se acordó con el usuario:

- **Subir, no volver.** Un enlace arriba del título, a la izquierda, sube un nivel: «← Inicio» en
  proyectos y contacto, «← Proyectos» en el detalle (`UpLink.astro`). No usa el historial: quien
  llega directo a una página, desde un buscador o un enlace compartido, saldría del sitio. Es texto
  en blanco, del tamaño del cuerpo, con una flecha y 44 px de área de toque; reemplaza al «Todos los
  proyectos» chico y gris del detalle, que no se veía ni estaba donde se busca la navegación.
- **El prompt como migas**, en todos los anchos: `jm` y `~` llevan al inicio, `proyectos` a la
  lista; la página actual no es enlace. Toda la ruta va en gris, como antes. Mientras escribe es texto; escrita la ruta,
  sus tramos pasan a ser enlaces. En la home la ruta sigue a la sección y no tiene migas.
- **El header en un teléfono:** en la home, como antes: la navegación arriba y al subir, la ruta al
  bajar. En las demás páginas, la ruta fija con el idioma y el tema; la navegación no aparece. Sus
  migas se tocan en casi todo el alto del header. La ruta llegó a ir a 11 px (el tamaño nativo de
  Departure Mono) para que entrara completa; el usuario prefirió dejarla a 22 px, como `jm`, y
  abreviar los tramos de arriba a su inicial, como en fish: `jm ~/p/atlas` (la miga `p` se lee
  «proyectos»). En escritorio la ruta va entera.
- **El footer** suma las secciones (Inicio, Proyectos, Contacto): en un teléfono, fuera de la home,
  son la forma de pasar de una a otra sin volver al inicio.
- Escritorio: el header se ve igual; suma las migas.

Pendiente: rediseñar el detalle de proyecto antes de pasar a producción (pedido del usuario).
