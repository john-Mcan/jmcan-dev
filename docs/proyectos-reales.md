# Proyectos reales: contenido, glifos y layout del detalle

Borrador al 2026-10-16 para reemplazar los proyectos de ejemplo (Atlas, Relay, Vertex, Beacon) en
`src/content/projects/{es,en}/`. Sale de una lectura general de cada repo: README, documentos de
visión, logo y fechas de git. Está escrito para un visitante: dice qué es cada proyecto y para qué
sirve, no cómo está construido por dentro (nada de arquitectura, modelo de datos, reglas de negocio
ni cifras internas).

Voz: primera persona del singular, como el resto del sitio («diseñé», «construí»). En Revra, en
plural cuando corresponde, porque es cofundada.

## Implementado (2026-10-16)

Los cinco proyectos, sus glifos y el detalle nuevo ya están en el sitio. Lo que cambió respecto de
este borrador al implementarlo:

- **Licencias.** Ninguno de los dos repos es _open source_: orientame.cl usa una licencia propia de
  consulta y contribución, y Chucao, PolyForm Noncommercial. Los textos dicen «código publicado» y
  «abierto a aportes», nunca «código abierto», y cada sección Aporta resume qué permite la
  licencia. El resumen de Chucao pasó a «… simple y con el código publicado».
- **Estado:** `status` (`live`, `prelaunch`, `building`, `paused`) más `contributions: true` en los
  abiertos a aportes; la ficha dice, por ejemplo, «En línea, abierto a aportes». Revra y Chucao
  (su `PROGRESS.md` dice «en desarrollo activo») van en `building`; NEX, en `prelaunch`;
  orientame, en `live`; Fandoms, en `paused`.
- **Período:** `yearEnd` opcional (Fandoms: 2025–2026), también en las listas.
- **Enlaces:** `links.store` opcional; ningún proyecto lo usa aún.
- **Capturas:** `shots` (imagen, texto alternativo y pie), en `src/content/projects/shots/<slug>/`.
  Van donde el texto tenga `<!-- capturas -->`; si no lo tiene, al final. Las verticales (de
  teléfono) van en fila; las horizontales, una debajo de otra, al ancho del texto (65ch). El texto
  va justificado y con guiones (`hyphens: auto`), en todos los anchos. orientame.cl lleva dos, tomadas del
  sitio en vivo: el inicio y un camino de «Empezar». Revra (su landing), NEX (su landing, con el
  reproductor en vivo) y Fandoms.io (la página de un fandom) llevan una cada uno, que dejó el
  usuario. Chucao, ninguna por ahora.
- **Secciones:** Contexto, Qué es, Qué hice y Estado o Aporta en todos; orientame suma Privacidad.
  Chucao no tenía Contexto y se le escribió uno corto. Revra y NEX cierran su Estado con un enlace
  (programa piloto, lista de espera).
- **Lo verificado:** los cuatro sitios están en línea. nex-radio.com es una lista de espera (beta,
  sin enlaces a tiendas); revra.io, la landing con el programa piloto; orientame.cl, publicado (ya
  no dice «en desarrollo»); fandoms.io sigue en línea, así que lleva «Ver sitio».
- **Glifos:** `loop`, `eq`, `path` y `zap` son nuevos y `orbit` se mantiene; los de ejemplo se
  borraron. Se revisaron con una hoja de cuadros a la escala de la grilla (440 px con celdas de
  6 px y 96 px con celdas de 3 px); `path` se engrosó porque a esa escala apenas se veía.
- **El detalle:** como en la propuesta de abajo, más un cierre con «¿Quieres construir algo así?»
  y el botón a contacto, antes del siguiente proyecto. El glifo del siguiente va en la paleta de
  base (`<Stage tone="base">`): el ámbar queda para el proyecto que se lee.

Confirmado por el usuario: «34.000 usuarios registrados» se publica tal cual (lo respaldan los
datos de Supabase) y el reproductor se llama «Chucao». Queda pendiente:

