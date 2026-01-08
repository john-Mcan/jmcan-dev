# Autotip.lat — Plataforma de Precios de Automóviles para América Latina

> **Rol:** Desarrollador Full-Stack  
> **Período:** 2025 - Presente  
> **Estado:** En desarrollo activo  
> **Demo:** autotip.lat (próximamente)

---

## 📋 Resumen Ejecutivo

**Autotip.lat** es una plataforma digital colaborativa que centraliza información de automóviles **nuevos** disponibles en América Latina, combinando datos técnicos obtenidos mediante web scraping automatizado con precios reales reportados por la comunidad de usuarios.

El proyecto resuelve un problema real: la fragmentación y falta de transparencia en la información de precios de autos nuevos en la región latinoamericana.

---

## 💡 Idea y Propuesta de Valor

### El Problema
En América Latina, obtener información confiable sobre precios de vehículos nuevos es complejo:
- Los precios varían significativamente entre países y distribuidores
- No existe una fuente centralizada de precios reales de mercado para autos nuevos
- Las fichas técnicas están dispersas en múltiples sitios
- La información de disponibilidad por país es inconsistente

### La Solución
Una plataforma regional que:
1. **Agrega fichas técnicas automáticamente** mediante web scraping inteligente
2. **Crowdsourcea precios reales** de la comunidad (usuarios reportan precios de compra/venta)
3. **Localiza el contenido** por país con soporte multi-moneda
4. **Democratiza la información** para empoderar al comprador latinoamericano

---

## 🛠️ Stack Tecnológico

### Frontend & Backend
| Tecnología | Versión | Uso |
|------------|---------|-----|
| **Next.js** | 16 | Framework React con App Router, SSR/SSG |
| **React** | 19 | UI con Server Components y Client Components |
| **TypeScript** | 5.9+ | Type safety en todo el codebase |
| **Tailwind CSS** | 3.4+ | Styling utility-first con design system custom |

### Base de Datos & Backend Services
| Tecnología | Uso |
|------------|-----|
| **Supabase** | PostgreSQL + Auth + RLS |
| **Row Level Security** | Políticas de seguridad granulares |
| **Supabase Auth** | Email/Magic Links + OAuth (Google) |

### Web Scraping & Automatización
| Tecnología | Uso |
|------------|-----|
| **Playwright** | Browser headless para scraping dinámico |
| **OpenAI API** | Generación de descripciones y clasificación de datos |
| **Parsers Custom** | Extracción y normalización de fichas técnicas |

### Infraestructura & Storage
| Tecnología | Uso |
|------------|-----|
| **Vercel** | Deployment y Edge Network CDN |
| **Cloudflare R2** | Bucket para almacenamiento de imágenes y multimedia |

### Herramientas de Desarrollo
| Tecnología | Uso |
|------------|-----|
| **pnpm** | Package manager con workspaces |
| **ESLint** | Linting y code quality |
| **Prettier** | Code formatting |

---

## 🏗️ Arquitectura del Proyecto

### Estructura Monorepo

El proyecto utiliza una arquitectura **monorepo** con **pnpm workspaces**, diseñada para escalabilidad y reutilización de código:

```
autotip.v2/
├── apps/
│   ├── web/                    # Aplicación Next.js 16
│   │   ├── app/
│   │   │   ├── [locale]/       # Rutas localizadas (SSG)
│   │   │   ├── admin/          # Panel de administración
│   │   │   └── api/            # API Routes
│   │   ├── components/         # Componentes específicos web
│   │   ├── lib/                # Utilidades y lógica de negocio
│   │   └── hooks/              # Custom React hooks
│   │
│   └── mobile/                 # 📱 Expo App (futuro)
│
├── packages/                   # Código compartido
│   ├── ui/                     # Design system (Button, Card, Input, etc.)
│   ├── database/               # Cliente Supabase y queries
│   ├── types/                  # TypeScript types compartidos
│   ├── utils/                  # Utilidades (currency, validation, etc.)
│   └── config/                 # Configuraciones (países, monedas)
│
└── docs/                       # Documentación técnica
```

