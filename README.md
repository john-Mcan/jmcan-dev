# johnmcan.dev

Sitio web personal desarrollado con Next.js 16, React 19 y TypeScript. Implementa internacionalización completa (ES/EN), sistema de temas (dark/light), y optimizaciones avanzadas de rendimiento y SEO.

## 🚀 Características

- **Framework Moderno**: Next.js 16 con App Router y Server Components
- **Internacionalización**: Soporte completo para español e inglés con `next-intl`
- **Temas**: Sistema de temas dark/light personalizado con React Context y persistencia en localStorage
- **Rendimiento**: Optimizaciones de imágenes (AVIF/WebP), revalidación estratégica, y carga optimizada
- **SEO**: Metadata completa, Open Graph, Twitter Cards, y configuración de robots
- **Accesibilidad**: Componentes accesibles con Radix UI y semántica HTML correcta
- **Responsive**: Diseño completamente adaptable a todos los dispositivos
- **Type Safety**: TypeScript en modo estricto para máxima seguridad de tipos
- **API Routes**: Endpoints para formulario de contacto con validación

## 📋 Requisitos Previos

- Node.js 18.17 o superior
- npm, yarn, o pnpm

## 🛠️ Stack Tecnológico

### Core
- **Framework**: Next.js 16.1.0 (App Router)
- **UI Library**: React 19.2.3
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 4.x

### Internacionalización
- **i18n**: next-intl 4.6.1
- **Idiomas**: Español (ES) y Inglés (EN)

### UI & Componentes
- **Componentes Base**: Radix UI (@radix-ui/react-slot)
- **Iconos**: Lucide React 0.562.0
- **Utilidades CSS**: clsx, tailwind-merge

### Desarrollo
- **Linting**: ESLint 9 con eslint-config-next
- **PostCSS**: @tailwindcss/postcss 4
- **Type Definitions**: @types/node, @types/react, @types/react-dom

## 📦 Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd jmcan-dev

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

