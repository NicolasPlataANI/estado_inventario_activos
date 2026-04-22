# PLAN.md — Inventario ANI: Checklist Técnico y Secuencial

## Contexto Técnico del Proyecto

| Ítem | Valor |
|---|---|
| Framework | Angular 21.1 · Standalone Components · SSR activo |
| Estilos | Tailwind CSS 4.x (ya importado vía `@import "tailwindcss"` en `styles.css`) |
| Gráficas | Apache ECharts vía `ngx-echarts` |
| Datos | JSON remoto consumido con `HttpClient` + `withFetch()` (SSR-safe) |
| Diseño | "Civic Luminary" — paleta crema/naranja, sin bordes 1px, glassmorphism |
| Package manager | npm 10.9.2 |
| Node target | ES2022, `strict: true` |

---

## Resúmenes Extraídos de los HTML Locales

> Estos textos son el contenido real que se usará en la vista `/entrega`.

**Escenario 1 — Entrega Dispersa y Sin Estandarización** (`public/htmls/Escenario 1.html`):
> La información entregada por el concesionario se distribuye en múltiples carpetas sin estructura unificada, obligando a revisiones manuales de aproximadamente dos semanas por profesional más dos semanas adicionales de respuesta, lo que puede superar un mes por ciclo completo. Las capas en archivos DWG carecen de nomenclatura estándar, dificultando la identificación de activos como calzada, berma o separador e incrementando el riesgo de inconsistencias.

**Escenario 2 — Entrega Estructurada** (`public/htmls/Escenario 2.html`):
> La información se entrega de forma completa y organizada: en AutoCAD puede presentarse como un único archivo con capas por tipo de elemento o como archivos independientes por componente (cunetas, drenajes, señalización). En entornos SIG como ArcGIS Pro, las capas temáticas con geometría definida (punto, línea, polígono) habilitan directamente su análisis espacial, reduciendo reprocesos, minimizando errores y optimizando los tiempos de integración.

---

## Paso 1 — Dependencias y Configuración Base

- [ ] 1.1 Instalar `echarts` y `ngx-echarts`:
  ```bash
  npm install echarts ngx-echarts
  ```
- [ ] 1.2 Verificar estado de Tailwind 4.x — `@import "tailwindcss"` ya presente en `styles.css` ✓
- [ ] 1.3 Extender `styles.css` con variables CSS del DESIGN.md y fuentes Google:
  ```css
  @import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;600;700&family=Inter:wght@400;500&display=swap');

  :root {
    --color-primary: #a04100;
    --color-primary-container: #fa6f18;
    --color-surface: #fff8f4;
    --color-surface-low: #fdf2e9;
    --color-surface-container: #f5ebe0;
    --color-secondary: #4e6073;
    --color-on-surface: #1f1b16;
  }

  body { background-color: var(--color-surface); color: var(--color-on-surface); font-family: 'Inter', sans-serif; }
  h1, h2, h3 { font-family: 'Public Sans', sans-serif; }
  ```
- [ ] 1.4 En `app.config.ts`, agregar `provideHttpClient(withFetch())`:
  ```typescript
  import { provideHttpClient, withFetch } from '@angular/common/http';
  // ...
  providers: [..., provideHttpClient(withFetch()), provideEcharts({ echarts: () => import('echarts') })]
  ```
- [ ] 1.5 Confirmar que `tsconfig.json` tiene `strict: true` ✓ (ya activo)

---

## Paso 2 — Modelado de Datos (Tipos TypeScript)

- [ ] 2.1 Leer el JSON raw de:
  `https://raw.githubusercontent.com/NicolasPlataANI/data_inventario/main/inventario.json`
  y mapear todos los campos reales antes de crear las interfaces
- [ ] 2.2 Crear `src/app/core/models/inventario.model.ts` con tipos estrictos:
  ```typescript
  export type EstadoGeorref = 'Entregado' | 'Parcial' | 'Pendiente';

  export interface ElementoVial {
    nombre: string;
    estado: EstadoGeorref;
    // ...demás campos que el JSON exponga
  }

  export interface Proyecto {
    id: string;
    nombre: string;
    responsableANI: string;
    concesionario: string;
    estadoGeorreferenciacion: EstadoGeorref;
    elementos: ElementoVial[];
    // ...demás campos
  }
  ```
- [ ] 2.3 Crear `src/app/core/services/inventario.service.ts`:
  - `inject(HttpClient)` para fetch
  - `getInventario(): Observable<Proyecto[]>` apuntando a la URL raw de GitHub
  - `shareReplay(1)` para cachear la respuesta y evitar múltiples llamadas HTTP
  - `makeStateKey<Proyecto[]>('inventario')` + `TransferState` para compatibilidad SSR

