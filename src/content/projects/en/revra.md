---
title: Revra
summary: Agents that take over accounts receivable, from invoice to payment
year: 2026
role: 'Product, design and development'
stack: [TypeScript, Node.js, Fastify, Temporal, Next.js, PostgreSQL, Supabase, API, Microsoft Azure]
status: building
glyph: loop
featured: true
order: 1
links:
  live: https://revra.io
shots:
  - src: ../shots/revra/landing.png
    alt: 'Revra landing page with the headline “Tus cuentas por cobrar, resueltas.” (Your accounts receivable, resolved), a work email field with the “Solicitar acceso” (Request access) button and two cards that go from an invoice about to fall due to the reconciled payment. Below, the systems it starts from: Defontana, Microsoft 365, Google Workspace, Excel and CSV, bank statements, the SII (Chile’s tax service) and Odoo.'
    caption: 'The revra.io landing page, where companies request early access.'
---

## Context

In B2B collections, the daily work is spread across the ERP, email and the bank. Someone checks
which invoices are about to fall due, writes to customers, finds out why a payment was held and
reconciles it when it arrives. It's repetitive work that takes a lot of manual coordination.

## What it is

Revra connects to the company's billing system, collections inbox and bank, and takes on that work:
it follows up on every invoice, contacts customers from the company's own email, resolves whatever
is holding up a payment and reconciles it when it arrives. The company sets its policies, such as
contact hours or the payment terms it accepts, and anything outside them goes to a person, with the
context and a proposal.

Autonomy is earned in stages: Revra starts by proposing what it would do without contacting anyone,
then works on a limited set of accounts, and widens its scope as the company approves it.

<!-- capturas -->

## What I did

Revra started as an idea of mine, and I'm building it with a partner. I designed it so a company
can hand a whole financial process to a team of agents: each case has a goal, and the agents carry
it for weeks, investigating, negotiating, waiting for replies and picking it back up on their own
until it's closed. I took them from the idea to working end to end on test data: they already send
real emails, understand each customer's reply and decide the next step.

The architecture is built to give them autonomy with control. Temporal keeps cases alive for months,
PostgreSQL stores every fact with its source, and a deterministic policy decides what they do on
their own and what goes to a person. On that base come each customer's memory, with RAG over
resolved cases, and the same capabilities for payment application, deductions and credit management.

## Status

The MVP is in development and rolling out in stages, starting in Chile. Next come direct
integrations with the SII (Chile's tax service) and the ERPs customers use. Interested companies can request early access at
[revra.io](https://revra.io).
