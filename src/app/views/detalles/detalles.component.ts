import { Component, computed, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';

import { InventarioService } from '../../core/services/inventario.service';
import { ELEMENTOS_VIALES, NombreElemento, Proyecto } from '../../core/models/inventario.model';
import { echartsBase, tooltipBase } from '../../shared/echart-defaults';

// ── Configuración de columnas ───────────────────────────────────────────────

const ANCHO_COL_PROYECTO    = 220; // px — sticky left: 0
const ANCHO_COL_RESPONSABLE = 150; // px — sticky left: 220px

const CHIP_LABEL: Record<string, string> = {
  'Entregado':             'Entregado',
  'Parcialmente Entregado':'Parcial',
  'Pendiente':             'Pendiente',
  'No Aplica':             'N/A',
};

// Semáforo estándar: verde · amarillo · rojo · gris
const COLOR_ESTADO: Record<string, string> = {
  'Entregado':             '#16a34a',
  'Parcialmente Entregado':'#d97706',
  'Pendiente':             '#dc2626',
  'No Aplica':             '#9ca3af',
};

@Component({
  selector: 'app-detalles',
  standalone: true,
  imports: [NgxEchartsDirective],
  template: `
    <!-- ── ENCABEZADO ─────────────────────────────────────────── -->
    <section class="bg-[var(--color-surface)] pt-20 pb-10 px-6 lg:px-10">
      <div class="max-w-full mx-auto">

        <p class="text-[var(--color-primary)] font-inter text-sm font-medium tracking-widest uppercase mb-3">
          Inventario completo
        </p>
        <h1
          class="mb-8"
          style="font-family: 'Public Sans', sans-serif; font-size: clamp(2rem, 4vw, 3rem); font-weight: 700; color: var(--color-on-surface); letter-spacing: -0.02em; line-height: 1.15"
        >
          Detalles de Activos Viales
        </h1>

        <!-- ── Controles: búsqueda + sort + contador ── -->
        <div class="flex flex-wrap items-center gap-4">

          <!-- Barra de búsqueda -->
          <div class="relative flex-1 min-w-[240px] max-w-md">
            <svg
              class="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              width="16" height="16" viewBox="0 0 16 16" fill="none"
            >
              <circle cx="7" cy="7" r="5" stroke="var(--color-secondary)" stroke-width="1.5"/>
              <path d="M11 11l3 3" stroke="var(--color-secondary)" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <input
              type="search"
              placeholder="Buscar proyecto o responsable…"
              class="input-minimal"
              style="padding-left: 2.75rem; padding-right: 1rem"
              [value]="searchQuery()"
              (input)="onSearch($event)"
              aria-label="Buscar por proyecto o responsable"
            />
          </div>

          <!-- Indicador de orden activo -->
          <span
            class="px-3 py-1.5 rounded-full text-xs font-medium"
            style="background: var(--color-surface-low); color: var(--color-secondary); font-family: 'Inter', sans-serif"
          >
            Ordenado por <strong style="color: var(--color-on-surface)">{{ sortColumn() === 'nombre' ? 'Proyecto' : 'Responsable' }}</strong>
            {{ sortAsc() ? '↑' : '↓' }}
          </span>

          <!-- Contador de resultados -->
          <span
            class="text-sm ml-auto"
            style="color: var(--color-secondary); font-family: 'Inter', sans-serif"
          >
            @if (cargando()) {
              Cargando…
            } @else {
              {{ filteredProyectos().length }} de {{ proyectos()?.length ?? 0 }} proyectos
            }
          </span>

        </div>
      </div>
    </section>

    <!-- ── TABLA ───────────────────────────────────────────────── -->
    <section class="bg-[var(--color-surface-low)] pb-8">

      @if (cargando()) {
        <div class="px-6 lg:px-10 py-8 space-y-3">
          @for (_ of [1,2,3,4,5,6,7]; track $index) {
            <div
              class="h-10 rounded-xl animate-pulse"
              style="background: var(--color-surface-container)"
            ></div>
          }
        </div>
      } @else {

        <!-- Padding lateral: la tabla vive dentro de un contenedor con margen -->
        <div class="px-6 lg:px-10 pt-2">

          <!-- ── Scrollbar espejo SUPERIOR ── -->
          <div
            #topBar
            class="overflow-x-auto rounded-t-xl"
            style="overflow-y:hidden; height:14px; box-shadow:0 -2px 8px rgba(31,27,22,0.04)"
            (scroll)="syncScroll(topBar, tableWrap)"
          >
            <div [style.min-width.px]="tableMinWidth" style="height:1px"></div>
          </div>

          <!-- ── Contenedor de scroll principal (tabla) ── -->
          <div
            #tableWrap
            class="overflow-x-auto rounded-b-2xl"
            style="box-shadow: 0 4px 24px rgba(31,27,22,0.06)"
            (scroll)="syncScroll(tableWrap, topBar)"
          >
          <table
            class="w-full border-collapse"
            [style.min-width.px]="tableMinWidth"
            role="grid"
            aria-label="Tabla de activos viales por proyecto"
          >

            <!-- ── THEAD ── -->
            <thead>
              <tr style="background: var(--color-surface-container)">

                <!-- Proyecto (sticky + sortable) -->
                <th
                  class="text-left px-5 py-3 z-20 cursor-pointer select-none group"
                  [style]="thStickyStyle(0)"
                  scope="col"
                  (click)="sortBy('nombre')"
                  [attr.aria-sort]="sortColumn()==='nombre' ? (sortAsc() ? 'ascending' : 'descending') : 'none'"
                >
                  <span class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style="font-family: 'Inter', sans-serif"
                    [style.color]="sortColumn()==='nombre' ? 'var(--color-primary)' : 'var(--color-secondary)'">
                    Proyecto
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
                      [class]="sortColumn()==='nombre' ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'"
                      class="transition-opacity">
                      @if (sortAsc()) {
                        <path d="M5 2v6M2 5l3-3 3 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                      } @else {
                        <path d="M5 8V2M2 5l3 3 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                      }
                    </svg>
                  </span>
                </th>

                <!-- Responsable ANI (sticky + sortable) -->
                <th
                  class="text-left px-4 py-3 z-20 cursor-pointer select-none group"
                  [style]="thStickyStyle(1)"
                  scope="col"
                  (click)="sortBy('responsable')"
                  [attr.aria-sort]="sortColumn()==='responsable' ? (sortAsc() ? 'ascending' : 'descending') : 'none'"
                >
                  <span class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style="font-family: 'Inter', sans-serif"
                    [style.color]="sortColumn()==='responsable' ? 'var(--color-primary)' : 'var(--color-secondary)'">
                    Responsable
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
                      [class]="sortColumn()==='responsable' ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'"
                      class="transition-opacity">
                      @if (sortAsc()) {
                        <path d="M5 2v6M2 5l3-3 3 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                      } @else {
                        <path d="M5 8V2M2 5l3 3 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                      }
                    </svg>
                  </span>
                </th>

                <!-- Columnas de elementos — nombres completos, scroll horizontal -->
                @for (el of elementos; track el) {
                  <th
                    class="px-4 py-3 text-left"
                    scope="col"
                    style="min-width: 140px; white-space: nowrap"
                  >
                    <span
                      class="text-xs font-semibold"
                      style="color: var(--color-secondary); font-family: 'Inter', sans-serif; letter-spacing: 0.03em; text-transform: uppercase"
                    >{{ el }}</span>
                  </th>
                }

              </tr>
            </thead>

            <!-- ── TBODY ── -->
            <tbody>
              @for (p of filteredProyectos(); track p.id; let even = $even) {
                <tr
                  class="cursor-pointer transition-colors duration-150 group"
                  [style.background]="even ? 'var(--color-surface)' : 'var(--color-surface-low)'"
                  (click)="navigate(p.id)"
                  (keydown.enter)="navigate(p.id)"
                  tabindex="0"
                  role="row"
                  [attr.aria-label]="'Ver detalles de ' + p.nombre"
                >

                  <!-- Proyecto (sticky) -->
                  <td
                    class="px-5 py-3 z-10 group-hover:bg-[rgba(160,65,0,0.04)]"
                    [style]="tdStickyStyle(0, even)"
                  >
                    <span
                      class="text-sm font-medium leading-snug"
                      style="font-family: 'Public Sans', sans-serif; color: var(--color-on-surface)"
                    >{{ p.nombre }}</span>
                  </td>

                  <!-- Responsable (sticky) -->
                  <td
                    class="px-4 py-3 z-10 group-hover:bg-[rgba(160,65,0,0.04)]"
                    [style]="tdStickyStyle(1, even)"
                  >
                    <span
                      class="text-xs"
                      style="color: var(--color-secondary); font-family: 'Inter', sans-serif"
                    >{{ p.responsable }}</span>
                  </td>

                  <!-- Elemento por columna — chip con estado completo -->
                  @for (el of elementos; track el) {
                    <td class="px-4 py-2.5" [title]="estadoLabel(p, el)" style="min-width: 140px">
                      @if (getEstado(p, el); as estado) {
                        <span [style]="chipStyle(estado)">{{ chipLabel(estado) }}</span>
                      } @else {
                        <span class="text-xs" style="color: rgba(31,27,22,0.25)">—</span>
                      }
                    </td>
                  }

                </tr>
              }

              <!-- Sin resultados -->
              @if (filteredProyectos().length === 0) {
                <tr>
                  <td
                    [attr.colspan]="2 + elementos.length"
                    class="text-center py-16"
                    style="color: var(--color-secondary); font-family: 'Inter', sans-serif; font-size: 0.875rem"
                  >
                    No se encontraron proyectos con "{{ searchQuery() }}"
                  </td>
                </tr>
              }

            </tbody>
          </table>
          </div><!-- /overflow-x-auto -->
        </div><!-- /px-6 lg:px-10 -->

      }
    </section>

    <!-- ── RESUMEN INFERIOR ────────────────────────────────────── -->
    <section class="bg-[var(--color-surface)] px-6 lg:px-10 py-12">
      <div class="max-w-7xl mx-auto">

        <h2
          class="mb-6"
          style="font-family: 'Public Sans', sans-serif; font-size: 1.125rem; font-weight: 700; color: var(--color-on-surface); letter-spacing: -0.01em"
        >Resumen global de activos</h2>

        <!-- Leyenda de estados (solo estados activos, sin "No Aplica") -->
        <div class="flex flex-wrap gap-6 mb-6">
          @for (item of chartLeyenda; track item.label) {
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full shrink-0" [style.background]="item.color"></span>
              <span class="text-sm" style="color: var(--color-on-surface); font-family: 'Inter', sans-serif">
                {{ item.label }}
                @if (!cargando()) {
                  <strong class="ml-1" [style.color]="item.color">{{ resumenGlobal()[item.key] }}</strong>
                }
              </span>
            </div>
          }
        </div>

        <!-- Mini-gráfica de progreso (barra apilada) -->
        @if (cargando()) {
          <div class="h-16 rounded-xl animate-pulse" style="background: var(--color-surface-low)"></div>
        } @else if (isBrowser) {
          <div
            echarts
            [options]="barOptions()"
            class="w-full rounded-xl"
            style="height: 72px; background: transparent"
          ></div>
        }

      </div>
    </section>

    <!-- Leyenda de colores flotante (referencia rápida) -->
    <div
      class="fixed bottom-6 right-6 z-30 rounded-xl px-4 py-3 flex flex-col gap-1.5 shadow-ambient"
      style="background: white; font-family: 'Inter', sans-serif"
    >
      @for (item of leyenda; track item.label) {
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full shrink-0" [style.background]="item.color"></span>
          <span class="text-xs" style="color: var(--color-secondary)">{{ item.label }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }

    /* Hover en fila */
    tr:hover td { background-color: rgba(160, 65, 0, 0.04) !important; }

    /* Borde fantasma en focus de fila */
    tr:focus-visible { outline: 1px solid rgba(31,27,22,0.15); outline-offset: -1px; }
  `],
})
export class DetallesComponent {
  private readonly svc    = inject(InventarioService);
  private readonly router = inject(Router);
  protected readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly proyectos = toSignal(this.svc.getInventario());
  protected readonly cargando  = computed(() => !this.proyectos());

