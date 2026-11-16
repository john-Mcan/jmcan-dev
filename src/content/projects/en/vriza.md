---
title: vriza
summary: "AI agents that serve a business's customers: they remember, learn and act on their own"
year: 2026
role: 'Product, AI and full-stack development'
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
order: 2
links:
  live: https://vriza.cl
shots:
  - src: ../shots/vriza/landing.png
    alt: 'The vriza landing page with the headline “Tu agente de WhatsApp, sin complicaciones” (Your WhatsApp agent, no hassle), the price from $17,990 CLP a month and the “Probar gratis 7 días” (Try it free for 7 days) button. Next to it, a WhatsApp conversation with a sample bakery: the agent answers the price, lead time and address, and hands what it does not know to a person on the team.'
    caption: 'The vriza.cl landing page, with a sample conversation as the customer sees it on WhatsApp.'
---

## Context

Many small businesses and independent professionals serve their customers on WhatsApp, and the same
questions come in all day: prices, opening hours, stock, how to place an order. Answering them on
time takes hours from the owner or the team, and messages that arrive at night wait until the next
day.

## What it is

With vriza, an AI agent serves customers on WhatsApp on behalf of a business or a professional who
works alone. You set it up in four steps from the browser: tell it what your business does and what
tone to use, teach it what you know with your website, a file or a text, try it out and connect your
number.

The agent answers with what you taught it and remembers each customer: it keeps their details and a
summary of every conversation, and has them at hand when that person writes again. When it can't
find an answer, it tells the customer and lets you know, and you take over the conversation from the
dashboard or from your phone. If someone on the team replies, the agent steps aside.

<!-- capturas -->

## What I did

I designed and built it on my own, so the agent works for the business: booking and rescheduling
appointments in Google Calendar, keeping a promise like "I'll message you on Thursday", pursuing a
goal with each contact, asking the team what it doesn't know and passing the answer on to the
customer, or calling the business's own API to check an order or the stock. Every one of those
actions goes through a single gate that authorizes it, gives it a daily budget, logs it and keeps a
retry from repeating it.

To answer, it uses RAG: what each business teaches it is indexed in PostgreSQL with pgvector, and on
each message the agent searches by meaning and by keywords, reranks the results and answers with
what it found. If it finds nothing, a set of rules keeps it from making something up.

Memory is per contact: the agent records each customer's stable details, with their source and age,
and saves a summary when a conversation closes. It also learns from the team: the answer to a
question it asked can be saved as knowledge, and next time it replies on its own. It all runs on a
single platform for many businesses, with each one's data isolated in the database.

## Status

It's getting ready for launch, starting in Chile, and actions arrive in the next stage. At
[vriza.cl](https://vriza.cl) you can see how it works and its pricing. The site is in Spanish.
