# CLAUDE.md — Inventario ANI

## Proyecto
Portal institucional de la **Agencia Nacional de Infraestructura (ANI)** para el seguimiento al estado de georreferenciación de los activos de la red vial concesionada de Colombia.

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Angular 21.1 · Standalone Components |
| Rendering | SSR con `@angular/ssr` — Express 5 |
| Estilos | Tailwind CSS 4.x (`@import "tailwindcss"` en `styles.css`) |
| Gráficas | Apache ECharts vía `ngx-echarts` v21 (`provideEchartsCore`) |
| HTTP | `HttpClient` + `withFetch()` (SSR-safe) |
| Estado | Signals (`signal`, `computed`, `toSignal`) |
| Package manager | npm 10.x |

---

## Comandos

```bash
npm start          # Dev server en http://localhost:4200
npm run build      # Build production (SSR)
npm test           # Tests con vitest
```

---

## Arquitectura de rutas

| Ruta | Componente | SSR mode |
|---|---|---|
| `/` | `HomeComponent` | Prerender |
| `/entrega` | `EntregaComponent` | Prerender |
| `/georreferenciacion` | `GeorreferenciacionComponent` | Server (usa ECharts) |
| `/detalles` | `DetallesComponent` | Server (usa ECharts) |
| `/detalles/:id` | `ProyectoComponent` | Server (dinámico) |

Configuración SSR en `src/app/app.routes.server.ts`.

---

## Estructura de `src/app/`

```
app/
├── core/
│   ├── models/inventario.model.ts   # Tipos: Proyecto, ElementoVial, EstadoElemento, etc.
│   └── services/inventario.service.ts  # HTTP + parseRaw + TransferState SSR
├── layout/
│   └── navbar/navbar.component.ts   # Glassmorphism, links con routerLinkActive
├── shared/
│   ├── echart-defaults.ts           # echartsBase(), tooltipBase, ESTADO_COLORS
│   ├── mazo-card/mazo-card.component.ts  # Visor de slides con modo wide
│   └── skeleton/skeleton.component.ts
└── views/
    ├── home/home.component.ts
    ├── entrega/entrega.component.ts
    ├── georreferenciacion/georreferenciacion.component.ts
    ├── detalles/detalles.component.ts
    └── proyecto/proyecto.component.ts
```

---

## Datos

- **URL raw**: `https://raw.githubusercontent.com/NicolasPlataANI/data_inventario/main/inventario.json`
- **Formato**: columnar — `{ "ColumnaName": { "0": val, "1": val, ... } }`
- **Quirk importante**: las claves de activos en el JSON tienen **zero-width spaces** (U+200B). La función `normalizeKey()` en `inventario.service.ts` los elimina al parsear.
- **41 proyectos**, **19 tipos de activo**, valores: `Entregado | Parcialmente Entregado | Pendiente | No Aplica | null`

---

## Sistema de diseño — "Civic Luminary"

Ver `DESIGN.md` para la especificación completa. Resumen de reglas críticas:

- **Sin bordes `1px solid`** para separar secciones — usar diferencia de tono entre `surface` → `surface-low` → `surface-container`
- **Fondo base**: `#fff8f4` (crema, no blanco puro)
- **Fuentes**: `Public Sans` para títulos/display · `Inter` para body/datos
- **Glassmorphism** en navbar: `bg-[#fff8f4]/80 backdrop-blur-[20px]`
- Variables CSS en `src/styles.css`: `--color-primary`, `--color-surface`, etc.

### Paleta de estados (semáforo estándar — NO usar colores ANI aquí)

| Estado | Color | Variable |
|---|---|---|
| Entregado | `#16a34a` verde | `ESTADO_COLORS.entregado` |
| Parcialmente Entregado | `#d97706` amarillo | `ESTADO_COLORS.parcialmenteEntregado` |
| Pendiente | `#dc2626` rojo | `ESTADO_COLORS.pendiente` |
| No Aplica | `#9ca3af` gris | `ESTADO_COLORS.noAplica` |

Fuente de verdad: `src/app/shared/echart-defaults.ts` → `ESTADO_COLORS`.

---

## ECharts — reglas

- Registrar con `provideEchartsCore({ echarts: () => import('echarts') })` en `app.config.ts`
- **Siempre** usar `isBrowser` guard antes del directive `echarts` (evita error `window is not defined` en SSR)
- Base de opciones: `{ ...echartsBase(), tooltip: { ...tooltipBase } }` — nunca hardcodear `backgroundColor` o colores de texto
- Las rutas con ECharts deben tener `renderMode: RenderMode.Server` en `app.routes.server.ts`

---

## Tabla `/detalles` — detalles técnicos

- Columnas **Proyecto** (`left: 0`) y **Responsable** (`left: 220px`) son `sticky`
- El ancho mínimo es `220 + 150 + 19×140 = 3030px` — siempre habrá scroll horizontal
- La barra de scroll existe tanto **arriba como abajo** de la tabla (barra espejo sincronizada con `syncScroll()`)
- Filtro por nombre de proyecto **y** por responsable (el mismo input)
- Sort clickeable en headers "Proyecto" y "Responsable" — `sortColumn` signal controla cuál está activo

---

## Componente MazoCard (`/entrega`)

Tres estados:
1. **Deck colapsado** — mazo de 3 cartas apiladas con rotación
2. **Visor in-place** — slides dentro de la columna del grid (default al hacer clic)
3. **Visor wide** — overlay centrado `min(92vw, 1080px)` con backdrop blur (botón ⛶)

Navegación: flechas, dots clickeables, teclado (`←` `→` `Escape`).

---

## CI/CD — GitHub Pages

`.github/workflows/deploy.yml` — **completamente activo**. Build + deploy automático en cada push a `main`/`master`.

**Único paso manual antes del primer deploy:**
1. En el workflow, reemplazar `NOMBRE-DEL-REPO` con el nombre exacto del repositorio GitHub
2. En GitHub → Settings → Pages → Source: seleccionar **GitHub Actions**

**Cómo funciona el routing SPA en GitHub Pages:**
- `index.html` se copia a `404.html` — cualquier ruta no encontrada (ej. `/detalles/5`) es atendida por Angular Router en el cliente
- `.nojekyll` desactiva el procesamiento de Jekyll

**outputMode**: `"static"` en `angular.json` — no hay servidor Node.js.

---

## Pendientes conocidos

- Definir destino de deploy y descomentar el job en `deploy.yml`
- Swipe touch en `MazoCard` para móvil (actualmente solo flechas y teclado)
- La tabla en `/detalles` en pantallas muy pequeñas (~< 480px) requiere revisión de UX
