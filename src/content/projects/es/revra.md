---
title: Revra
summary: Agentes que se hacen cargo de las cuentas por cobrar, de la factura al pago
year: 2026
role: 'Producto, diseño y desarrollo'
stack: [TypeScript, Node.js, Fastify, Temporal, Next.js, PostgreSQL, Supabase, API, Microsoft Azure]
status: building
glyph: loop
featured: true
order: 1
links:
  live: https://revra.io
shots:
  - src: ../shots/revra/landing.png
    alt: 'Landing de Revra con el título «Tus cuentas por cobrar, resueltas.», un campo para el correo de trabajo con el botón «Solicitar acceso» y dos tarjetas que llevan de una factura por vencer al pago conciliado. Abajo, los sistemas de los que parte: Defontana, Microsoft 365, Google Workspace, Excel y CSV, la cartola bancaria, el SII y Odoo.'
    caption: 'La landing de revra.io, donde las empresas piden acceso anticipado.'
---

## Contexto

En la cobranza B2B, el trabajo de cada día está repartido entre el ERP, el correo y el banco.
Alguien revisa qué facturas están por vencer, les escribe a los clientes, averigua por qué se
retuvo un pago y lo concilia cuando llega. Es un trabajo repetitivo y exige mucha coordinación
manual.

## Qué es

Revra se conecta al sistema de facturación, al correo de cobranza y al banco de la empresa, y se
encarga de ese trabajo: sigue cada factura, contacta a los clientes desde el correo de la empresa,
resuelve lo que traba un pago y lo concilia cuando llega. La empresa define sus políticas, como el
horario de contacto o los plazos que acepta, y lo que queda fuera de ellas pasa a una persona, con
el contexto y una propuesta.

La autonomía se gana por etapas: Revra parte proponiendo lo que haría sin contactar a nadie,
después opera sobre un grupo acotado de cuentas y amplía su alcance a medida que la empresa lo
aprueba.

<!-- capturas -->

## Qué hice

Revra nació de una idea mía y la construyo con un socio. La diseñé para que una empresa le delegue
un proceso financiero completo a un equipo de agentes: cada caso tiene un objetivo, y los agentes lo
sostienen por semanas, investigan, negocian, esperan respuestas y lo retoman solos hasta cerrarlo.
Los llevé de la idea a trabajar de punta a punta con datos de prueba: ya envían correos reales,
entienden lo que responde cada cliente y deciden el paso siguiente.

La arquitectura está hecha para darles autonomía con control. Temporal sostiene casos que duran
meses, PostgreSQL guarda cada hecho con su fuente, y una política determinística decide qué hacen
solos y qué pasa por una persona. Sobre esa base vienen la memoria de cada cliente, con RAG sobre
los casos resueltos, y las mismas capacidades para la aplicación de pagos, las deducciones y la
gestión de crédito.

## Estado

El MVP está en desarrollo y se lanza por etapas, partiendo por Chile. Lo próximo son las
integraciones directas con el SII y con los ERP que usen los clientes. Las empresas interesadas pueden pedir acceso anticipado en
[revra.io](https://revra.io).
