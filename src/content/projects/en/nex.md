---
title: NEX
summary: Live experience where fandoms compete to keep their favorites on top
year: 2026
role: 'Everything: product, backend, web and mobile app'
stack:
  [Flutter, NestJS, Next.js, PostgreSQL, Redis, Socket.IO, AzuraCast, Cloudflare, Firebase, Vercel]
status: prelaunch
glyph: eq
featured: true
order: 4
links:
  live: https://nex-radio.com
  demo: https://dev.nex-radio.com
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
you listen, you use your influence to vote on what plays next, join the chat and events, and see the
result right away.

Every vote also counts for the artist's fandom. The weekly, monthly and all-time rankings show which
fandoms are ahead, with their songs and their most active fans, and each fandom competes to keep its
favorites on top.

<!-- capturas -->

## What I did

I built it on my own, end to end: the product, the NestJS API, the database, the Next.js website and
the native Flutter app for iOS and Android.

The key decision was to have the backend run the station. It picks each song, pushes it to the
Liquidsoap queue and announces the change at the exact moment, with AzuraCast's AutoDJ as a
fallback: that way, the song that wins the vote plays right next. Live state (votes, listeners,
queue) lives in Redis and reaches everyone over Socket.IO, and influence is computed on the server
and credited when it's read, without writing to the database every minute for every listener. Fandom
rankings are recomputed when a round with votes closes, in a single query for all three periods, and
pages read them from Redis.

## Status

It's getting ready for launch. At [nex-radio.com](https://nex-radio.com) you can already listen
without signing up and save your spot on the waitlist. The working web demo is at
[dev.nex-radio.com](https://dev.nex-radio.com), and NEX also has a native mobile client for iOS and
Android.