  // ── Controles ──────────────────────────────────────────────────
  protected readonly searchQuery  = signal('');
  protected readonly sortAsc      = signal(true);
  protected readonly sortColumn   = signal<'nombre' | 'responsable'>('nombre');

  protected onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  /** Alterna asc/desc si la columna ya está activa; si es otra, la activa asc. */
  protected sortBy(col: 'nombre' | 'responsable'): void {
    if (this.sortColumn() === col) {
      this.sortAsc.update((v) => !v);
    } else {
      this.sortColumn.set(col);
      this.sortAsc.set(true);
    }
  }

  // ── Datos filtrados y ordenados ─────────────────────────────────
  protected readonly filteredProyectos = computed<Proyecto[]>(() => {
    const q   = this.searchQuery().toLowerCase().trim();
    const col = this.sortColumn();
    const list = this.proyectos() ?? [];

    const filtered = q
      ? list.filter((p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.responsable.toLowerCase().includes(q),
        )
      : list;

    return [...filtered].sort((a, b) => {
      const valA = col === 'nombre' ? a.nombre : a.responsable;
      const valB = col === 'nombre' ? b.nombre : b.responsable;
      const cmp  = valA.localeCompare(valB, 'es');
      return this.sortAsc() ? cmp : -cmp;
    });
  });

  // ── Resumen global ──────────────────────────────────────────────
  protected readonly resumenGlobal = computed(() =>
    this.svc.calcularResumen(this.filteredProyectos()),
  );

  // ── Helpers de tabla ────────────────────────────────────────────
  protected readonly elementos = ELEMENTOS_VIALES;

  protected getEstado(p: Proyecto, el: NombreElemento): string | null {
    return p.elementos.find((e) => e.nombre === el)?.estado ?? null;
  }

  protected estadoLabel(p: Proyecto, el: NombreElemento): string {
    return `${el}: ${this.getEstado(p, el) ?? 'Sin dato'}`;
  }

  protected chipLabel(estado: string): string {
    return CHIP_LABEL[estado] ?? estado;
  }

  protected chipStyle(estado: string): string {
    const color = COLOR_ESTADO[estado] ?? '#9ca3af';
    return `background:${color}18; color:${color}; font-family:'Inter',sans-serif; white-space:nowrap; border-radius:0.375rem; padding:2px 8px; font-size:0.7rem; font-weight:600; letter-spacing:0.02em`;
  }

  // Ancho total mínimo de la tabla (usado por la barra espejo superior)
  protected readonly ANCHO_COL_PROYECTO    = ANCHO_COL_PROYECTO;
  protected readonly ANCHO_COL_RESPONSABLE = ANCHO_COL_RESPONSABLE;
  protected readonly tableMinWidth =
    ANCHO_COL_PROYECTO + ANCHO_COL_RESPONSABLE + ELEMENTOS_VIALES.length * 140;

  /** Sincroniza el scrollLeft entre el espejo superior y el contenedor de la tabla */
  protected syncScroll(from: HTMLElement, to: HTMLElement): void {
    if (to.scrollLeft !== from.scrollLeft) {
      to.scrollLeft = from.scrollLeft;
    }
  }

  // Estilos sticky dinámicos (header)
  protected thStickyStyle(col: 0 | 1): string {
    const bg     = 'var(--color-surface-container)';
    const left   = col === 0 ? 0 : ANCHO_COL_PROYECTO;
    const minW   = col === 0 ? ANCHO_COL_PROYECTO : ANCHO_COL_RESPONSABLE;
    // Sombra sutil en la segunda columna sticky para marcar el límite de scroll
    const shadow = col === 1
      ? 'box-shadow: 4px 0 12px rgba(31,27,22,0.06);'
      : '';
    return `position: sticky; left: ${left}px; min-width: ${minW}px; background: ${bg}; z-index: 20; ${shadow}`;
  }

  // Estilos sticky dinámicos (celdas de fila)
  protected tdStickyStyle(col: 0 | 1, even: boolean): string {
    const bg     = even ? 'var(--color-surface)' : 'var(--color-surface-low)';
    const left   = col === 0 ? 0 : ANCHO_COL_PROYECTO;
    const minW   = col === 0 ? ANCHO_COL_PROYECTO : ANCHO_COL_RESPONSABLE;
    const shadow = col === 1
      ? 'box-shadow: 4px 0 12px rgba(31,27,22,0.05);'
      : '';
    return `position: sticky; left: ${left}px; min-width: ${minW}px; background: ${bg}; z-index: 10; ${shadow}`;
  }

  // Navegación al detalle
  protected navigate(id: string): void {
    this.router.navigate(['/detalles', id]);
  }

  // ── Leyenda para gráficas (excluye "No Aplica") ─────────────────
  protected readonly chartLeyenda = [
    { label: 'Entregado',       key: 'entregado'             as const, color: '#16a34a' },
    { label: 'Parc. Entregado', key: 'parcialmenteEntregado' as const, color: '#d97706' },
    { label: 'Pendiente',       key: 'pendiente'             as const, color: '#dc2626' },
  ];

  // ── Leyenda flotante para la tabla (incluye "No Aplica") ─────────
  protected readonly leyenda = [
    { label: 'Entregado',       color: '#16a34a' },
    { label: 'Parc. Entregado', color: '#d97706' },
    { label: 'Pendiente',       color: '#dc2626' },
    { label: 'No Aplica',       color: '#9ca3af' },
  ];

  // ── Opciones ECharts barra apilada ─────────────────────────────
  protected readonly barOptions = computed<EChartsOption>(() => {
    const r = this.resumenGlobal();
    const total = r.total || 1;

    const mkSerie = (
      name: string,
      value: number,
      color: string,
    ) => ({
      name,
      type: 'bar' as const,
      stack: 'total',
      data: [value],
      itemStyle: { color, borderWidth: 0, borderRadius: 0 },
      label: {
        show: value > 0 && (value / total) > 0.05,
        position: 'inside' as const,
        formatter: `${Math.round((value / total) * 100)}%`,
        fontFamily: 'Inter, sans-serif',
        fontSize: 11,
        color: '#fff8f4',
        fontWeight: 'bold' as const,
      },
    });

    return {
      ...echartsBase(),
      grid: { top: 0, bottom: 0, left: 0, right: 0, containLabel: false },
      xAxis: { type: 'value', show: false, max: total },
      yAxis: { type: 'category', show: false, data: [''] },
      tooltip: { trigger: 'item', formatter: '{a}: {c} ({b})', ...tooltipBase },
      series: [
        mkSerie('Entregado',       r.entregado,             '#16a34a'),
        mkSerie('Parc. Entregado', r.parcialmenteEntregado, '#d97706'),
        mkSerie('Pendiente',       r.pendiente,             '#dc2626'),
      ],
    };
  });
}
