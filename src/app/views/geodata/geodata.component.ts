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
  untracked,
  ViewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Title } from '@angular/platform-browser';
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

interface CapaState {
  key: string;
  label: string;
  color: string;
  count: number;
  visible: boolean;
  fileName?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  instance: any;
}

@Component({
  selector: 'app-geodata',
  standalone: true,
  imports: [RouterLink, NgxEchartsDirective],
  template: `
    <div class="flex flex-col overflow-hidden" style="height: calc(100vh - 64px)">

      <!-- ── BREADCRUMB ────────────────────────────────────────────── -->
      <nav class="bg-[var(--color-surface)] pt-6 pb-2 px-6 lg:px-10 shrink-0">
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
      <div class="relative flex-1 flex flex-col min-h-0">

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
        <div class="flex-1 flex flex-col lg:flex-row min-h-0">

          <!-- ════ PANEL IZQUIERDO: Info proyecto ════ -->
          <aside
            class="lg:w-72 shrink-0 flex flex-col gap-4 p-6 lg:py-6 lg:px-7 border-b lg:border-b-0 lg:border-r overflow-y-auto"
            style="background: var(--color-surface-container); border-color: rgba(31,27,22,0.06)"
          >
            @if (!info() && !errMsg()) {
              <!-- Skeleton -->
              <div class="flex flex-col gap-3">
                @for (w of ['75%','50%','100%','90%','80%']; track $index) {
                  <div class="h-5 rounded-lg animate-pulse" [style.width]="w"
                       style="background: var(--color-surface-container-highest)"></div>
                }
              </div>

            } @else if (info()) {

              <!-- Nombre + etapa -->
              <div>
                <p class="font-inter text-[10px] font-medium tracking-widest uppercase mb-1"
                   style="color: var(--color-primary)">Inventario Geoespacial</p>
                <h1
                  style="font-family:'Public Sans',sans-serif; font-size:1.0625rem; font-weight:700; color:var(--color-on-surface); line-height:1.2; letter-spacing:-0.02em"
                >{{ info()!.nombre }}</h1>
                <span
                  class="mt-2 inline-block px-2 py-0.5 rounded-full font-inter text-[10px] font-medium"
                  style="background: rgba(160,65,0,0.10); color: var(--color-primary)"
                >{{ info()!.etapa }}</span>
              </div>

              <!-- Stats: longitud · empleos · habitantes -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <p class="font-inter text-[9px] uppercase tracking-widest font-semibold mb-0.5" style="color:var(--color-secondary)">Longitud</p>
                  <p style="font-family:'Public Sans',sans-serif; font-size:1.25rem; font-weight:700; color:var(--color-on-surface); line-height:1; letter-spacing:-0.03em">
                    {{ info()!.longitud }}<span class="text-[10px] font-normal ml-0.5" style="color:var(--color-secondary)">km</span>
                  </p>
                </div>
                <div>
                  <p class="font-inter text-[9px] uppercase tracking-widest font-semibold mb-0.5" style="color:var(--color-secondary)">Empleos</p>
                  <p style="font-family:'Public Sans',sans-serif; font-size:1.25rem; font-weight:700; color:var(--color-on-surface); line-height:1; letter-spacing:-0.03em">
                    {{ num(info()!.empleos_generados) }}
                  </p>
                </div>
                <div class="col-span-2">
                  <p class="font-inter text-[9px] uppercase tracking-widest font-semibold mb-0.5" style="color:var(--color-secondary)">Habitantes beneficiados</p>
                  <p style="font-family:'Public Sans',sans-serif; font-size:1.25rem; font-weight:700; color:var(--color-on-surface); line-height:1; letter-spacing:-0.03em">
                    {{ num(info()!.habitantes_beneficiados) }}
                  </p>
                </div>
              </div>

              <!-- Barras de avance -->
              <div class="flex flex-col gap-3">
                @for (barra of barrasAvance(); track barra.label) {
                  <div>
                    <p class="font-inter text-[9px] uppercase tracking-widest font-semibold mb-1"
                       style="color: var(--color-secondary)">{{ barra.label }}</p>
                    <div class="relative h-1 rounded-full overflow-hidden"
                         style="background: var(--color-surface-container-highest)">
                      <div class="absolute inset-y-0 left-0 rounded-full"
                           [style.width]="pct(barra.planeado)"
                           style="background: rgba(160,65,0,0.20)"></div>
                      <div class="absolute inset-y-0 left-0 rounded-full"
                           [style.width]="pct(barra.ejecutado)"
                           style="background: #a04100"></div>
                    </div>
                    <div class="flex justify-between mt-0.5">
                      <span class="font-inter text-[10px] font-semibold" style="color:#a04100">Ejec. {{ pct(barra.ejecutado) }}</span>
                      <span class="font-inter text-[10px]" style="color:var(--color-secondary)">Plan. {{ pct(barra.planeado) }}</span>
                    </div>
                  </div>
                }
              </div>

              <!-- Fecha + volver -->
              <div class="mt-auto pt-3 flex flex-col gap-2 border-t" style="border-color:rgba(31,27,22,0.08)">
                <p class="font-inter text-[10px]" style="color:var(--color-secondary)">
                  Corte: <strong style="color:var(--color-on-surface)">{{ fmtDate(info()!.fecha_avance) }}</strong>
                </p>
                <a [routerLink]="['/detalles', id()]"
                   class="flex items-center gap-1.5 font-inter text-xs font-medium"
                   style="color:var(--color-secondary)">
                  <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
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
          <main class="flex-1 relative">
            <div #mapEl class="absolute inset-0" style="z-index:0"></div>
          </main>

          <!-- ════ PANEL DERECHO: Controles + capas ════ -->
          <aside
            class="lg:w-60 shrink-0 flex flex-col border-t lg:border-t-0 lg:border-l overflow-hidden"
            style="background: var(--color-surface); border-color: rgba(31,27,22,0.06)"
          >

            <!-- Recentrar -->
            <div class="p-3 border-b" style="border-color:rgba(31,27,22,0.06)">
              <button type="button" (click)="resetZoom()"
                class="w-full py-1.5 rounded-lg font-inter text-[10px] font-semibold uppercase tracking-widest cursor-pointer transition-opacity hover:opacity-90 active:scale-95"
                style="background: var(--color-primary); color: white; border: none">
                ⊕ Recentrar mapa
              </button>
            </div>

            <!-- Mapa base -->
            <div class="p-3 border-b" style="border-color:rgba(31,27,22,0.06)">
              <p class="font-inter text-[9px] uppercase tracking-widest font-semibold mb-2" style="color:var(--color-secondary)">Mapa base</p>
              <div class="flex gap-1">
                @for (base of baseMaps; track base) {
                  <button type="button" (click)="cambiarBase(base)"
                    class="flex-1 py-1 rounded font-inter text-[8px] font-bold uppercase transition-colors cursor-pointer"
                    [style.background]="mapaBaseActual() === base ? 'var(--color-primary)' : 'var(--color-surface-container)'"
                    [style.color]="mapaBaseActual() === base ? 'white' : 'var(--color-secondary)'"
                    style="border:none">{{ base }}</button>
                }
              </div>
            </div>

            <!-- Header capas -->
            <div class="px-3 py-2 border-b flex justify-between items-center" style="border-color:rgba(31,27,22,0.06)">
              <span class="font-inter text-[9px] uppercase tracking-widest font-semibold" style="color:var(--color-secondary)">
                GIS ({{ num(totalCount()) }})
              </span>
              <div class="flex gap-1">
                <button type="button" (click)="toggleTodas(true)"
                  class="px-1.5 py-0.5 rounded font-inter text-[7px] font-bold uppercase cursor-pointer"
                  style="background:var(--color-surface-container); color:var(--color-secondary); border:none">Todo</button>
                <button type="button" (click)="toggleTodas(false)"
                  class="px-1.5 py-0.5 rounded font-inter text-[7px] font-bold uppercase cursor-pointer"
                  style="background:var(--color-surface-container); color:var(--color-secondary); border:none">Nada</button>
              </div>
            </div>

            <!-- Lista de capas con checkboxes -->
            <div class="flex-1 p-1 overflow-y-auto" style="scrollbar-width:thin">
              @for (capa of capas(); track capa.key) {
                <label
                  class="flex items-center justify-between group cursor-pointer p-1.5 rounded-lg transition-colors"
                  [class.opacity-35]="capa.count === 0"
                  [style.pointer-events]="capa.count === 0 ? 'none' : 'auto'"
                >
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-black/10"
                          [style.background]="capa.color"
                          [style.box-shadow]="'0 0 4px ' + capa.color + 'AA'"></span>
                    <div class="flex flex-col">
                      <span class="font-inter text-[11px] font-semibold leading-none" style="color:var(--color-on-surface)">{{ capa.label }}</span>
                      <span class="font-inter text-[9px] mt-0.5 font-mono" style="color:var(--color-secondary)">
                        {{ capa.count > 0 ? num(capa.count) : '—' }}
                      </span>
                    </div>
                  </div>
                  <input type="checkbox" [checked]="capa.visible" [disabled]="capa.count === 0"
                    (change)="toggleCapa(capa)" class="w-3 h-3 cursor-pointer"
                    style="accent-color: var(--color-primary)">
                </label>
              }
            </div>

            <!-- Total -->
            <div class="px-3 py-2 border-t" style="border-color:rgba(31,27,22,0.12)">
              <div class="flex justify-between items-baseline">
                <span class="font-inter text-[10px] font-semibold uppercase tracking-widest"
                      style="color:var(--color-secondary)">Total</span>
                <span style="font-family:'Public Sans',sans-serif; font-size:1rem; font-weight:700; color:var(--color-primary); letter-spacing:-0.02em">
                  {{ num(totalCount()) }}
                </span>
              </div>
            </div>

          </aside>
        </div>

        <!-- ════ PANEL INFERIOR: Gráfica de barras ════ -->
        @if (activeCapas().length > 0) {
          <section
            class="shrink-0 flex flex-col border-t overflow-hidden transition-all duration-300"
            [style.height]="chartExpandido() ? '50%' : '180px'"
            style="background:var(--color-surface); border-color:rgba(31,27,22,0.06)"
          >
            <!-- Cabecera del panel -->
            <div class="flex items-center justify-between px-6 py-2 border-b shrink-0"
                 style="border-color:rgba(31,27,22,0.06)">
              <div>
                <p class="font-inter text-[10px] font-medium tracking-widest uppercase" style="color:var(--color-primary)">
                  Distribución de activos
                </p>
                <p class="font-inter text-[9px]" style="color:var(--color-secondary)">
                  {{ num(totalCount()) }} registros · {{ activeCapas().length }} tipos de elemento
                </p>
              </div>
              <button type="button" (click)="chartExpandido.set(!chartExpandido())"
                class="px-2 py-1 rounded-lg font-inter text-[10px] font-semibold cursor-pointer transition-colors"
                style="background:var(--color-surface-container); color:var(--color-secondary); border:none">
                {{ chartExpandido() ? '↙ Reducir' : '↗ Expandir' }}
              </button>
            </div>

            <!-- ECharts bar chart -->
            @if (isBrowser) {
              <div echarts [options]="barChartOptions()" [autoResize]="true" [id]="'chart-' + id()" class="flex-1 min-h-0 w-full px-2"></div>
            }
          </section>
        }

      </div>
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
  private readonly titleSvc   = inject(Title);
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
  protected readonly capas          = signal<CapaState[]>([]);
  protected readonly errMsg         = signal<string | null>(null);
  protected readonly mapaBaseActual = signal<string>('Calles');
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
  private loadId = 0;

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
        untracked(() => {
          this.errMsg.set('Proyecto no encontrado.');
          this.cargando.set(false);
        });
        return;
      }
      untracked(() => void this.loadProjectData(nombre));
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
    this.tileLayers['Calles'].addTo(this.mapInstance);

    this.mapReady.set(true);
  }

  // ── Carga de datos y capas ───────────────────────────────────────

  private getLayerInfo(fileName: string): { key: string, label: string, color: string } {
    const key = fileName.split('.')[0].toLowerCase();
    const found = ELEMENTOS_GEODATA.find(el => el.key === key);
    if (found) return { ...found };
    
    // Generar un color pseudo-aleatorio basado en el nombre si no existe
    const hash = key.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
    const hue = Math.abs(hash % 360);
    return {
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
      color: `hsl(${hue}, 70%, 50%)`
    };
  }

  private async loadProjectData(projectName: string): Promise<void> {
    const currentLoadId = ++this.loadId;
    this.cargando.set(true);
    this.errMsg.set(null);

    // Limpiar capas previas del mapa
    for (const capa of this.capas()) {
      if (capa.instance) this.mapInstance?.removeLayer(capa.instance);
    }
    
    // Info del proyecto (no bloquea el render del mapa)
    firstValueFrom(this.geodataSvc.getInfoProyecto(projectName))
      .then(info => {
        if (currentLoadId === this.loadId) {
          this.info.set(info);
          this.titleSvc.setTitle(`GIS — ${info.nombre}`);
        }
      })
      .catch(() => {});

    // Descubrir capas disponibles en el proyecto (FGB o FDB)
    let archivos = await firstValueFrom(this.geodataSvc.getCapasDisponibles(projectName));
    
    if (currentLoadId !== this.loadId) return;

    // FALLBACK: Si el API de GitHub falló (rate limit), probamos con las capas estándar
    // El servicio devolverá [] en caso de error, así que intentamos cargar las conocidas.
    if (archivos.length === 0) {
      archivos = ELEMENTOS_GEODATA.map(el => `${el.key}.fgb`);
    }

    // Inicializar el estado de las capas descubiertas
    const nuevasCapas = archivos.map(file => ({
      ...this.getLayerInfo(file),
      fileName: file,
      count: 0,
      visible: true,
      instance: null
    }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.capas.set(nuevasCapas as any);

    // Cargar archivos en paralelo
    const L = this.L;
    const bbox = L.latLngBounds([]);

    await Promise.all(
      nuevasCapas.map(async (capaInfo) => {
        try {
          const features = await this.geodataSvc.getGeometriasPorArchivo(projectName, capaInfo.fileName);
          
          if (currentLoadId !== this.loadId) return;
          if (!features || features.length === 0) return;

          const layer = L.geoJSON(features, {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            style: () => ({ color: capaInfo.color, weight: 2.5, opacity: 0.95, fillColor: capaInfo.color, fillOpacity: 0.5 }),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pointToLayer: (_feature: any, latlng: any) =>
              L.circleMarker(latlng, { radius: 5, color: capaInfo.color, fillColor: capaInfo.color, fillOpacity: 0.9, weight: 1.5 }),
          });

          // Actualizar conteo y guardar instancia
          this.capas.update(cs =>
            cs.map(c => c.key === capaInfo.key ? { ...c, count: features.length, instance: layer } : c)
          );

          layer.addTo(this.mapInstance);

          try {
            const bounds = layer.getBounds();
            if (bounds.isValid()) bbox.extend(bounds);
          } catch { /* sin features válidos */ }

        } catch (error) {
          console.error(`Error procesando capa ${capaInfo.key}:`, error);
        }
      })
    );

    if (currentLoadId === this.loadId && bbox.isValid()) {
      this.initialBounds = bbox;
      this.mapInstance.fitBounds(this.initialBounds, { padding: [50, 50] });
    }

    if (currentLoadId === this.loadId) {
      this.cargando.set(false);
    }
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
        type: 'category',
        data: active.map(e => e.label),
        axisLabel: {
          color: '#1f1b16',
          fontFamily: 'Inter, sans-serif',
          fontSize: 10,
          interval: 0,
          rotate: active.length > 5 ? 35 : 0 // Rotar si hay muchas categorías
        },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: '#4e6073',
          fontFamily: 'Inter, sans-serif',
          fontSize: 10,
          formatter: (v: number) => new Intl.NumberFormat('es-CO', { notation: 'compact' }).format(v),
        },
        splitLine: { lineStyle: { color: 'rgba(31,27,22,0.05)' } },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [{
        type: 'bar',
        barMaxWidth: 32,
        data: active.map(e => ({
          value: e.count,
          itemStyle: { color: e.color, borderRadius: [4, 4, 0, 0] },
        })),
        emphasis: { itemStyle: { opacity: 0.75 } },
        label: {
          show: true,
          position: 'top',
          color: '#4e6073',
          fontFamily: 'Inter, sans-serif',
          fontSize: 10,
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
