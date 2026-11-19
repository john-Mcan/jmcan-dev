---
title: extan
summary: Pagos por hitos para freelancers y agencias, garantizados en blockchain
year: 2026
role: 'Smart contract y aplicación web'
stack: [Solidity, Foundry, OpenZeppelin, Base, Next.js, TypeScript, Supabase, Privy, viem, ERC-4337]
status: building
glyph: escrow
order: 5
links:
  live: https://extan.johnmcan.dev
  repo: https://github.com/john-Mcan/escrow
shots:
  - src: ../shots/extan/landing.png
    alt: 'Portada de extan con el título «Pagos por hitos garantizados en blockchain.» y el botón «Crear link de cobro». Al lado, un acuerdo de pago de 2.500 USDC por el rediseño de una tienda online, en tres hitos: el primero pagado y los otros dos en garantía.'
    caption: 'La portada, con un acuerdo de ejemplo: un hito pagado y dos en garantía.'
---

## Contexto

En América Latina, el trabajo freelance y por proyecto se sostiene en la confianza: el cliente no
quiere pagar por adelantado y el proveedor no quiere trabajar sin una garantía. Los servicios de
escrow tradicionales lo resuelven guardando ellos el dinero, y cobran por hacerlo.

## Qué es

Es un link de cobro por hitos. El proveedor arma el acuerdo, con el monto y la fecha de cada
entrega, y se lo envía al cliente por correo o por WhatsApp. El cliente deposita al empezar, en
USDC, y cada hito se le paga al proveedor cuando el cliente aprueba la entrega.

El depósito queda en un smart contract público, fuera del alcance de la plataforma. El contrato
solo permite tres salidas: pagarle al proveedor, devolverle al cliente o, si hay una disputa,
repartir el monto según decida un árbitro independiente. El cliente entra con su correo o con Google
y la plataforma paga las comisiones de la red, así que no necesita saber de cripto.

<!-- capturas -->

## Qué hice

Lo diseñé y lo construí solo, del smart contract en Solidity a la aplicación web. El contrato tiene
el 100 % de su código cubierto por pruebas y pasó el análisis estático de Slither sin hallazgos. En el
servidor, cada movimiento se comprueba en la cadena: el navegador solo entrega el identificador de
la transacción, y el servidor lee sus eventos y revisa los montos antes de registrar nada.

## Estado

Funciona de punta a punta en la red de pruebas de Base: depósito, entrega, liberación, reembolso,
disputa y resolución del árbitro, probados con wallets reales. El contrato está verificado y su
código se puede leer en
[Blockscout](https://base-sepolia.blockscout.com/address/0xb7BABf0046fb8Bb2E3Ea0e6B75abdDEb31B9F863?tab=contract).
El sitio, [extan.johnmcan.dev](https://extan.johnmcan.dev), funciona en esa red con USDC de prueba.
Para operar con dinero real faltan una auditoría externa, una entidad legal y una forma de pasar de
moneda local a USDC. El código está publicado en
[GitHub](https://github.com/john-Mcan/escrow) para revisarlo.