### Decisiones Arquitectónicas

#### ¿Por qué Monorepo con pnpm?
1. **Reutilización de código**: Los packages compartidos (`@autotip/ui`, `@autotip/types`, etc.) se usan tanto en web como en la futura app móvil
2. **Consistencia de tipos**: TypeScript types centralizados evitan desincronización
3. **Builds eficientes**: pnpm ofrece instalación más rápida y menor uso de disco
4. **Escalabilidad**: Agregar `apps/mobile` (Expo) sin refactorizar

#### ¿Por qué el patrón `[locale]`?
El routing dinámico por locale permite:
- **SEO optimizado por país**: URLs como `/mx/marcas/toyota` vs `/ar/marcas/toyota`
- **Generación estática**: `generateStaticParams()` pre-genera todas las combinaciones locale×marca×modelo
- **Detección automática**: GeoIP para redirección inicial + selector manual
- **Contenido localizado**: Moneda, disponibilidad y terminología por país

---

## 🌎 Sistema de Localización Multi-País

### Países Soportados

| País | Código | Moneda | Estado |
|------|--------|--------|--------|
| 🇲🇽 México | mx | MXN | ✅ Activo |
| 🇦🇷 Argentina | ar | ARS | ✅ Activo |
| 🇨🇱 Chile | cl | CLP | ✅ Activo |
| 🇨🇴 Colombia | co | COP | ✅ Activo |
| 🇵🇪 Perú | pe | PEN | ✅ Activo |
| 🇺🇾 Uruguay | uy | UYU | ✅ Activo |
| 🇵🇾 Paraguay | py | PYG | ✅ Activo |
| 🇪🇨 Ecuador | ec | USD | ✅ Activo |
| 🇧🇴 Bolivia | bo | BOB | ✅ Activo |

### Implementación Técnica

```typescript
// Rutas estáticas pre-generadas
export function generateStaticParams() {
  const LOCALES = ['mx', 'ar', 'cl', 'co', 'pe', 'uy', 'py', 'ec', 'bo'];
  return LOCALES.map(locale => ({ locale }));
}

// Cada página recibe el locale como parámetro
export default async function Page({ 
  params 
}: { 
  params: Promise<{ locale: string }> 
}) {
  const { locale } = await params;
  // Contenido localizado...
}
```

---

## 🤖 Sistema de Web Scraping

### Flujo de Obtención de Datos

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│   Fuentes   │────▶│  Playwright  │────▶│   Parser    │────▶│   Supabase   │
│  (web)      │     │  (scraping)  │     │  (OpenAI)   │     │  (storage)   │
└─────────────┘     └──────────────┘     └─────────────┘     └──────────────┘
```

### Características del Scraper

1. **Discovery Wizard**: Proceso de 5 pasos para importar marcas completas
   - Ingresar URL de marca
   - Seleccionar modelos (filtro activos/descontinuados)
   - Seleccionar generaciones
   - Seleccionar versiones/motorizaciones
   - Confirmar e importar

2. **Scraping Puntual**: Importar una ficha técnica específica

3. **Parser Inteligente**: Extrae y normaliza +30 campos técnicos
   - Potencia, torque, cilindrada
   - Dimensiones, peso, capacidades
   - Consumo, emisiones, transmisión

4. **Integración OpenAI**: Generación de descripciones de modelos

### Datos Extraídos

```typescript
interface CarVersion {
  // Motor
  engine_type: string;        // "Diesel commonrail"
  engine_displacement: number; // 1.56 (litros)
  horsepower: number;         // 99
  torque: number;             // 254 (Nm)
  cylinders: number;          // 4
  
  // Rendimiento
  max_speed_kmh: number;      // 183
  acceleration_0_100_s: number; // 10.8
  fuel_economy_city: number;  // 4.6 (l/100km)
  
  // Dimensiones
  length_mm: number;          // 4419
  width_mm: number;           // 1748
  wheelbase_mm: number;       // 2652
  