El sitio estará disponible en [http://localhost:3000](http://localhost:3000)

## 🎯 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia el servidor de desarrollo en modo watch

# Producción
npm run build        # Crea una build optimizada para producción
npm start            # Inicia el servidor de producción (requiere build previo)

# Calidad de Código
npm run lint         # Ejecuta ESLint para verificar el código
```

## 📁 Estructura del Proyecto

```
jmcan-dev/
├── public/
│   └── images/              # Imágenes estáticas y assets
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/
│   │   │   └── contact/     # API route para formulario de contacto
│   │   ├── caso-de-estudio/ # Página de caso de estudio
│   │   ├── contacto/        # Página de contacto
│   │   ├── layout.tsx       # Layout raíz con providers y metadata
│   │   ├── page.tsx         # Página principal
│   │   └── globals.css      # Estilos globales y variables CSS
│   ├── components/
│   │   ├── layout/          # Componentes de layout (Header, Footer)
│   │   │   ├── header.tsx
│   │   │   ├── footer.tsx
│   │   │   ├── language-toggle.tsx
│   │   │   └── theme-toggle.tsx
│   │   ├── providers/       # Context providers
│   │   │   ├── intl-provider.tsx
│   │   │   └── theme-provider.tsx
│   │   ├── sections/        # Secciones de páginas
│   │   │   ├── about.tsx
│   │   │   ├── hero.tsx
│   │   │   ├── skills.tsx
│   │   │   ├── project-highlight.tsx
│   │   │   ├── case-study/  # Componentes del caso de estudio
│   │   │   └── contact/     # Componentes de contacto
│   │   └── ui/              # Componentes UI reutilizables
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── container.tsx
│   │       ├── dark-veil.tsx
│   │       └── section.tsx
│   ├── data/                # Datos estáticos y configuración
│   │   ├── personal.ts
│   │   ├── projects.ts
│   │   └── skills.ts
│   ├── i18n/                # Configuración de internacionalización
│   │   ├── config.ts
│   │   └── request.ts
│   ├── lib/                 # Utilidades y helpers
│   │   ├── prefs.ts         # Gestión de preferencias (tema, idioma)
│   │   └── utils.ts         # Utilidades generales (cn, etc.)
│   └── messages/            # Archivos de traducción
│       ├── en.json
│       └── es.json
├── eslint.config.mjs        # Configuración de ESLint
├── next.config.ts           # Configuración de Next.js
├── postcss.config.mjs       # Configuración de PostCSS
├── tsconfig.json            # Configuración de TypeScript
└── package.json             # Dependencias y scripts
```

## ⚙️ Configuración

### Internacionalización

El proyecto utiliza `next-intl` para la internacionalización. Los idiomas soportados se definen en `src/i18n/config.ts`:

- Español (ES) - idioma por defecto
- Inglés (EN)

Las traducciones se encuentran en `src/messages/` y se cargan automáticamente según la configuración del usuario.

### Temas

El proyecto implementa un sistema de temas personalizado usando React Context (`ThemeProvider`) que persiste las preferencias en localStorage. Los temas disponibles son:

- Dark (por defecto)
- Light

El sistema aplica las clases CSS y `color-scheme` automáticamente al elemento raíz del documento, y las preferencias se mantienen entre sesiones.

### Correos (Resend SMTP)

El formulario de contacto envía correos usando **SMTP de Resend** (via `nodemailer`) desde el endpoint:

- **Endpoint**: `POST /api/contact`
- **Payload**: `{ name: string, email: string, message: string }`
- **Destino**: se envía a `mcanempresa@gmail.com` (configurado en `src/app/api/contact/route.ts`)
- **Reply-To**: se configura con el correo ingresado por el usuario para poder responder directamente

#### Variables de entorno

Configura estas variables (server-side):

- **`RESEND_API_KEY`**: API key de Resend (se usa como password SMTP). **No se debe commitear.**
- **`RESEND_FROM_EMAIL`** (recomendado): remitente (por ejemplo `contacto@tudominio.com`). Debe estar verificado en Resend. Si no se define, se usa un fallback para desarrollo.

Ejemplo para desarrollo local (`.env.local`, no se commitea):

```bash
RESEND_API_KEY=tu_api_key_de_resend
RESEND_FROM_EMAIL=contacto@tudominio.com
```

En Vercel: agrega las variables en **Project Settings → Environment Variables** (Production/Preview según corresponda) y luego **redeploy** para que apliquen.

### Optimizaciones de Rendimiento

- **Revalidación**: Páginas estáticas con revalidación estratégica (15552000 segundos)
- **Imágenes**: Optimización automática con formatos AVIF y WebP
- **Fonts**: Carga optimizada de fuentes Google (Geist Sans, Geist Mono) con `display: swap`
- **Scripts**: Scripts críticos cargados con `beforeInteractive` para evitar FOUC

### SEO

El proyecto incluye configuración completa de SEO en `src/app/layout.tsx`:

- Metadata base con URL canónica
- Open Graph tags para redes sociales
- Twitter Cards
- Configuración de robots para indexación
- Sitemap y estructura de datos estructurados implícitos

## 🔧 Desarrollo

### Agregar una Nueva Traducción

1. Edita los archivos en `src/messages/` (es.json y en.json)
2. Usa `useTranslations()` hook en componentes client-side
3. Usa `getTranslations()` en Server Components

### Agregar un Nuevo Componente UI

1. Crea el componente en `src/components/ui/`
2. Utiliza la función `cn()` de `src/lib/utils.ts` para combinar clases
3. Sigue los patrones de Radix UI para accesibilidad

### Agregar una Nueva Página

1. Crea un directorio en `src/app/` con `page.tsx`
2. Exporta metadata si es necesario
3. Configura `revalidate` según necesidades de la página

## 🚢 Deployment

El proyecto está optimizado para deployment en Vercel:

1. Conecta tu repositorio a Vercel
2. Vercel detectará automáticamente Next.js
3. El build se ejecutará con `npm run build`
4. Las variables de entorno se configuran en el dashboard de Vercel

### Build de Producción

```bash
npm run build
```

Esto generará una build optimizada en `.next/` lista para producción.

## 📝 Convenciones de Código

- **TypeScript**: Modo estricto habilitado
- **Componentes**: Server Components por defecto, Client Components solo cuando es necesario (`"use client"`)
- **Estilos**: Tailwind CSS con clases utilitarias, variables CSS para temas
- **Nombres**: PascalCase para componentes, camelCase para funciones y variables
- **Imports**: Path aliases con `@/` para imports absolutos desde `src/`

## 🔍 Linting y Formato

El proyecto utiliza ESLint con la configuración de Next.js:

```bash
npm run lint
```

Se recomienda configurar tu editor para ejecutar ESLint automáticamente al guardar.

## 📄 Licencia

Copyright (c) 2025 John Moya Cantillana - Todos los derechos reservados.

Este proyecto está protegido por derechos de autor. Se permite la visualización del código para fines de revisión y aprendizaje personal, pero está prohibida su copia, replicación o uso en otros proyectos sin autorización expresa del autor.

Para más información, consulta el archivo [LICENSE](LICENSE).

---

Desarrollado usando Next.js, React y TypeScript.
