---
title: Chucao
summary: Reproductor de listas IPTV para Windows, simple y con el código publicado
year: 2026
role: 'Diseño y desarrollo de escritorio'
stack: [C#, .NET 10, WPF, LibVLC]
status: building
contributions: true
glyph: zap
order: 7
links:
  repo: https://github.com/john-Mcan/iptv-player
---

## Contexto

Una lista IPTV puede traer cientos de canales en un solo archivo, y los reproductores de uso
general la muestran como una lista larga y difícil de recorrer.

## Qué es

Es un reproductor para Windows: abres una lista M3U o una cuenta Xtream Codes y los canales
aparecen ordenados por categoría, con guía de programación, búsqueda y favoritos. Las películas y
series se ordenan por temporada y retoman donde quedaste, y hay pantalla completa y una ventana
flotante. Si la señal se corta, se reconecta solo.

## Qué hice

Lo diseñé y lo programé solo, en C# con WPF y LibVLC. Lo más delicado fue el video: WPF no puede
dibujar encima de la ventana de LibVLC, así que los controles van dentro de la propia vista de
video, y la ventana flotante abre su propia conexión, porque LibVLC 3 no permite mover un
reproductor a otra ventana. Se llama así por el chucao, un pájaro de los bosques del sur de Chile.

## Aporta

El código está publicado en [GitHub](https://github.com/john-Mcan/iptv-player) para revisarlo,
usarlo y mejorarlo sin fines comerciales, y los aportes son bienvenidos. Por ahora no hay
instalador: se compila desde el código, con .NET 10.
