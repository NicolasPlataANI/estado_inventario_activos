import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  PLATFORM_ID,
  signal,
  ViewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';

import { InventarioService } from '../../core/services/inventario.service';
import { GeodataService } from '../../core/services/geodata.service';
import { ELEMENTOS_GEODATA, InfoProyecto } from '../../core/models/geodata.model';
import { echartsBase, tooltipBase } from '../../shared/echart-defaults';

const GEODATA_BASE =
  'https://raw.githubusercontent.com/NicolasPlataANI/data_inventario/main/geodata';

interface CapaState {
  key: string;
  label: string;
  color: string;
  count: number;
  visible: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  instance: any;
}

@Component({
  selector: 'app-geodata',
  standalone: true,
  imports: [RouterLink, NgxEchartsDirective],
  template: `
    <!-- ── BREADCRUMB ────────────────────────────────────────────── -->
    <nav class="bg-[var(--color-surface)] pt-8 pb-4 px-6 lg:px-10">
      <ol class="flex flex-wrap items-center gap-2 font-inter text-xs" style="color: var(--color-secondary)">
        <li><a routerLink="/" class="hover:text-[var(--color-primary)] transition-colors">Inicio</a></li>
        <li aria-hidden="true">›</li>
        <li><a routerLink="/detalles" class="hover:text-[var(--color-primary)] transition-colors">Detalles de Activos</a></li>
        <li aria-hidden="true">›</li>
        @if (info()) {
          <li>
            <a [routerLink]="['/detalles', id()]"
               class="hover:text-[var(--color-primary)] transition-colors"
               style="max-width:22ch; display:inline-block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap">
              {{ info()!.nombre }}
            </a>
          </li>
          <li aria-hidden="true">›</li>
        }
        <li style="color: var(--color-on-surface)" class="font-medium">Dashboard Geodata</li>
      </ol>
    </nav>

    <!-- ── CUERPO PRINCIPAL ──────────────────────────────────────── -->
    <div class="relative flex flex-col" style="min-height: calc(100vh - 130px)">

      <!-- ── Loading overlay ── -->
      @if (cargando()) {
        <div class="absolute inset-0 z-50 flex flex-col items-center justify-center"
             style="background: rgba(255,248,244,0.92); backdrop-filter: blur(4px)">
          <div class="w-12 h-12 rounded-full border-4 animate-spin mb-4"
               style="border-color: var(--color-surface-container-highest); border-top-color: var(--color-primary)"></div>
          <p class="font-inter text-sm font-medium" style="color: var(--color-secondary)">
            Decodificando capas geoespaciales…
          </p>
        </div>
      }

      <!-- ── Fila principal: info | mapa | capas ── -->
      <div class="flex-1 flex flex-col lg:flex-row" style="min-height: 520px">

        <!-- ════ PANEL IZQUIERDO: Info proyecto ════ -->
        <aside
          class="lg:w-72 shrink-0 flex flex-col gap-5 p-6 lg:py-8 lg:px-7 border-b lg:border-b-0 lg:border-r overflow-y-auto"
          style="background: var(--color-surface-container); border-color: rgba(31,27,22,0.06)"
        >
          @if (!info() && !errMsg()) {
            <!-- Skeleton -->
            <div class="flex flex-col gap-3">
              @for (w of ['75%','50%','100%','100%','100%']; track w) {
                <div class="h-5 rounded-lg animate-pulse" [style.width]="w"
                     style="background: var(--color-surface-container-highest)"></div>
              }
            </div>

          } @else if (info()) {

            <!-- Nombre + etapa -->
            <div>
              <p class="font-inter text-xs font-medium tracking-widest uppercase mb-1"
                 style="color: var(--color-primary)">Inventario Geoespacial</p>
              <h1
                style="font-family:'Public Sans',sans-serif; font-size:1.0625rem; font-weight:700; color:var(--color-on-surface); line-height:1.2; letter-spacing:-0.02em"
              >{{ info()!.nombre }}</h1>
              <span
                class="mt-2 inline-block px-2.5 py-1 rounded-full font-inter text-xs font-medium"
                style="background: rgba(160,65,0,0.10); color: var(--color-primary)"
              >{{ info()!.etapa }}</span>
            </div>

            <!-- Stats: longitud · empleos · habitantes -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <p class="font-inter text-[10px] uppercase tracking-widest font-semibold mb-0.5" style="color:var(--color-secondary)">Longitud</p>
                <p style="font-family:'Public Sans',sans-serif; font-size:1.5rem; font-weight:700; color:var(--color-on-surface); line-height:1; letter-spacing:-0.03em">
                  {{ info()!.longitud }}<span class="text-xs font-normal ml-0.5" style="color:var(--color-secondary)">km</span>
                </p>
              </div>
              <div>
                <p class="font-inter text-[10px] uppercase tracking-widest font-semibold mb-0.5" style="color:var(--color-secondary)">Empleos</p>
                <p style="font-family:'Public Sans',sans-serif; font-size:1.5rem; font-weight:700; color:var(--color-on-surface); line-height:1; letter-spacing:-0.03em">
                  {{ num(info()!.empleos_generados) }}
                </p>
              </div>
              <div class="col-span-2">
                <p class="font-inter text-[10px] uppercase tracking-widest font-semibold mb-0.5" style="color:var(--color-secondary)">Habitantes beneficiados</p>
                <p style="font-family:'Public Sans',sans-serif; font-size:1.5rem; font-weight:700; color:var(--color-on-surface); line-height:1; letter-spacing:-0.03em">
                  {{ num(info()!.habitantes_beneficiados) }}
                </p>
              </div>
            </div>

            <!-- Barras de avance -->
            <div class="flex flex-col gap-4">
              @for (barra of barrasAvance(); track barra.label) {
                <div>
                  <p class="font-inter text-[10px] uppercase tracking-widest font-semibold mb-1.5"
                     style="color: var(--color-secondary)">{{ barra.label }}</p>
                  <div class="relative h-1.5 rounded-full overflow-hidden"
                       style="background: var(--color-surface-container-highest)">
                    <div class="absolute inset-y-0 left-0 rounded-full"
                         [style.width]="pct(barra.planeado)"
                         style="background: rgba(160,65,0,0.20)"></div>
                    <div class="absolute inset-y-0 left-0 rounded-full"
                         [style.width]="pct(barra.ejecutado)"
                         style="background: #a04100"></div>
                  </div>
                  <div class="flex justify-between mt-1">
                    <span class="font-inter text-xs font-semibold" style="color:#a04100">Ejec. {{ pct(barra.ejecutado) }}</span>
                    <span class="font-inter text-xs" style="color:var(--color-secondary)">Plan. {{ pct(barra.planeado) }}</span>
                  </div>
                </div>
              }
            </div>

            <!-- Fecha + volver -->
            <div class="mt-auto pt-4 flex flex-col gap-3 border-t" style="border-color:rgba(31,27,22,0.08)">
              <p class="font-inter text-xs" style="color:var(--color-secondary)">
                Corte: <strong style="color:var(--color-on-surface)">{{ fmtDate(info()!.fecha_avance) }}</strong>
              </p>
              <a [routerLink]="['/detalles', id()]"
                 class="flex items-center gap-1.5 font-inter text-sm font-medium"
                 style="color:var(--color-secondary)">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path d="M9 2L4 7l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Volver al proyecto
              </a>
            </div>

          } @else {
            <p class="font-inter text-sm" style="color:var(--color-secondary)">{{ errMsg() }}</p>
            <a routerLink="/detalles" class="font-inter text-sm" style="color:var(--color-primary)">← Volver</a>
          }
        </aside>

        <!-- ════ PANEL CENTRAL: Mapa Leaflet ════ -->
        <main class="flex-1 relative min-h-[400px]">
          <div #mapEl class="absolute inset-0" style="z-index:0"></div>
        </main>

        <!-- ════ PANEL DERECHO: Controles + capas ════ -->
        <aside
          class="lg:w-60 shrink-0 flex flex-col border-t lg:border-t-0 lg:border-l"
          style="background: var(--color-surface); border-color: rgba(31,27,22,0.06)"
        >

          <!-- Recentrar -->
          <div class="p-4 border-b" style="border-color:rgba(31,27,22,0.06)">
            <button type="button" (click)="resetZoom()"
              class="w-full py-2 rounded-lg font-inter text-xs font-semibold uppercase tracking-widest cursor-pointer transition-opacity hover:opacity-90 active:scale-95"
              style="background: var(--color-primary); color: white; border: none">
              ⊕ Recentrar mapa
            </button>
          </div>

          <!-- Mapa base -->
          <div class="p-4 border-b" style="border-color:rgba(31,27,22,0.06)">
            <p class="font-inter text-[10px] uppercase tracking-widest font-semibold mb-2" style="color:var(--color-secondary)">Mapa base</p>
            <div class="flex gap-1">
              @for (base of baseMaps; track base) {
                <button type="button" (click)="cambiarBase(base)"
                  class="flex-1 py-1.5 rounded font-inter text-[9px] font-bold uppercase transition-colors cursor-pointer"
                  [style.background]="mapaBaseActual() === base ? 'var(--color-primary)' : 'var(--color-surface-container)'"
                  [style.color]="mapaBaseActual() === base ? 'white' : 'var(--color-secondary)'"
                  style="border:none">{{ base }}</button>
              }
            </div>
          </div>

          <!-- Header capas -->
          <div class="px-4 py-2.5 border-b flex justify-between items-center" style="border-color:rgba(31,27,22,0.06)">
            <span class="font-inter text-[10px] uppercase tracking-widest font-semibold" style="color:var(--color-secondary)">
              GIS ({{ num(totalCount()) }})
            </span>
            <div class="flex gap-1">
              <button type="button" (click)="toggleTodas(true)"
                class="px-2 py-0.5 rounded font-inter text-[8px] font-bold uppercase cursor-pointer"
                style="background:var(--color-surface-container); color:var(--color-secondary); border:none">Todo</button>
              <button type="button" (click)="toggleTodas(false)"
                class="px-2 py-0.5 rounded font-inter text-[8px] font-bold uppercase cursor-pointer"
                style="background:var(--color-surface-container); color:var(--color-secondary); border:none">Nada</button>
            </div>
          </div>

          <!-- Lista de capas con checkboxes -->
          <div class="flex-1 p-2 overflow-y-auto" style="scrollbar-width:thin">
            @for (capa of capas(); track capa.key) {
              <label
                class="flex items-center justify-between group cursor-pointer p-2 rounded-lg transition-colors"
                [class.opacity-35]="capa.count === 0"
                [style.pointer-events]="capa.count === 0 ? 'none' : 'auto'"
              >
                <div class="flex items-center gap-2.5">
                  <span class="w-3 h-3 rounded-full shrink-0 ring-1 ring-black/10"
                        [style.background]="capa.color"
                        [style.box-shadow]="'0 0 6px ' + capa.color + 'AA'"></span>
                  <div class="flex flex-col">
                    <span class="font-inter text-xs font-semibold leading-none" style="color:var(--color-on-surface)">{{ capa.label }}</span>
                    <span class="font-inter text-[10px] mt-0.5 font-mono" style="color:var(--color-secondary)">
                      {{ capa.count > 0 ? num(capa.count) : '—' }}
                    </span>
                  </div>
                </div>
                <input type="checkbox" [checked]="capa.visible" [disabled]="capa.count === 0"
                  (change)="toggleCapa(capa)" class="w-3.5 h-3.5 cursor-pointer"
                  style="accent-color: var(--color-primary)">
              </label>
            }
          </div>

          <!-- Total -->
          <div class="px-4 py-3 border-t" style="border-color:rgba(31,27,22,0.12)">
            <div class="flex justify-between items-baseline">
              <span class="font-inter text-xs font-semibold uppercase tracking-widest"
                    style="color:var(--color-secondary)">Total</span>
              <span style="font-family:'Public Sans',sans-serif; font-size:1.125rem; font-weight:700; color:var(--color-primary); letter-spacing:-0.02em">
                {{ num(totalCount()) }}
              </span>
            </div>
          </div>

        </aside>
      </div>

      <!-- ════ PANEL INFERIOR: Gráfica de barras ════ -->
      @if (activeCapas().length > 0) {
        <section
          class="flex-shrink-0 flex flex-col border-t overflow-hidden transition-all duration-300"
          [style.height]="chartExpandido() ? '540px' : '220px'"
          style="background:var(--color-surface); border-color:rgba(31,27,22,0.06)"
        >
          <!-- Cabecera del panel -->
          <div class="flex items-center justify-between px-6 py-3 border-b shrink-0"
               style="border-color:rgba(31,27,22,0.06)">
            <div>
              <p class="font-inter text-xs font-medium tracking-widest uppercase" style="color:var(--color-primary)">
                Distribución de activos
              </p>
              <p class="font-inter text-[10px]" style="color:var(--color-secondary)">
                {{ num(totalCount()) }} registros · {{ activeCapas().length }} tipos de elemento
              </p>
            </div>
            <button type="button" (click)="chartExpandido.set(!chartExpandido())"
              class="px-3 py-1.5 rounded-lg font-inter text-xs font-semibold cursor-pointer transition-colors"
              style="background:var(--color-surface-container); color:var(--color-secondary); border:none">
              {{ chartExpandido() ? '↙ Reducir' : '↗ Expandir' }}
            </button>
          </div>

          <!-- ECharts bar chart -->
          @if (isBrowser) {
            <div echarts [options]="barChartOptions()" class="flex-1 min-h-0 w-full px-2"></div>
          }
        </section>
      }

    </div>
  `,
  styles: [`:host { display: block; }`],
})
export class GeodataComponent {
  @ViewChild('mapEl') private readonly mapEl!: ElementRef<HTMLDivElement>;

