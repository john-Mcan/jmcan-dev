---
title: NEX
summary: Experiencia en vivo donde la audiencia decide qué suena después
year: 2026
role: 'Todo: producto, backend, web y app móvil'
stack:
  [Flutter, NestJS, Next.js, PostgreSQL, Redis, Socket.IO, AzuraCast, Cloudflare, Firebase, Vercel]
status: prelaunch
glyph: eq
featured: true
order: 3
links:
  live: https://nex-radio.com
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
escuchas, usas tu influencia para elegir qué suena después, participas en el chat y en eventos, y
ves el resultado al instante.

La idea es que sea un punto de encuentro para los fandoms, donde escuchan juntos y compiten para que
suene su grupo.

<!-- capturas -->

## Qué hice

Lo construí solo, de punta a punta: el producto, la API en NestJS, la base de datos, la web en
Next.js y la app nativa en Flutter para iOS y Android.

La decisión central fue que el backend dirija la radio. Elige cada canción, la empuja a la cola de
Liquidsoap y avisa del cambio en el instante exacto, con el AutoDJ de AzuraCast como respaldo: así,
la canción que gana la votación suena justo a continuación. El estado en vivo (votos, oyentes, cola)
vive en Redis y llega a todos por Socket.IO, y la influencia se calcula en el servidor y se acredita
al consultarla, sin escribir en la base cada minuto por cada oyente.

## Estado

Está en preparación para el lanzamiento. En [nex-radio.com](https://nex-radio.com) ya puedes
escuchar la radio sin registrarte y reservar tu lugar en la lista de espera.
