# Fandoms.io

**Plataforma social para comunidades de fans**

Plataforma social completa para comunidades de fans • 32,000+ usuarios activos

---

## Resumen del Proyecto

Plataforma social para comunidades de fans, desarrollada desde cero como proyecto individual. Diseñada para soportar alto volumen de contenido, interacciones frecuentes y rendimiento escalable.

### Métricas

| Métrica        | Valor      |
|----------------|------------|
| Usuarios       | 32,000+    |
| Posts          | 4,200+     |
| Comentarios    | 41,000+    |
| Interacciones  | 273,000+   |
| Mensajes       | 19,000+    |
| Comunidades    | 21         |

---

## Rol y Alcance

### Mi Rol

Fui responsable del ciclo de desarrollo completo del proyecto, incluyendo diseño de arquitectura, implementación frontend y backend, autenticación, modelado de datos y despliegue en producción.

### Alcance

- Diseño de arquitectura del sistema
- Implementación completa del frontend
- Desarrollo de backend y API
- Modelado de datos y seguridad
- Configuración de infraestructura y despliegue

---

## Arquitectura

La plataforma está construida con Next.js 15 (App Router) y React 19, con una estructura modular que separa UI (src/components), lógica de negocio/estado (src/hooks, src/contexts, src/store) y acceso a datos/servicios (src/lib).

El backend de datos se apoya en Supabase (PostgreSQL + Auth + RPC), usando Row Level Security (RLS) para aplicar permisos a nivel de base de datos y reducir lógica de permisos en la app.

A nivel de rendering, el proyecto usa un enfoque híbrido: páginas públicas/SEO aprovechan Server Components + SSG/ISR (revalidate/metadata), mientras que flujos altamente interactivos (feed, mensajes, moderación) se implementan con Client Components y consumen Supabase desde el navegador cuando aplica.

Para media, se usa Cloudflare R2 con URLs presignadas (generadas por Route Handlers en Node.js) y subida directa desde el cliente a R2; la app guarda las URLs en Postgres y gestiona borrados cuando corresponde.

### Diagrama de Arquitectura

```
[Usuario/Navegador]
   │  HTTP
   ▼
[Vercel Edge Network]
   │
   ├─(Middleware Edge, solo rutas match como /manage-fandoms/*)
   │
   ▼
[Next.js App Router (Node.js runtime)]
   ├─ Server Components (SSG/ISR/SEO) ─────▶ [Supabase Postgres + RLS + RPC]
   ├─ Route Handlers /api (Node.js) ───────▶ [Supabase Auth/RPC] / [Resend] / [R2 (presign/delete)]
   └─ Client Components (React) ───────────▶ [Supabase Auth/DB/RPC]
                         └───────────────WS▶ [Supabase Realtime]
                         └──────────────PUT▶ [Cloudflare R2 (upload directo)]
```

---

## Funcionalidades Principales

Una plataforma unificada con sistema de comunidades, moderación, contenido interactivo, chat en tiempo real y gamificación.

- **Comunidades**: Sistema de comunidades con roles jerárquicos y control de acceso basado en roles
- **Contenido**: Sistema de contenido basado en comunidades con posts, comentarios y votaciones
- **Moderación**: Panel de moderación completo con políticas a nivel de base de datos
- **Encuestas**: Sistema de encuestas interactivas
- **Badges**: Sistema de badges y logros con gamificación
- **Real-time**: Chat en tiempo real por comunidad vía WebSockets

---

## Decisiones Técnicas

### Next.js 15 + React 19
Elegido para aprovechar App Router, Server Components y las últimas optimizaciones de React 19, manteniendo la aplicación escalable y con mejor DX.

### Supabase (PostgreSQL + RLS)
Seleccionado para reducir overhead de backend, aprovechando PostgreSQL con Row Level Security para aplicar permisos a nivel de base de datos.

### Rendering Híbrido
Server Components + SSG/ISR para páginas públicas/SEO, Client Components para flujos interactivos (feed, mensajes, moderación).

### SEO desde el Diseño
Las consideraciones de SEO se incorporaron temprano, usando revalidate y metadata para páginas dinámicas indexables.

---

## Stack Tecnológico

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- PostgreSQL
- Supabase
- Vercel
- Cloudflare R2
- TanStack Query
- Zustand
- Framer Motion

---

## Desafíos Técnicos

### Autenticación Robusta en PWA
- **Problema**: La autenticación OAuth y el manejo de sesiones presentaban edge cases complejos en entornos PWA.
- **Solución**: Sistema híbrido de persistencia de sesión con fallbacks, detección de conflictos multi-sesión y timeouts adaptativos.

### Real-time Escalable
- **Problema**: Mantener conexiones WebSocket eficientes sin degradar el rendimiento.
- **Solución**: Patrón de canales reutilizables con reference counting y actualización de JWT en tiempo real.

### Feed Performante
- **Problema**: Cargar feeds con datos complejos sin queries N+1.
- **Solución**: Paginación por cursor, queries optimizadas con JOINs selectivos y cache con TanStack Query.

### Sistema de Permisos Granular
- **Problema**: Diferentes permisos según el contexto (admin, moderador, autor).
- **Solución**: Row Level Security con políticas compuestas en PostgreSQL y verificación dual cliente-servidor.

---

## Métricas de Código

| Métrica              | Valor    |
|----------------------|----------|
| Componentes React    | 150+     |
| Custom Hooks         | 36       |
| API Endpoints        | 20+      |
| Servicios de Negocio | 9        |
| Tablas PostgreSQL    | 50+      |
| Políticas RLS        | 100+     |
| Líneas de TypeScript | ~35,000  |

---

## Trade-offs y Mejoras Futuras

Aunque la arquitectura actual soporta los objetivos del proyecto, hay mejoras identificadas para el futuro:

- Background jobs para tareas de procesamiento intensivo
- Capas adicionales de caching para endpoints de alto tráfico
- Mayor optimización de queries de base de datos conforme crezca el uso
- Internacionalización completa para expandir a otros mercados

---

## Aprendizajes Clave

Lecciones técnicas y de producto aprendidas durante el desarrollo de la plataforma:

1. La arquitectura inicial importa: refactorizar tablas con datos es complejo
2. RLS es poderoso pero requiere planificación cuidadosa
3. El caching agresivo mejora UX pero complica la invalidación
4. Los edge cases de autenticación en PWA requieren testing exhaustivo
5. Métricas en tiempo real ayudan a tomar decisiones de producto

---

## Enlaces

- **Demo en Vivo**: [https://fandoms.io](https://fandoms.io)
- **Repositorio**: Privado (disponible bajo solicitud)