  private readonly svc        = inject(InventarioService);
  private readonly geodataSvc = inject(GeodataService);
  private readonly route      = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly id = toSignal(
    this.route.paramMap.pipe(map(pm => pm.get('id') ?? '')),
    { initialValue: '' },
  );

  private readonly proyectos = toSignal(this.svc.getInventario());

  private readonly projectNombre = computed(() => {
    const lista = this.proyectos();
    const id    = this.id();
    if (lista === undefined) return undefined;
    return lista.find(p => p.id === id)?.nombre ?? null;
  });

  protected readonly cargando       = signal(true);
  protected readonly info           = signal<InfoProyecto | null>(null);
  protected readonly capas          = signal<CapaState[]>(
    ELEMENTOS_GEODATA.map(el => ({ ...el, count: 0, visible: true, instance: null }))
  );
  protected readonly errMsg         = signal<string | null>(null);
  protected readonly mapaBaseActual = signal<string>('Oscuro');
  protected readonly chartExpandido = signal(false);

  protected readonly baseMaps = ['Oscuro', 'Satélite', 'Calles'] as const;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private L: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapInstance: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private initialBounds: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly tileLayers: Record<string, any> = {};
  private readonly mapReady = signal(false);

  constructor() {
    // Inicializar mapa después del primer render
    afterNextRender(() => {
      if (this.isBrowser) void this.initMap();
    });

    // Cargar datos cuando el mapa esté listo Y el nombre del proyecto esté disponible
    effect(() => {
      const ready  = this.mapReady();
      const nombre = this.projectNombre();
      if (!ready || nombre === undefined) return;
      if (nombre === null) {
        this.errMsg.set('Proyecto no encontrado.');
        this.cargando.set(false);
        return;
      }
      void this.loadProjectData(nombre);
    });

    this.destroyRef.onDestroy(() => {
      this.mapInstance?.remove();
      this.mapInstance = null;
    });
  }