  // Y +20 campos más...
}
```

---

## 👥 Sistema de Contribuciones de la Comunidad

### Modelo de Interactividad

La plataforma incentiva la participación mediante:

1. **Contribución de Precios**
   - Usuarios reportan precios reales de compra de autos nuevos
   - Validación comunitaria (likes/dislikes)
   - Verificación por moderadores

2. **Sistema de Reputación**
   - Puntos por contribuciones verificadas
   - Badges y niveles de usuario
   - Historial de aportes visible

3. **Comentarios y Reseñas**
   - Opiniones de propietarios reales
   - Sistema de ratings (1-5 estrellas)
   - Threads de discusión

### Estructura de Datos de Contribuciones

```sql
CREATE TABLE user_price_contributions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  car_version_id UUID REFERENCES car_versions(id),
  country_id UUID REFERENCES countries(id),
  
  -- Datos del precio
  price_amount NUMERIC NOT NULL,
  currency_code VARCHAR NOT NULL,
  price_year INTEGER NOT NULL,
    
  -- Detalles adicionales
  source VARCHAR,
  location_city VARCHAR,
  notes TEXT,
  source_url TEXT,
  
  -- Validación comunitaria
  likes_count INTEGER DEFAULT 0,
  dislikes_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 📊 Estado Actual del Desarrollo

### Funcionalidades Completadas ✅

- [x] Arquitectura monorepo con pnpm workspaces
- [x] Design system con componentes reutilizables (`@autotip/ui`)
- [x] Sistema de autenticación (Email + OAuth Google)
- [x] Routing dinámico multi-país (`[locale]`)
- [x] Páginas públicas: Home, Marcas, Modelos, Búsqueda, Blog
- [x] Panel de administración (CRUD de marcas, modelos, versiones, precios)
- [x] Sistema de contribución de precios
- [x] Especificación completa del sistema de scraping

### En Desarrollo 🚧

- [ ] Implementación del scraper con Playwright
- [ ] Integración de OpenAI para descripciones
- [ ] Sistema de comentarios y reseñas
- [ ] Gamificación y reputación de usuarios
- [ ] App móvil con Expo

### Roadmap Futuro 🗺️

- [ ] Comparador de modelos (hasta 3 lado a lado)
- [ ] Alertas de precios (notificaciones)
- [ ] API pública para desarrolladores
- [ ] Integración con automotoras regionales

---

## 🎨 Highlights de UI/UX

- **Mobile-first**: Diseño responsivo desde dispositivos pequeños
- **Design System**: Componentes consistentes via `@autotip/ui`
- **Performance**: SSG con ISR para páginas de catálogo
- **Accesibilidad**: Semántica HTML, contraste adecuado
- **Skeletons**: Loading states para mejor UX percibido

---

## 📈 Métricas y KPIs Objetivo

| Métrica | Objetivo (6 meses) |
|---------|-------------------|
| Modelos en catálogo | +5,000 |
| Contribuciones de precios | +10,000 |
| Usuarios únicos/mes | +50,000 |
| Conversión visita → contribución | 15% |

---

## 🔐 Seguridad

- **Row Level Security (RLS)**: Políticas granulares en Supabase
- **Rate Limiting**: Protección contra spam en contribuciones
- **Validación de aportes**: Detección de datos anómalos
- **GDPR-ready**: Anonimización de datos sensibles

---

## 🚀 Conclusión

**Autotip.lat** demuestra capacidad para:

1. **Arquitectura escalable**: Monorepo preparado para multi-plataforma
2. **Stack moderno**: Next.js 16, React 19, TypeScript, Supabase
3. **Automatización**: Web scraping inteligente con Playwright + IA
4. **Producto orientado a usuario**: Crowdsourcing + localización regional
5. **Pensamiento de negocio**: Modelo comunitario con gamificación

El proyecto combina desafíos técnicos complejos (scraping, multi-tenancy por país, real-time) con una propuesta de valor clara para el mercado latinoamericano.

---

**Tecnologías Principales:**

`Next.js 16` `React 19` `TypeScript` `Supabase` `PostgreSQL` `Playwright` `OpenAI API` `Tailwind CSS` `pnpm` `Vercel`

---

*Última actualización: Enero 2026*

