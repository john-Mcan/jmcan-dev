---
title: extan
summary: Milestone payments for freelancers and agencies, guaranteed on-chain
year: 2026
role: 'Smart contract and web app'
stack: [Solidity, Foundry, OpenZeppelin, Base, Next.js, TypeScript, Supabase, Privy, viem, ERC-4337]
status: building
glyph: escrow
order: 5
links:
  live: https://extan.johnmcan.dev
  repo: https://github.com/john-Mcan/escrow
shots:
  - src: ../shots/extan/landing.png
    alt: 'The extan landing page with the headline “Pagos por hitos garantizados en blockchain.” (Milestone payments, guaranteed on-chain) and the “Crear link de cobro” (Create payment link) button. Next to it, a 2,500 USDC payment agreement for an online store redesign, in three milestones: the first one paid and the other two in escrow.'
    caption: 'The landing page, with a sample agreement: one milestone paid and two in escrow.'
---

## Context

In Latin America, freelance and project work runs on trust: the client doesn't want to pay up front
and the provider doesn't want to work without a guarantee. Traditional escrow services solve that by
holding the money themselves, and they charge for it.

## What it is

A payment link by milestones. The provider sets up the agreement, with the amount and due date of
each delivery, and sends it to the client by email or WhatsApp. The client deposits at the start, in
USDC, and each milestone is paid to the provider when the client approves the delivery.

The deposit sits in a public smart contract, out of the platform's reach. The contract allows only
three outcomes: pay the provider, refund the client or, if there's a dispute, split the amount as an
independent arbiter decides. The client signs in with email or Google and the platform covers the
network fees, so they don't need to know anything about crypto.

<!-- capturas -->

## What I did

I designed and built it on my own, from the Solidity smart contract to the web app. The contract has
100% test coverage and passed Slither's static analysis with no findings. On the server, every
movement is checked on-chain: the browser only sends the transaction id, and the server reads its
events and checks the amounts before recording anything.

## Status

It works end to end on Base's test network: deposit, delivery, release, refund, dispute and the
arbiter's resolution, tested with real wallets. The contract is verified and its code can be read on
[Blockscout](https://base-sepolia.blockscout.com/address/0xb7BABf0046fb8Bb2E3Ea0e6B75abdDEb31B9F863?tab=contract).
The site, [extan.johnmcan.dev](https://extan.johnmcan.dev), runs on that network with test USDC.
Running it with real money still takes an external audit, a legal entity and a way to go from local
currency to USDC. The code is published on [GitHub](https://github.com/john-Mcan/escrow) for
review. The site is in Spanish.