---

## Paso 3 — Enrutamiento

- [ ] 3.1 Definir rutas en `src/app/app.routes.ts` con lazy loading por componente:
  ```typescript
  export const routes: Routes = [
    { path: '', loadComponent: () => import('./views/home/home.component').then(m => m.HomeComponent) },
    { path: 'entrega', loadComponent: () => import('./views/entrega/entrega.component').then(m => m.EntregaComponent) },
    { path: 'georreferenciacion', loadComponent: () => import('./views/georreferenciacion/georreferenciacion.component').then(m => m.GeorreferenciacionComponent) },
    { path: 'detalles', loadComponent: () => import('./views/detalles/detalles.component').then(m => m.DetallesComponent) },
    { path: 'detalles/:id', loadComponent: () => import('./views/proyecto/proyecto.component').then(m => m.ProyectoComponent) },
    { path: '**', redirectTo: '' }
  ];
  ```
- [ ] 3.2 Crear estructura de carpetas `src/app/views/{home,entrega,georreferenciacion,detalles,proyecto}/`

---

## Paso 4 — Shell y Navegación

- [ ] 4.1 Crear `src/app/layout/navbar/navbar.component.ts` (Standalone):
  - Logo: `<img src="logoani.svg" />` desde `/public`
  - Links con `routerLinkActive` a las 5 rutas
  - **Glassmorphism DESIGN.md:** clase `bg-[#fff8f4]/80 backdrop-blur-[20px] sticky top-0 z-50`
  - Sin borde inferior: separación por tonal layering
- [ ] 4.2 Actualizar `src/app/app.html`:
  ```html
  <app-navbar />
  <main class="min-h-screen">
    <router-outlet />
  </main>
  ```

---

## Paso 5 — Vista: Home (`/`)

- [ ] 5.1 Crear `src/app/views/home/home.component.ts`
- [ ] 5.2 Sección hero:
  - Título `display-lg`: Public Sans 3.5rem, `tracking-wide`, color `on-surface`
  - Imagen destacada: `Carretera 1.JPG` o `Carretera 2.JPG`, width full, con overlay `bg-gradient-to-br from-[#a04100]/70 to-[#fa6f18]/50` a 135°
- [ ] 5.3 Gráfica de flujo inferior — mockup estático del flujo ANI:
  - Layout HTML/Tailwind (no ECharts): contenedores "Data Totem" verticales slim con `bg-[surface-container-highest]`
  - Nodos: **Concesionario → Recepción ANI → Validación Técnica → Georreferenciación → Sistema**
  - Conectores: líneas CSS con `border-r-2 border-[#fa6f18]/40`, no `border` completo

---

## Paso 6 — Vista: Entrega de Información (`/entrega`)

- [ ] 6.1 Crear `src/app/views/entrega/entrega.component.ts`
- [ ] 6.2 Crear componente compartido `src/app/shared/mazo-card/mazo-card.component.ts`:
  - Input: `titulo`, `resumen`, `imagenes: string[]`, `color: string`
  - Estado interno: `expanded = signal(false)`
  - **Efecto mazo (collapsed):** 3 cartas apiladas con `transform rotate-[-2deg]`, `rotate-[1deg]`, `rotate-0` en offset
  - **Expansión full-screen:** `fixed inset-0 z-50 overflow-y-auto bg-[#fff8f4]` con `transition-all duration-500`
  - Overlay de cierre: botón `✕` en esquina superior derecha
- [ ] 6.3 Contenido Escenario 1:
  - Resumen extraído del HTML (ver sección de resúmenes arriba)
  - Imágenes: `Escenario 1_html_ee07e765.png`, `Escenario 1_html_5ceb00cd.png`, `Escenario 1_html_cc0e48f6.png`, `Escenario 1_html_517103ae.png`
- [ ] 6.4 Contenido Escenario 2:
  - Resumen extraído del HTML (ver sección de resúmenes arriba)
  - Imágenes: `Escenario 2_html_145e1fa4.jpg`, `Escenario 2_html_d2a79b00.jpg`, `Escenario 2_html_ff9764f7.jpg`

---

## Paso 7 — Vista: Estado de Georreferenciación (`/georreferenciacion`)

