---
title: Apolo
summary: 'Voice operating system for teams: coordinates people, decisions and tasks in real time'
year: 2026
role: 'Product, architecture and full-stack development'
stack:
  [TypeScript, NestJS, Next.js, Python, LiveKit, ElevenLabs, PostgreSQL, pgvector, Redis, Socket.IO]
status: building
glyph: orb
order: 1
links:
  live: https://apolo.johnmcan.dev/en
shots:
  - src: ../shots/apolo/landing.jpg
    alt: 'Apolo landing page with the headline “Dilo una vez. Apolo se encarga del resto.” (Say it once. Apolo handles the rest), “Solicitar acceso” (Request access) and “Ingresar” (Sign in) buttons, and the note “En piloto privado · Español e inglés”. On the right, the glowing blue orb with its pill eyes beside a sample voice exchange on pending tasks and tabs for Tasks, Memory, Messages and Calls.'
    caption: 'The landing page at apolo.johnmcan.dev, showing the orb and a sample voice exchange.'
---

## Context

Teams spend hours coordinating in writing: emails, chats, memos and quick meetings to pass along
decisions someone already said out loud. Over time information gets scattered across channels,
versions contradict each other and it becomes hard to know what still holds true and who is working
on what.

## What it is

Apolo is a voice assistant for teams that carries the context of daily operations. Each company gets
an isolated knowledge core where Apolo keeps decisions, agreements and ongoing tasks. Anyone can
speak to it in plain Spanish or English to check what was decided, record a change, send a message to
a teammate or delegate a task.

Apolo also speaks on its own: it delivers messages out loud to teammates with a live session, sends
company-wide broadcasts gated by role permissions and relays across languages so something spoken in
Spanish reaches an English-speaking teammate in English. When someone asks to talk to a colleague,
Apolo requests an audience on their device and opens a live audio or video call as soon as they
accept. It also notices when two people start working on the same thing, notifies watchers when a
task closes and runs Google Calendar and Slack actions with spoken confirmation.

<!-- capturas -->

## What I did

I designed and am building it on my own as a monorepo with a central NestJS brain, a Python voice
worker on LiveKit Agents and a Next.js web console, keeping types, contracts and the session client
in portable packages ready to reuse in React Native.

The live voice plane runs on LiveKit Cloud with real-time transcription (ElevenLabs Scribe) and
low-latency synthesis (Eleven v4 Turbo). The worker supports both hands-free continuous listening and
push-to-talk, decides when speech is addressed to Apolo so nearby conversations are ignored and
delivers proactive notices. The brain exposes an OpenAI-compatible endpoint so the voice worker and
external channels share the same identity, permissions and tools.

Memory lives in PostgreSQL with pgvector and per-tenant Row Level Security, mirrored in Redis so each
turn answers without hitting the database. Rather than deleting older facts, new decisions invalidate
them with timestamps according to the speaker's role rank; when a lower-ranked member contradicts a
current decision, it is marked as disputed. Live presence, delivery queues and audience timeouts run
on Redis, BullMQ and Socket.IO, and every external action requires spoken confirmation enforced by
the server.

## Status

In active development, with the brain, company memory, bilingual relay, tasks, audio/video audiences
and Google Calendar and Slack integrations working end to end. You can see the preview and request
access to the private pilot at [apolo.johnmcan.dev](https://apolo.johnmcan.dev/en); next come
on-device wake word, external channels on WhatsApp, Discord and phone, and mobile and desktop apps.
