---
title: Apolo
summary: 'Sistema operativo por voz para equipos: coordina personas, decisiones y tareas en vivo'
year: 2026
role: 'Producto, arquitectura y desarrollo full-stack'
stack:
  [TypeScript, NestJS, Next.js, Python, LiveKit, ElevenLabs, PostgreSQL, pgvector, Redis, Socket.IO]
status: building
glyph: orb
order: 1
links:
  live: https://apolo.johnmcan.dev/es
shots:
  - src: ../shots/apolo/landing.jpg
    alt: 'Landing de Apolo con el título «Dilo una vez. Apolo se encarga del resto.», los botones «Solicitar acceso» e «Ingresar» y el aviso «En piloto privado · Español e inglés». A la derecha, el orbe azul con sus ojos luminosos junto a un ejemplo de diálogo sobre tareas pendientes y las pestañas Tareas, Memoria, Mensajes y Llamadas.'
    caption: 'La landing en apolo.johnmcan.dev, con el orbe y un ejemplo de interacción por voz.'
---

## Contexto

Los equipos pierden horas coordinándose por escrito: correos, chats, memos y reuniones cortas para
transmitir decisiones que alguien ya dijo en voz alta. Con el paso de los días la información queda
repartida entre canales, las versiones se contradicen y cuesta saber qué sigue vigente y en qué está
trabajando cada persona.

## Qué es

Apolo es un asistente de voz para equipos que lleva el contexto de la operación diaria. Cada empresa
tiene un núcleo aislado de conocimiento donde Apolo guarda decisiones, acuerdos y tareas en curso.
Cualquier persona le habla en lenguaje natural, en español o en inglés, para consultar qué se decidió,
dejar un cambio registrado, enviar un mensaje a otro miembro o delegar una tarea.

Apolo también habla por iniciativa propia: entrega mensajes de viva voz a quien tiene sesión abierta,
hace anuncios generales según los permisos de cada rol y releva entre idiomas para que lo dicho en
español llegue en inglés a quien tiene esa preferencia. Cuando alguien pide hablar con otra persona,
Apolo solicita la audiencia en su dispositivo y, si acepta, abre una llamada de audio o video al
instante. Además detecta si dos personas empiezan a trabajar en lo mismo, avisa cuando una tarea se
cierra y ejecuta acciones en Google Calendar y Slack con confirmación hablada.

<!-- capturas -->

## Qué hice

Lo diseñé y lo construyo solo como un monorepo con un cerebro central en NestJS, un worker de voz en
Python sobre LiveKit Agents y una consola web en Next.js, con los tipos, contratos y el cliente de
sesión aislados en paquetes portables para reutilizarlos en React Native.

El plano de voz corre sobre LiveKit Cloud con transcripción en tiempo real (ElevenLabs Scribe) y
síntesis de baja latencia (Eleven v4 Turbo). El worker mantiene sesiones con dos modos de escucha
(continua manos libres o al pulsar), decide cuándo se le habla a Apolo para ignorar conversaciones
cercanas y entrega avisos proactivos. El cerebro se expone como un endpoint compatible con OpenAI, de
modo que el worker y los canales externos comparten la misma lógica de identidad, permisos y
herramientas.

La memoria vive en PostgreSQL con pgvector y Row Level Security por empresa, con una copia en Redis
para responder en cada turno sin consultar la base. En lugar de borrar hechos antiguos, los invalida
con fecha según el rango de quien declara el cambio; si alguien con menor autoridad contradice una
decisión vigente, queda marcada en disputa. La presencia en tiempo real, las colas de entrega y los
plazos de audiencia corren sobre Redis, BullMQ y Socket.IO, y toda acción con efecto hacia terceros
exige confirmación hablada validada por el servidor.

## Estado

Está en desarrollo activo, con el cerebro, la memoria, el relevo bilingüe, las tareas, las audiencias
en audio y video y las integraciones con Calendar y Slack funcionando de punta a punta. En
[apolo.johnmcan.dev](https://apolo.johnmcan.dev/es) ya se puede ver la vista previa y solicitar
acceso al piloto privado; luego vienen la palabra clave en el dispositivo, los canales externos por
WhatsApp, Discord y teléfono, y las aplicaciones móvil y de escritorio.
