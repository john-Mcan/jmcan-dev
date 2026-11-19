---
title: vriza
summary: 'Agentes de IA que atienden a clientes de un negocio: recuerdan, aprenden y actúan solos'
year: 2026
role: 'Producto, IA y desarrollo full-stack'
stack:
  [
    TypeScript,
    Hono,
    Next.js,
    PostgreSQL,
    pgvector,
    Mastra,
    RAG,
    WhatsApp Cloud API,
    Mercado Pago,
    Railway,
  ]
status: prelaunch
glyph: chat
featured: true
order: 3
links:
  live: https://vriza.cl
shots:
  - src: ../shots/vriza/landing.png
    alt: 'Landing de vriza con el título «Tu agente de WhatsApp, sin complicaciones», el precio desde $17.990 al mes y el botón «Probar gratis 7 días». Al lado, una conversación de WhatsApp con una pastelería de ejemplo: el agente responde el precio, el plazo y la dirección, y lo que no sabe se lo pasa a una persona del equipo.'
    caption: 'La landing de vriza.cl, con una conversación de ejemplo tal como la ve el cliente en WhatsApp.'
---

## Contexto

Muchos negocios pequeños y profesionales independientes atienden a sus clientes por WhatsApp, y las
mismas preguntas llegan todo el día: precios, horarios, stock, cómo hacer un pedido. Contestarlas a
tiempo le quita horas al dueño o a su equipo, y los mensajes que llegan de noche esperan hasta el
día siguiente.

## Qué es

Con vriza, un agente de IA atiende a los clientes por WhatsApp en nombre de un negocio o de un
profesional que trabaja solo. Se configura en cuatro pasos desde el navegador: le cuentas a qué se
dedica tu negocio y en qué tono hablar, le enseñas lo que sabes con tu sitio web, un archivo o un
texto, lo pruebas y conectas tu número.

El agente responde con lo que le enseñaste y recuerda a cada cliente: guarda sus datos y un resumen
de cada conversación, y los tiene presentes cuando esa persona vuelve a escribir. Cuando no
encuentra una respuesta, se lo dice al cliente y te avisa, y tú tomas la conversación desde el panel
o desde tu teléfono. Si alguien del equipo responde, el agente se hace a un lado.

<!-- capturas -->

## Qué hice

Lo diseñé y lo construí solo, para que el agente trabaje por el negocio: agendar y reagendar citas
en Google Calendar, cumplir un «te escribo el jueves», perseguir un objetivo con cada contacto,
consultarle al equipo lo que no sabe y llevarle la respuesta al cliente, o llamar a la API del
negocio para revisar un pedido o el stock. Todas esas acciones pasan por una sola puerta que las
autoriza, les fija un presupuesto diario, las registra y evita que un reintento las repita.

Para responder usa RAG: lo que cada negocio le enseña se indexa en PostgreSQL con pgvector, y en
cada mensaje el agente busca por significado y por palabras, reordena los resultados y responde con
lo que encontró. Si no encuentra nada, unas reglas le impiden inventar.

La memoria es por contacto: el agente anota los datos estables de cada cliente, con su origen y su
antigüedad, y al cerrar una conversación guarda un resumen. También aprende del equipo: la respuesta
a una consulta puede quedar guardada como conocimiento, y la próxima vez contesta solo. Todo corre
en una sola plataforma para muchos negocios, con los datos de cada uno aislados en la base de datos.

## Estado

Está en preparación para el lanzamiento, partiendo por Chile, y las acciones se suman en la etapa
siguiente. En [vriza.cl](https://vriza.cl) puedes ver cómo funciona y sus precios.
