---
title: NEX
summary: Experiencia en vivo donde los fandoms compiten por mantener a sus favoritos en la cima
year: 2026
role: 'Todo: producto, backend, web y app móvil'
stack:
  [Flutter, NestJS, Next.js, PostgreSQL, Redis, Socket.IO, AzuraCast, Cloudflare, Firebase, Vercel]
status: prelaunch
glyph: eq
featured: true
order: 4
links:
  live: https://nex-radio.com
  demo: https://dev.nex-radio.com
shots:
  - src: ../shots/nex/landing.png
    alt: 'Landing de NEX con el título «Tu fandom decide qué suena.», el botón para reservar un lugar y un reproductor en vivo con la canción que está sonando.'
    caption: 'nex-radio.com: ya se puede escuchar la radio sin registrarse, mientras se llena la lista de espera.'
---

## Contexto

Los fandoms musicales tienen muchísima energía: quieren participar, votar, competir y que su grupo
suene. La radio tradicional no les da espacio para eso.

## Qué es

Es una radio interactiva en tiempo real donde la audiencia decide la programación. Mientras
escuchas, usas tu influencia para votar qué suena después, participas en el chat y en eventos, y ves
el resultado al instante.

Cada voto suma también al fandom del artista. Los rankings de la semana, del mes y el histórico
muestran qué fandoms van arriba, con sus canciones y sus fans más activos, y cada fandom compite por
mantener a sus favoritos en la cima.

<!-- capturas -->

## Qué hice

Lo construí solo, de punta a punta: el producto, la API en NestJS, la base de datos, la web en
Next.js y la app nativa en Flutter para iOS y Android.

La decisión central fue que el backend dirija la radio. Elige cada canción, la empuja a la cola de
Liquidsoap y avisa del cambio en el instante exacto, con el AutoDJ de AzuraCast como respaldo: así,
la canción que gana la votación suena justo a continuación. El estado en vivo (votos, oyentes, cola)
vive en Redis y llega a todos por Socket.IO, y la influencia se calcula en el servidor y se acredita
al consultarla, sin escribir en la base cada minuto por cada oyente. Los rankings de fandoms se
recalculan al cerrar cada ronda con votos, en una sola consulta para los tres períodos, y las
páginas los leen desde Redis.

## Estado

Está en preparación para el lanzamiento. En [nex-radio.com](https://nex-radio.com) ya puedes
escuchar la radio sin registrarte y reservar tu lugar en la lista de espera. La demo web funcional
está en [dev.nex-radio.com](https://dev.nex-radio.com), y NEX tiene además un cliente móvil nativo
para iOS y Android.
