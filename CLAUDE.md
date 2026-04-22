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
| Mapa | Leaflet 1.9.4 (dynamic import — browser-only) |
| GeoData | FlatGeobuf 4.4 (`flatgeobuf` — streaming `.fgb` desde GitHub raw) |
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
| `/georreferenciacion` | `GeorreferenciacionComponent` | Client (usa ECharts) |
| `/detalles` | `DetallesComponent` | Client (usa ECharts) |
| `/detalles/:id` | `ProyectoComponent` | Client (dinámico) |
| `/geodata/:id` | `GeodataComponent` | Client (usa Leaflet + FlatGeobuf) |

Configuración SSR en `src/app/app.routes.server.ts`.

---

## Estructura de `src/app/`

```
app/
├── core/
│   ├── models/
│   │   ├── inventario.model.ts   # Tipos: Proyecto, ElementoVial, EstadoElemento, etc.
│   │   └── geodata.model.ts      # InfoProyecto, ELEMENTOS_GEODATA (16 capas con colores)
│   └── services/
│       ├── inventario.service.ts  # HTTP + parseRaw + TransferState SSR
│       └── geodata.service.ts     # GitHub API/raw, FlatGeobuf streaming, caché de capas
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
    ├── proyecto/proyecto.component.ts
    └── geodata/geodata.component.ts   # Dashboard GIS: Leaflet + capas FGB + info proyecto
```

---

## Datos

### Inventario (`inventario.service.ts`)

- **URL raw**: `https://raw.githubusercontent.com/NicolasPlataANI/data_inventario/main/inventario.json`
- **Formato**: columnar — `{ "ColumnaName": { "0": val, "1": val, ... } }`
- **Quirk importante**: las claves de activos en el JSON tienen **zero-width spaces** (U+200B). La función `normalizeKey()` los elimina al parsear.
- **41 proyectos**, **19 tipos de activo**, valores: `Entregado | Parcialmente Entregado | Pendiente | No Aplica | null`

### GeoData (`geodata.service.ts`)

- **Base raw**: `https://raw.githubusercontent.com/NicolasPlataANI/data_inventario/main/geodata/{folder}/{file}.fgb`
- **Formato de capas**: FlatGeobuf (`.fgb`), streaming con `flatgeobuf/geojson.deserialize`
- **Descubrimiento de carpeta**: `GET https://api.github.com/repos/.../contents/geodata` → busca la carpeta que coincide con el nombre del proyecto (exact match, luego partial, luego fallback al nombre normalizado)
- **Quirk typo**: el JSON puede tener `avance_finaciero_ejecutado` (sin 'n') — `getInfoProyecto` tiene fallback para ambas grafías
- **Fallback rate limit**: si el API de GitHub devuelve error, `getCapasDisponibles` retorna `[]` y `GeodataComponent` intenta las 16 capas estándar de `ELEMENTOS_GEODATA`
- **Caché**: `layersCache` (Map por nombre de proyecto) y `foldersCache$` (Observable compartido) evitan peticiones repetidas
- **16 tipos de activo GIS**: berma, calzada, cco, ciclorruta, cuneta, defensa_vial, dispositivo_its, estacion_peaje, estacion_pesaje, luminarias, muro, puente, senal_vertical, separador, tunel, zona_servicio

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
- Las rutas con ECharts deben tener `renderMode: RenderMode.Client` en `app.routes.server.ts`
- **"No Aplica" excluido de gráficas**: `/georreferenciacion`, `/detalles` y `/detalles/:id` muestran solo los 3 estados activos (Entregado / Parc. Entregado / Pendiente) en charts y leyendas de gráfica. La leyenda flotante de la tabla en `/detalles` sí mantiene "No Aplica".

---

## Dashboard GeoData (`/geodata/:id`)

Layout de 3 paneles fijos (`height: calc(100vh - 64px)`):

- **Panel izquierdo** (`lg:w-72`): info del proyecto (nombre, etapa, longitud, empleos, habitantes, barras de avance físico/financiero). Carga en paralelo con las capas — no bloquea el mapa.
- **Panel central** (flex-1): mapa Leaflet inicializado en `afterNextRender` con `isBrowser` guard. Vista inicial centrada en Colombia `[4.6, -74.3]` zoom 7.
- **Panel derecho** (`lg:w-60`): selector de mapa base (Oscuro/Satélite/Calles), botón recentrar, lista de capas con checkbox + conteo + color swatch.

### Leaflet

- Import dinámico: `await import('leaflet')` — nunca en el top del archivo (rompe SSR)
- Tile layers: CartoDB Dark · Esri World Imagery · OSM Streets
- Las capas GeoJSON se renderizan con `L.geoJSON` (polilíneas) y `L.circleMarker` (puntos), color por capa
- `resetZoom()` llama `fitBounds(initialBounds, { padding: [50, 50] })`
- Destrucción limpia en `destroyRef.onDestroy`

### Colores de capas GIS

Paleta de alto contraste (neon) para visibilidad sobre todos los mapas base. Definidos en `geodata.model.ts → ELEMENTOS_GEODATA`. Si llega un archivo no listado, se genera un color `hsl` pseudoaleatorio basado en hash del nombre.

### Señal `loadId`

Incrementa en cada `loadProjectData()` para evitar race conditions si el usuario navega rápido entre proyectos.

---

## Home (`/`) — cambios recientes

- **Hero title**: "Capacitación sobre el Estado de Georreferenciación de Proyectos de Infraestructura - ANI"
- **Sección "Avances año a año"**: timeline interactivo con círculos clickeables por año. `selectedYear` es un signal; la línea conectora se colorea con `var(--color-primary)` para años pasados. El contenido del año seleccionado aparece en una card animada debajo del timeline.

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

## ProyectoComponent (`/detalles/:id`)

- CTA **"Dashboard Geodata →"** enlaza a `/geodata/:id`
- Gráfica de dona y leyenda excluyen "No Aplica" (solo 3 estados activos)

---

## Pendientes conocidos

- Definir destino de deploy y descomentar el job en `deploy.yml`
- Swipe touch en `MazoCard` para móvil (actualmente solo flechas y teclado)
- La tabla en `/detalles` en pantallas muy pequeñas (~< 480px) requiere revisión de UX
- Leaflet CSS debe cargarse globalmente (`styles.css` o `angular.json`) — verificar si los iconos de control de zoom se renderizan correctamente en producción
