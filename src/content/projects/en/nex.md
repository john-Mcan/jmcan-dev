---
title: NEX
summary: Live experience where the audience decides what plays next
year: 2026
role: 'Everything: product, backend, web and mobile app'
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
    alt: 'NEX landing page with the headline “Tu fandom decide qué suena.” (Your fandom decides what plays), the button to save a spot and a live player with the song on air.'
    caption: 'nex-radio.com: you can already listen without signing up while the waitlist fills.'
---

## Context

Music fandoms have huge energy: they want to take part, vote, compete and hear their group on air.
Traditional radio leaves no room for that.

## What it is

It's an interactive radio station in real time where the audience decides the programming. While
you listen, you use your influence to choose what plays next, join the chat and events, and see the
result right away.

The idea is for it to be a meeting point for fandoms, where they listen together and compete to get
their group on air.

<!-- capturas -->

## What I did

I built it on my own, end to end: the product, the NestJS API, the database, the Next.js website and
the native Flutter app for iOS and Android.

The key decision was to have the backend run the station. It picks each song, pushes it to the
Liquidsoap queue and announces the change at the exact moment, with AzuraCast's AutoDJ as a
fallback: that way, the song that wins the vote plays right next. Live state (votes, listeners,
queue) lives in Redis and reaches everyone over Socket.IO, and influence is computed on the server
and credited when it's read, without writing to the database every minute for every listener.

## Status

It's getting ready for launch. At [nex-radio.com](https://nex-radio.com) you can already listen
without signing up and save your spot on the waitlist.