  // ── Inicialización del mapa ──────────────────────────────────────

  private async initMap(): Promise<void> {
    const L = await import('leaflet');
    this.L = L;

    this.tileLayers['Oscuro']   = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',   { maxNativeZoom: 19, maxZoom: 22, attribution: '© CartoDB' });
    this.tileLayers['Satélite'] = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxNativeZoom: 19, maxZoom: 22, attribution: '© Esri' });
    this.tileLayers['Calles']   = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',               { maxNativeZoom: 19, maxZoom: 22, attribution: '© OSM' });

    this.mapInstance = L.map(this.mapEl.nativeElement, { zoomControl: false, maxZoom: 22 })
      .setView([4.6, -74.3], 7);

    L.control.zoom({ position: 'bottomright' }).addTo(this.mapInstance);
    this.tileLayers['Oscuro'].addTo(this.mapInstance);

    this.mapReady.set(true);
  }

  // ── Carga de datos y capas ───────────────────────────────────────

  private async loadProjectData(projectName: string): Promise<void> {
    this.cargando.set(true);
    this.errMsg.set(null);

    // Limpiar capas previas del mapa
    for (const capa of this.capas()) {
      if (capa.instance) this.mapInstance?.removeLayer(capa.instance);
    }
    this.capas.set(ELEMENTOS_GEODATA.map(el => ({ ...el, count: 0, visible: true, instance: null })));

    // Info del proyecto (no bloquea el render del mapa)
    firstValueFrom(this.geodataSvc.getInfoProyecto(projectName))
      .then(info => this.info.set(info))
      .catch(() => {});

    // Cargar archivos FGB en paralelo usando flatgeobuf
    const fgb = await import('flatgeobuf');
    const L   = this.L;
    const bbox = L.latLngBounds([]);

    await Promise.all(
      ELEMENTOS_GEODATA.map(async (el) => {
        const url = `${GEODATA_BASE}/${encodeURIComponent(projectName)}/${el.key}.fgb`;
        try {
          const response = await fetch(url);
          if (!response.ok) return;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const features: any[] = [];
          for await (const feature of fgb.geojson.deserialize(response.body!)) {
            features.push(feature);
          }
          if (features.length === 0) return;

          const layer = L.geoJSON(features, {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            style: () => ({ color: el.color, weight: 2.5, opacity: 0.95, fillColor: el.color, fillOpacity: 0.5 }),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pointToLayer: (_feature: any, latlng: any) =>
              L.circleMarker(latlng, { radius: 5, color: el.color, fillColor: el.color, fillOpacity: 0.9, weight: 1.5 }),
          });

          // Actualizar conteo y guardar instancia
          this.capas.update(cs =>
            cs.map(c => c.key === el.key ? { ...c, count: features.length, instance: layer } : c)
          );

          layer.addTo(this.mapInstance);

          try {
            const bounds = layer.getBounds();
            if (bounds.isValid()) bbox.extend(bounds);
          } catch { /* sin features válidos */ }

        } catch { /* archivo no existe → count = 0 */ }
      })
    );

    if (bbox.isValid()) {
      this.initialBounds = bbox;
      this.mapInstance.fitBounds(bbox, { padding: [50, 50] });
    }

    this.cargando.set(false);
  }

  // ── Controles del mapa ───────────────────────────────────────────

  protected resetZoom(): void {
    if (this.initialBounds && this.mapInstance) {
      this.mapInstance.fitBounds(this.initialBounds, { padding: [50, 50] });
    }
  }

  protected cambiarBase(nombre: string): void {
    if (!this.mapInstance) return;
    this.mapInstance.removeLayer(this.tileLayers[this.mapaBaseActual()]);
    this.tileLayers[nombre].addTo(this.mapInstance);
    this.mapaBaseActual.set(nombre);
  }

  protected toggleCapa(capa: CapaState): void {
    if (!this.mapInstance) return;
    const updated = { ...capa, visible: !capa.visible };
    if (updated.visible && updated.instance) this.mapInstance.addLayer(updated.instance);
    else if (!updated.visible && updated.instance)  this.mapInstance.removeLayer(updated.instance);
    this.capas.update(cs => cs.map(c => c.key === capa.key ? updated : c));
  }

  protected toggleTodas(estado: boolean): void {
    for (const capa of this.capas()) {
      if (capa.count > 0 && capa.visible !== estado) this.toggleCapa(capa);
    }
  }

  // ── Computed ─────────────────────────────────────────────────────

  protected readonly totalCount = computed(() =>
    this.capas().reduce((sum, c) => sum + c.count, 0)
  );

  protected readonly activeCapas = computed(() =>
    [...this.capas()].filter(c => c.count > 0).sort((a, b) => b.count - a.count)
  );

  protected readonly barrasAvance = computed(() => {
    const inf = this.info();
    if (!inf) return [];
    return [
      { label: 'Avance Físico',      planeado: inf.avance_fisico_planeado,     ejecutado: inf.avance_fisico_ejecutado },
      { label: 'Avance Financiero',  planeado: inf.avance_financiero_planeado, ejecutado: inf.avance_financiero_ejecutado },
    ];
  });

  protected readonly barChartOptions = computed<EChartsOption>(() => {
    const active = this.activeCapas();
    if (active.length === 0) return { ...echartsBase() };
    return {
      ...echartsBase(),
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter: (params: any) => {
          const p = Array.isArray(params) ? params[0] : params;
          const c = active.find(a => a.label === (p.name as string));
          const dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${c?.color ?? '#888'};margin-right:6px"></span>`;
          return `${dot}<strong>${p.name as string}</strong><br/>${new Intl.NumberFormat('es-CO').format(p.value as number)} registros`;
        },
        ...tooltipBase,
      },
      grid: { left: 8, right: 80, top: 8, bottom: 8, containLabel: true },
      xAxis: {
        type: 'value',
        axisLabel: {
          color: '#4e6073', fontFamily: 'Inter, sans-serif', fontSize: 10,
          formatter: (v: number) => new Intl.NumberFormat('es-CO', { notation: 'compact' }).format(v),
        },
        splitLine: { lineStyle: { color: 'rgba(31,27,22,0.05)' } },
        axisLine: { show: false }, axisTick: { show: false },
      },
      yAxis: {
        type: 'category',
        data: active.map(e => e.label),
        axisLabel: { color: '#1f1b16', fontFamily: 'Inter, sans-serif', fontSize: 11 },
        axisLine: { show: false }, axisTick: { show: false },
      },
      series: [{
        type: 'bar',
        barMaxWidth: 22,
        data: active.map(e => ({
          value: e.count,
          itemStyle: { color: e.color, borderRadius: [0, 4, 4, 0] },
        })),
        emphasis: { itemStyle: { opacity: 0.75 } },
        label: {
          show: true, position: 'right' as const,
          color: '#4e6073', fontFamily: 'Inter, sans-serif', fontSize: 10,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter: (p: any) => new Intl.NumberFormat('es-CO').format(p.value as number),
        },
      }],
    };
  });

  // ── Helpers de formato ───────────────────────────────────────────

  protected pct(v: number): string  { return `${(v * 100).toFixed(1)}%`; }
  protected num(v: number): string  { return new Intl.NumberFormat('es-CO').format(v); }
  protected fmtDate(isoStr: string): string {
    if (!isoStr) return '—';
    try { return new Date(isoStr).toLocaleDateString('es-CO', { year:'numeric', month:'short', day:'numeric' }); }
    catch { return isoStr; }
  }
}