- Una captura de Chucao (la ventana con canales).
- Los enlaces a tiendas de NEX, cuando se publiquen las apps.

## Resumen

| #   | Proyecto      | Destacado | Período   | Estado                 | Glifo propuesto            | Enlaces                       |
| --- | ------------- | --------- | --------- | ---------------------- | -------------------------- | ----------------------------- |
| 1   | Revra         | Sí        | 2026      | MVP en desarrollo      | `loop`: el ciclo se cierra | revra.io                      |
| 2   | NEX           | Sí        | 2026      | Prelanzamiento         | `eq`: la audiencia decide  | nex-radio.com                 |
| 3   | orientame.cl  | Sí        | 2026      | En desarrollo, abierto | `path`: el siguiente paso  | orientame.cl · GitHub         |
| 4   | Fandoms.io    | No        | 2025–2026 | En pausa               | `orbit` (ya existe)        | fandoms.io, si sigue en línea |
| 5   | Chucao (IPTV) | No        | 2026      | Abierto a aportes      | `zap`: cambio de canal     | GitHub                        |

El orden en las listas (`order`) sigue la tabla: los tres destacados (`featured: true`) van a la
selección de la home.

## Recomendaciones

- **Capturas:** solo en la página de cada proyecto, nunca en la lista ni en la home, y solo donde
  sumen. NEX, Fandoms (está en pausa) y Chucao (no tiene demo en vivo) llevarían de 1 a 3;
  orientame, 1 o 2; Revra, ninguna, porque es un MVP privado. Detalle en
  [Capturas y enlaces en vivo](#capturas-y-enlaces-en-vivo).
- **Enlaces:** en vivo y a GitHub siempre que existan, como botones visibles.
- **Página de proyecto:** hoy, en un teléfono, el glifo aparece antes del título; los enlaces
  quedan escondidos bajo la ficha; no hay dónde decir si un proyecto está en pausa o abierto a
  aportes, ni un rango de años, ni lugar para capturas; y al terminar de leer no hay a dónde
  seguir. Propuesta (detalle en [El detalle de proyecto](#el-detalle-de-proyecto-proyectosslug)):
  - título, resumen, ficha y enlaces arriba, con el glifo después;
  - las mismas secciones en todos los proyectos;
  - capturas opcionales;
  - un pie que lleve al siguiente proyecto;
  - campos nuevos en el schema: `status`, un rango de años, enlace a tiendas y capturas.
- **Licencias:** orientame.cl e iptv-player no tienen `LICENSE` (y el README del reproductor dice
  «uso privado»). Se revisan antes de implementar, porque las fichas invitan a aportar.

---

## 1. Revra

- **slug:** `revra`
- **title:** Revra
- **summary (≤ 90):** «Agentes que se hacen cargo de las cuentas por cobrar, de la factura al pago» (75)
- **year:** 2026
- **role:** «Cofundador; integraciones y producto»
- **stack (≤ 6):** TypeScript, Node.js, Next.js, PostgreSQL, Supabase
- **links:** live `https://revra.io` (la landing, con solicitud de acceso)
- **Glifo:** `loop`. El logo es una flecha circular. Un arco se traza solo alrededor de un centro
  hasta cerrar el círculo, la punta de flecha llega a su origen, el anillo late una vez y vuelve a
  empezar. Es literalmente la promesa del producto: cerrar el ciclo entre la factura y el pago.

### Texto

**Contexto.** El software para empresas suele ser una herramienta más que aprender a usar: registra,
ordena y avisa, pero el trabajo lo siguen haciendo personas. En cobranza B2B, ese trabajo es
repetitivo, está repartido en varios sistemas y depende de mucha coordinación manual.

**Qué es.** Revra recibe un objetivo, cobrar, y se hace cargo del proceso completo: entiende qué
se debe, sigue cada factura, conversa con los clientes, resuelve lo que se traba y concilia el
pago. Las personas intervienen solo cuando una decisión necesita criterio humano. Lo vemos como el
paso siguiente al uso simple de agentes: delegar más y recibir resultados, no asistencia.

**Qué hice.** Soy cofundador. Construimos desde cero las integraciones que conectan los agentes con
los sistemas que la empresa ya usa, y el producto web.

**Estado.** MVP en desarrollo, por fases; parte en Chile.

> Ojo con el detalle: no mencionar fuentes de datos concretas, flujos de importación ni reglas de
> asignación. «Cuentas por cobrar B2B» y «agentes en flujos transaccionales» bastan.

---

## 2. NEX

- **slug:** `nex`
- **title:** NEX
- **summary:** «Radio en vivo donde la audiencia decide qué suena después» (57)
- **year:** 2026
- **role:** «Todo: producto, backend, web y app móvil»
- **stack:** Flutter, NestJS, Next.js, PostgreSQL, Redis, AzuraCast
- **links:** live `https://nex-radio.com` (verificar qué ve hoy un visitante; si las apps llegan a
  las tiendas, sumar `store`)
- **Glifo:** `eq`. El logo son cuatro cuadrantes (N, E, X y uno vacío). Un ecualizador de barras
  que sube y baja con la música; cada tanto una barra «gana», crece por encima del resto y se
  convierte en el siguiente tema: las demás bajan y empieza otra ronda. Alternativa más cercana al
  logo: una grilla 2×2 donde las celdas se encienden en secuencia y una queda marcada.

### Texto

**Contexto.** Los fandoms musicales tienen una energía enorme: quieren participar, votar, competir
y que su grupo suene. La radio tradicional no les da lugar para eso.

**Qué es.** Una radio interactiva en tiempo real. La programación no la decide un editor sino la
audiencia: mientras escuchas, usas tu influencia para elegir qué suena después, participas en el
chat y en eventos, y ves el resultado al momento. Un punto de encuentro entre fandoms y una
evolución del entretenimiento radial.

**Qué hice.** Todo: el producto, la arquitectura, la base de datos, la integración con el servidor
de streaming, la API de medios y audio, la aplicación web y la app nativa para iOS y Android.

**Estado.** En preparación para el lanzamiento.

> Dejar fuera: la economía de influencia (tasas, costos, topes), anuncios con recompensa, precios y
> la voz del DJ con IA, salvo como mención general si se quiere.

---

## 3. orientame.cl

- **slug:** `orientame`
- **title:** orientame.cl
- **summary:** «Un primer paso para buscar apoyo en salud mental, sin cuentas ni rastreo» (72)
- **year:** 2026
- **role:** «Todo: producto, contenido y desarrollo»
- **stack:** Astro, TypeScript, Preact, Pagefind, Cloudflare
- **links:** live `https://orientame.cl`, repo `https://github.com/john-Mcan/orientame.cl`
- **Glifo:** `path`. «Un puente entre la intención y la acción»: una senda de pasos que avanza de
  un punto a otro; los pasos de atrás se apagan mientras avanzan los de adelante, porque nada
  persiste. Alternativa: una brújula cuya aguja oscila y se asienta (el logo es un círculo con una
  figura que orienta).

### Texto

**Contexto.** Dar el primer paso para buscar ayuda en salud mental cuesta: no se sabe por dónde
empezar, qué opciones existen ni qué decir en una primera atención.

**Qué es.** Un sitio sin fines de lucro, pensado inicialmente para Chile, que ayuda a entender las
opciones y a dar un siguiente paso posible, si la persona decide darlo: informarse, preparar qué
decir, encontrar una alternativa pública o de bajo costo, usar una autoevaluación orientativa, o
detenerse y volver después. No diagnostica ni reemplaza una atención profesional, y la información
de urgencia está siempre a mano.

**Privacidad.** Todo ocurre en el navegador: sin cuentas, sin cookies, sin trackers y sin guardar
respuestas. Lo que escribes no sale de tu dispositivo.

**Qué hice.** Todo: producto, contenido y desarrollo.

**Aporta.** El código es abierto y cualquier aporte es bienvenido (enlace a GitHub).

> Pendiente del repo: no tiene archivo `LICENSE`. Si se invita a aportar, conviene elegir una
> (MIT para el código y CC BY-SA para el contenido, por ejemplo). Verificar también si el sitio ya
> está publicado: el README dice «en desarrollo».

---

## 4. Fandoms.io

- **slug:** `fandoms`
- **title:** Fandoms.io
- **summary:** «Red social para fans de América Latina: 34.000 registrados» (59)
- **year:** 2025 (empezó como 7Kpop en marzo de 2025)
- **role:** «Todo: diseño, desarrollo, base de datos y seguridad»
- **stack:** Next.js, React, TypeScript, Supabase, Tailwind CSS
- **links:** live `https://fandoms.io` solo si sigue en línea; si no, sin enlace y con capturas
- **Glifo:** `orbit` (el que ya existe, discos que orbitan). El logo es una «F» en un planeta con
  un anillo y satélites: calza casi sin cambios. Si se quiere uno propio, un planeta con anillo
  inclinado y un satélite.

### Texto

**Contexto.** Los fans latinoamericanos se reunían en redes generales, donde las comunidades se
pierden entre todo lo demás.

**Qué es.** Un prototipo de red social hecha para fandoms: cada comunidad con su espacio, sus
publicaciones, votaciones, insignias y moderación propia. Llegó a 34.000 usuarios registrados.

**Qué hice.** Fue el primer proyecto grande que construí solo, del diseño de la interfaz a la base
de datos y la seguridad.

**Estado y aprendizaje.** Hoy está en pausa. Lo considero mi gran escuela: moderación, comunidades
reales, rendimiento y seguridad con usuarios de verdad. Mucho de lo que hay en NEX nació acá.

---

## 5. Chucao (IPTV Player)

- **slug:** `chucao`
- **title:** Chucao
- **summary:** «Reproductor de listas IPTV para Windows, simple y de código abierto» (66)
- **year:** 2026
- **role:** «Todo: diseño y desarrollo»
- **stack:** C#, .NET 8, WPF, LibVLC
- **links:** repo `https://github.com/john-Mcan/iptv-player`
- **Glifo:** `zap`. Una pantalla de TV: estática que se ordena en una imagen, un corte, estática
  otra vez (cambio de canal). Alternativa: el chucao del logo, un pájaro en pixel art que salta.

### Texto

**Qué es.** Un reproductor para Windows: pegas la dirección de una lista IPTV y tienes los canales
ordenados por categoría, búsqueda, favoritos, pantalla completa y ventana flotante. Si la señal se
corta, se reconecta solo.

**Qué hice.** Todo: interfaz y desarrollo. Lleva el nombre del chucao, un pájaro del bosque del sur
de Chile.

**Aporta.** Repositorio abierto para revisar, mantener y mejorar.

> Pendiente del repo: el README dice «Licencia: uso privado» y no hay `LICENSE`, lo que contradice
> invitar a aportar. Conviene publicar una licencia (MIT, por ejemplo) y, si se puede, un
> ejecutable en Releases para que quien llega desde el sitio pueda probarlo sin compilar.

---

## Capturas y enlaces en vivo

**Enlaces: sí, siempre que exista algo que ver.** Es lo que más le sirve a un visitante. Un botón
claro «Ver en vivo» y, en los abiertos, «Código en GitHub».

**Capturas: sí, pero solo en el detalle y solo donde aportan.** Nunca en la lista ni en la home: la
identidad del sitio es la grilla y los glifos, y ahí una captura compite con el glifo y pesa más.

| Proyecto     | Capturas                                 | Por qué                                                        |
| ------------ | ---------------------------------------- | -------------------------------------------------------------- |
| NEX          | 2–3 del teléfono (reproductor, votación) | Es un producto visual y la app no se puede probar desde la web |
| orientame.cl | 1–2 (inicio, orientador)                 | Aunque esté en vivo, muestra el tono antes de hacer clic       |
| Fandoms.io   | 2–3 (feed, página de un fandom)          | Está en pausa: es la única forma de mostrarlo si sale de línea |
| Chucao       | 1 (ventana con canales)                  | No hay demo en vivo; hay que compilar o descargar              |
| Revra        | Ninguna por ahora                        | MVP privado y B2B; la landing basta                            |

Formato: `astro:assets` (AVIF/WebP), `loading="lazy"`, ancho fijo, sin datos reales de usuarios
(revisar nombres y fotos en las de Fandoms). Marco sobrio con la línea de los tokens, sin sombras.

## El detalle de proyecto (`/proyectos/<slug>`)

Hoy (`src/views/ProjectView.astro`): enlace para subir; a la izquierda, en 5 columnas fijas al hacer
scroll, el glifo cuadrado, la ficha (rol, año, stack) y los enlaces; a la derecha, título, resumen y
el texto.

**Problemas:**

1. **En un teléfono, el glifo va antes del título.** La primera pantalla es una caja decorativa y
   el `h1` queda abajo.
2. **Los enlaces quedan escondidos** bajo la ficha, en texto chico. Es la acción principal y no se
   ve.
3. **No hay estado.** «En pausa», «abierto a aportes» o «en desarrollo» cambian cómo se lee cada
   proyecto, y hoy no hay dónde decirlo.
4. **Sin lugar para capturas**, y la columna de 7 sería angosta para ellas.
5. **El final es un callejón:** después del texto no hay a dónde ir, salvo volver arriba.
6. **El año es uno solo**; Fandoms abarca 2025–2026.

**Propuesta:**

1. **Cabecera de lectura:** título, resumen, fila de ficha (rol · período · estado · stack) y los
   botones de enlace, todo arriba. El glifo a la derecha en escritorio (sigue en 5 columnas, ya no
   necesariamente fijo) y, en un teléfono, después de la cabecera, en una franja más baja (16:9 o
   16:10).
2. **Cuerpo con secciones fijas:** Contexto, Qué es, Qué hice y Estado (o Aporta, en los
   abiertos). Mismo orden en todos, fácil de escanear.
3. **Capturas a todo el ancho del contenido**, entre Qué es y Qué hice, con pie de foto. Opcionales
   por proyecto.
4. **Pie con el siguiente proyecto:** nombre, resumen y su glifo pequeño, para recorrer el
   portafolio sin volver a la lista.
5. **Schema** (`content.config.ts`), cuando se implemente:
   - `status`: enum (`live`, `beta`, `building`, `paused`, `open`), con texto en `ui/*.ts`;
   - `period` o `yearEnd` opcional, para rangos;
   - `links.store` opcional;
   - `shots`: lista opcional de imágenes con su texto alternativo.

## Glifos nuevos

Cuatro claves nuevas en `GLYPH_KEYS` (`loop`, `eq`, `path`, `zap`) más `orbit`, que ya existe.
Receta en la sección 3.3 de `docs/grid-field-extending.md`. Los de ejemplo (`cube`, `globe`,
`scope`, `radar`, `network`, `ring`) pueden quedarse en la librería o borrarse cuando nadie los use.
Que cada glifo se lea a escala de la grilla: formas gruesas y movimiento claro, sin detalle fino.

## Pendiente de confirmar

- Qué ve hoy un visitante en nex-radio.com, revra.io, orientame.cl y fandoms.io.
- Si las apps de NEX ya están en las tiendas, y si Fandoms sigue en Google Play.
- Si «34.000 usuarios registrados» puede publicarse tal cual.
- Licencias de orientame.cl e iptv-player (las revisa el usuario antes de implementar).
- El nombre público del reproductor: «Chucao», «IPTV Player» o ambos.
- Textos en inglés para `projects/en/`, a partir de estos.
