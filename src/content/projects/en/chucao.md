---
title: Chucao
summary: A simple IPTV playlist player for Windows, with its code published
year: 2026
role: 'Desktop design and development'
stack: [C#, .NET 10, WPF, LibVLC]
status: building
contributions: true
glyph: zap
order: 8
links:
  repo: https://github.com/john-Mcan/iptv-player
---

## Context

An IPTV playlist can hold hundreds of channels in a single file, and general-purpose players show it
as a long list that is hard to browse.

## What it is

A player for Windows: open an M3U playlist or an Xtream Codes account and the channels show up
sorted by category, with a program guide, search and favorites. Movies and series are organized by
season and resume where you left off, and there's full screen and a floating window. If the signal
drops, it reconnects on its own.

## What I did

I designed and programmed it on my own, in C# with WPF and LibVLC. The trickiest part was video: WPF
can't draw on top of LibVLC's window, so the controls live inside the video view itself, and the
floating window opens its own connection, because LibVLC 3 can't move a player to another window.
It's named after the chucao, a bird from the forests of southern Chile.

## Contribute

The code is published on [GitHub](https://github.com/john-Mcan/iptv-player) to review, use and
improve for non-commercial purposes, and contributions are welcome. There is no installer yet: you
build it from the code, with .NET 10.