- [ ] 7.1 Crear `src/app/views/georreferenciacion/georreferenciacion.component.ts`
- [ ] 7.2 Texto normativo: párrafo institucional sobre las obligaciones de entrega de información georreferenciada según ANI
- [ ] 7.3 **Pie Chart con ECharts** (`[options]` binding vía `ngx-echarts`):
  - Series: `Entregado` (#a04100), `Parcial` (#fa6f18), `Pendiente` (#4e6073)
  - `backgroundColor: 'transparent'`, sin `splitLine`, sin `axisLine`
  - Datos calculados desde `InventarioService` con `computed()` sobre la lista de proyectos
  - `legend` en la parte inferior, sin borde, font Inter
- [ ] 7.4 Botón "Visualizar datos" → `routerLink="/detalles"`:
  - Clase: `rounded-full bg-gradient-to-r from-[#a04100] to-[#fa6f18] text-white px-8 py-3`
  - Hover: `hover:-translate-y-0.5 hover:shadow-[0_32px_48px_rgba(31,27,22,0.06)] transition-all`

---

## Paso 8 — Vista: Detalles de Activos Viales (`/detalles`)

- [ ] 8.1 Crear `src/app/views/detalles/detalles.component.ts`
- [ ] 8.2 **Barra de búsqueda** (filtra en tiempo real):
  - Signal: `searchQuery = signal('')`
  - Computed: `filteredProyectos = computed(() => proyectos().filter(...))`
  - Input Tailwind: `bg-[#fdf2e9] rounded-lg px-4 py-2 border-0 focus:outline-none focus:border-b-2 focus:border-[#a04100]`
- [ ] 8.3 **Sort por columna "Proyecto"**:
  - Signal: `sortAsc = signal(true)`
  - Toggle en click de cabecera, ícono ▲/▼ inline
  - `sortedProyectos = computed(() => [...filteredProyectos()].sort(...))`
- [ ] 8.4 **Tabla (17 proyectos)**:
  - Wrapper: `<div class="overflow-x-auto">` alrededor del `<table>`
  - Columna "Proyecto": `class="sticky left-0 z-10 bg-[#fdf2e9] min-w-[200px]"`
  - Columna "Responsable ANI": `class="sticky left-[200px] z-10 bg-[#fdf2e9] min-w-[180px]"`
  - Filas alternas: `odd:bg-[#fff8f4] even:bg-[#fdf2e9]` — sin bordes `1px solid`
  - Ghost border para accesibilidad: `outline outline-1 outline-[#1f1b16]/15` solo en focus de fila
  - Click en fila: `router.navigate(['/detalles', proyecto.id])`
- [ ] 8.5 **Resumen inferior** con micro-barra de progreso ECharts (bar horizontal apilado):
  - Total Entregados / Parciales / Pendientes
  - Chart minimalista: sin ejes visibles, colores del DESIGN.md

---

## Paso 9 — Vista: Proyecto Específico (`/detalles/:id`)

- [ ] 9.1 Crear `src/app/views/proyecto/proyecto.component.ts`
- [ ] 9.2 Carga de datos:
  - `ActivatedRoute` → `paramMap.get('id')`
  - Filtrar desde `InventarioService.getInventario()` por `id`
  - Signal: `proyecto = signal<Proyecto | null>(null)`
- [ ] 9.3 **Panel Izquierdo** (60% en desktop):
  - Lista 2 columnas: `grid grid-cols-2 gap-x-8 gap-y-6`
  - Por cada `ElementoVial`: nombre + chip de estado
  - Chips: `rounded-md text-sm px-3 py-1` con colores por estado:
    - Entregado: `bg-[#fa6f18]/15 text-[#a04100]`
    - Parcial: `bg-[#4e6073]/15 text-[#4e6073]`
    - Pendiente: `bg-[#1f1b16]/10 text-[#1f1b16]`
  - Sin líneas divisoras — `gap-y-6` como único separador
- [ ] 9.4 **Panel Derecho** (40% en desktop):
  - **Donut Chart ECharts**: `type: 'pie'` con `radius: ['50%', '75%']`
  - Colores: Entregado `#a04100`, Parcial `#fa6f18`, Pendiente `#4e6073`
  - Sin bordes, `backgroundColor: 'transparent'`
  - **Caja Observaciones**:
    - `<textarea class="w-full bg-[#fdf2e9] border-0 border-b-2 border-[#1f1b16]/20 focus:border-[#a04100] outline-none resize-none p-4 rounded-t-lg font-inter">`
    - Label flotante: "Observaciones técnicas"
- [ ] 9.5 Layout responsive:
  - Desktop: `grid lg:grid-cols-[60%_40%] gap-12`
  - Móvil: `flex flex-col gap-8`

---

## Paso 10 — Configuración Global de ECharts

- [ ] 10.1 Crear `src/app/shared/echart-defaults.ts` — fábrica de opciones base:
  ```typescript
  export const echartsBaseOptions = {
    backgroundColor: 'transparent',
    textStyle: { fontFamily: 'Inter, sans-serif', color: '#1f1b16' },
    legend: { bottom: 0, icon: 'circle', itemGap: 16, borderWidth: 0 },
    grid: { containLabel: true, borderWidth: 0 },
  };
  ```
- [ ] 10.2 Todos los componentes con charts hacen `{ ...echartsBaseOptions, series: [...] }`
- [ ] 10.3 Confirmar `provideEcharts()` registrado en `app.config.ts` (Paso 1.4) ✓

---

## Paso 11 — Optimizaciones y Accesibilidad

- [ ] 11.1 Lazy loading de rutas confirmado (Paso 3) ✓
- [ ] 11.2 **SSR / TransferState**: en `InventarioService`, usar `isPlatformBrowser` + `TransferState` con `makeStateKey` para hidratar datos del servidor al cliente sin doble fetch
- [ ] 11.3 Skeletos de carga: componente `src/app/shared/skeleton/skeleton.component.ts` con `animate-pulse bg-[#fdf2e9] rounded-lg`; mostrar mientras el observable no emite
- [ ] 11.4 `aria-label` en todos los botones de sort, búsqueda y expand de mazos
- [ ] 11.5 Verificar contraste WCAG AA: texto `#1f1b16` sobre `#fff8f4` (ratio ~14:1 ✓)
- [ ] 11.6 Budgets en `angular.json`: `initial: 500kB warning / 1MB error` ya configurados ✓

---

## Paso 12 — CI/CD: GitHub Actions

- [ ] 12.1 Crear `.github/workflows/deploy.yml`:
  ```yaml
  name: Build & Deploy
  on:
    push:
      branches: [main, master]

  jobs:
    build:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4

        - uses: actions/setup-node@v4
          with:
            node-version: '20'
            cache: 'npm'

        - name: Install dependencies
          run: npm ci

        - name: Build production
          run: npm run build

        - name: Upload dist artifact
          uses: actions/upload-artifact@v4
          with:
            name: dist-inventario
            path: dist/inventarioApp/browser
            retention-days: 7

    # deploy:
    #   needs: build
    #   runs-on: ubuntu-latest
    #   steps:
    #     # Descomentar y configurar según destino:
    #     # GitHub Pages: actions/deploy-pages@v4
    #     # Firebase: FirebaseExtended/action-hosting-deploy@v0
    #     # Vercel: amondot/vercel-action@v0.1
  ```
- [ ] 12.2 Definir el destino de deploy **antes de descomentar el job `deploy`**:
  - GitHub Pages requiere ajustar `base-href` en el build command: `--base-href=/repo-name/`
  - Firebase / Vercel tienen adapters Angular SSR propios
- [ ] 12.3 Agregar `secrets` necesarios en Settings → Secrets del repositorio de GitHub

---

## Árbol de Archivos a Crear

```
src/
├── styles.css                                  # Variables CSS + Google Fonts
├── app/
│   ├── app.config.ts                           # +provideHttpClient +provideEcharts
│   ├── app.routes.ts                           # 5 rutas lazy
│   ├── app.html                                # <app-navbar> + <router-outlet>
│   ├── core/
│   │   ├── models/
│   │   │   └── inventario.model.ts             # Interfaces: Proyecto, ElementoVial, EstadoGeorref
│   │   └── services/
│   │       └── inventario.service.ts           # HttpClient + shareReplay + TransferState
│   ├── layout/
│   │   └── navbar/
│   │       └── navbar.component.ts             # Glassmorphism navbar
│   ├── shared/
│   │   ├── echart-defaults.ts                  # Opciones base ECharts minimalistas
│   │   ├── mazo-card/
│   │   │   └── mazo-card.component.ts          # Mazo collapsible → full-screen
│   │   └── skeleton/
│   │       └── skeleton.component.ts           # Loading skeleton animate-pulse
│   └── views/
│       ├── home/
│       │   └── home.component.ts               # Hero + Data Totem flow
│       ├── entrega/
│       │   └── entrega.component.ts            # 2 mazos de cartas
│       ├── georreferenciacion/
│       │   └── georreferenciacion.component.ts # Pie Chart + botón
│       ├── detalles/
│       │   └── detalles.component.ts           # Tabla 17 filas + sticky + sort
│       └── proyecto/
│           └── proyecto.component.ts           # Donut + lista 2 col + observaciones
.github/
└── workflows/
    └── deploy.yml
```

---

> **Estado:** Pendiente de aprobación.
>
> Responde **"Aprobado"** para iniciar la ejecución del **Paso 1** (instalación de dependencias + tokens CSS).
