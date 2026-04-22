import { Component, computed, inject, signal, PLATFORM_ID, effect, untracked } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';

import { InventarioService } from '../../core/services/inventario.service';
import { ElementoVial, EstadoElemento, Proyecto } from '../../core/models/inventario.model';
import { echartsBase, tooltipBase } from '../../shared/echart-defaults';

// ── Paleta semáforo estándar ─────────────────────────────────────────────────
const COLOR: Record<EstadoElemento, string> = {
  'Entregado':             '#16a34a',  // verde
  'Parcialmente Entregado':'#d97706',  // amarillo
  'Pendiente':             '#dc2626',  // rojo
  'No Aplica':             '#9ca3af',  // gris
};

const CHIP_BG: Record<EstadoElemento, string> = {
  'Entregado':             'rgba(22,163,74,0.10)',
  'Parcialmente Entregado':'rgba(217,119,6,0.10)',
  'Pendiente':             'rgba(220,38,38,0.10)',
  'No Aplica':             'rgba(156,163,175,0.12)',
};

@Component({
  selector: 'app-proyecto',
  standalone: true,
  imports: [RouterLink, NgxEchartsDirective],
  template: `
    <!-- ── BREADCRUMB ────────────────────────────────────────── -->
    <nav class="bg-[var(--color-surface)] pt-8 pb-0 px-6 lg:px-10">
      <div class="max-w-7xl mx-auto">
        <ol class="flex items-center gap-2 text-xs" style="color: var(--color-secondary); font-family: 'Inter', sans-serif">
          <li><a routerLink="/" class="hover:text-[var(--color-primary)] transition-colors">Inicio</a></li>
          <li aria-hidden="true">›</li>
          <li><a routerLink="/detalles" class="hover:text-[var(--color-primary)] transition-colors">Detalles de Activos</a></li>
          <li aria-hidden="true">›</li>
          <li style="color: var(--color-on-surface)" class="font-medium truncate max-w-[24ch]">
            {{ proyecto()?.nombre ?? '…' }}
          </li>
        </ol>
      </div>
    </nav>

    <!-- ── HERO DEL PROYECTO ──────────────────────────────────── -->
    <section class="bg-[var(--color-surface)] pt-6 pb-10 px-6 lg:px-10">
      <div class="max-w-7xl mx-auto">

        @if (cargando()) {
          <div class="space-y-3">
            <div class="h-8 w-64 rounded-lg animate-pulse" style="background: var(--color-surface-low)"></div>
            <div class="h-5 w-48 rounded-lg animate-pulse" style="background: var(--color-surface-low)"></div>
          </div>
        } @else if (proyecto()) {
          <p class="text-[var(--color-primary)] font-inter text-sm font-medium tracking-widest uppercase mb-2">
            Proyecto concesionado
          </p>
          <h1
            style="font-family: 'Public Sans', sans-serif; font-size: clamp(1.625rem, 3.5vw, 2.5rem); font-weight: 700; color: var(--color-on-surface); letter-spacing: -0.02em; line-height: 1.15; max-width: 28ch"
          >{{ proyecto()!.nombre }}</h1>
          <p class="mt-2 text-sm" style="color: var(--color-secondary); font-family: 'Inter', sans-serif">
            Responsable ANI: <strong style="color: var(--color-on-surface)">{{ proyecto()!.responsable }}</strong>
          </p>
        } @else {
          <p class="text-base" style="color: var(--color-secondary); font-family: 'Inter', sans-serif">
            Proyecto no encontrado.
            <a routerLink="/detalles" class="text-[var(--color-primary)] underline ml-1">Volver a la tabla</a>
          </p>
        }

      </div>
    </section>

    <!-- ── CUERPO PRINCIPAL: 60 / 40 ─────────────────────────── -->
    @if (proyecto(); as p) {
      <section class="bg-[var(--color-surface-low)] px-6 lg:px-10 py-12">
        <div class="max-w-7xl mx-auto grid lg:grid-cols-[60%_1fr] gap-10 lg:gap-16 items-start">

          <!-- ══ PANEL IZQUIERDO: lista de elementos ══ -->
          <div>
            <h2
              class="mb-6"
              style="font-family: 'Public Sans', sans-serif; font-size: 1.125rem; font-weight: 700; color: var(--color-on-surface); letter-spacing: -0.01em"
            >
              Elementos del activo
              <span
                class="ml-2 text-sm font-normal"
                style="color: var(--color-secondary); font-family: 'Inter', sans-serif"
              >({{ p.elementos.length }} tipos)</span>
            </h2>

            <!-- Grid 2 columnas -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0">
              @for (el of p.elementos; track el.nombre) {
                <div
                  class="flex items-center justify-between py-4"
                  style="border-bottom: 1px solid rgba(31,27,22,0.06)"
                >
                  <!-- Nombre del elemento -->
                  <span
                    class="text-sm leading-snug mr-4"
                    style="color: var(--color-on-surface); font-family: 'Inter', sans-serif"
                  >{{ el.nombre }}</span>

                  <!-- Chip de estado -->
                  @if (el.estado) {
                    <span
                      class="shrink-0 rounded-md px-2.5 py-1 text-xs font-semibold"
                      [style]="'background:' + chipBg(el.estado) + '; color:' + chipColor(el.estado)"
                    >{{ el.estado }}</span>
                  } @else {
                    <span
                      class="shrink-0 text-xs"
                      style="color: var(--color-surface-container)"
                    >Sin dato</span>
                  }
                </div>
              }
            </div>

            <!-- Observaciones -->
            @if (p.observaciones || p.puntosCriticos) {
              <div class="mt-10 space-y-5">
                @if (p.puntosCriticos) {
                  <div class="rounded-xl p-5" style="background: rgba(78,96,115,0.06)">
                    <p class="text-xs font-semibold uppercase tracking-widest mb-2" style="color: #4e6073">
                      ⚠ Puntos críticos
                    </p>
                    <p class="text-sm leading-relaxed" style="color: var(--color-on-surface); font-family: 'Inter', sans-serif">
                      {{ p.puntosCriticos }}
                    </p>
                  </div>
                }
                @if (p.observaciones) {
                  <div class="rounded-xl p-5" style="background: rgba(160,65,0,0.05)">
                    <p class="text-xs font-semibold uppercase tracking-widest mb-2" style="color: #a04100">
                      📋 Observaciones registradas
                    </p>
                    <p class="text-sm leading-relaxed" style="color: var(--color-on-surface); font-family: 'Inter', sans-serif; white-space: pre-line">
                      {{ p.observaciones }}
                    </p>
                  </div>
                }
              </div>
            }
          </div>

          <!-- ══ PANEL DERECHO: donut + observaciones ══ -->
          <div class="flex flex-col gap-8">

            <!-- Donut Chart -->
            <div
              class="rounded-2xl p-6"
              style="background: white; box-shadow: 0 32px 48px rgba(31,27,22,0.06)"
            >
              <h3
                class="mb-1"
                style="font-family: 'Public Sans', sans-serif; font-size: 1rem; font-weight: 700; color: var(--color-on-surface); letter-spacing: -0.01em"
              >Distribución de estados</h3>
              <p class="text-xs mb-4" style="color: var(--color-secondary); font-family: 'Inter', sans-serif">
                {{ resumenProyecto().total }} elementos con información
              </p>

              @if (isBrowser) {
                <div
                  echarts
                  [options]="donutOptions()"
                  class="w-full"
                  style="height: 260px"
                ></div>
              }

              <!-- Leyenda manual bajo el donut -->
              <div class="mt-4 grid grid-cols-2 gap-2">
                @for (item of leyendaDonut(); track item.label) {
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full shrink-0" [style.background]="item.color"></span>
                    <span class="text-xs leading-tight" style="color: var(--color-secondary); font-family: 'Inter', sans-serif">
                      {{ item.label }}<br/>
                      <strong [style.color]="item.color">{{ item.valor }}</strong>
                    </span>
                  </div>
                }
              </div>
            </div>

            <!-- Caja de Observaciones (editable) -->
            <div
              class="rounded-2xl overflow-hidden"
              style="background: white; box-shadow: 0 32px 48px rgba(31,27,22,0.06)"
            >
              <div class="px-5 pt-5 pb-2">
                <label
                  for="obs-textarea"
                  class="block text-xs font-semibold uppercase tracking-widest mb-3"
                  style="color: var(--color-primary); font-family: 'Inter', sans-serif"
                >Observaciones técnicas</label>
                <textarea
                  id="obs-textarea"
                  class="w-full resize-none text-sm leading-relaxed outline-none"
                  style="
                    min-height: 120px;
                    background: transparent;
                    color: var(--color-on-surface);
                    font-family: 'Inter', sans-serif;
                    border: none;
                    border-bottom: 2px solid rgba(31,27,22,0.12);
                    border-radius: 0;
                    padding-bottom: 8px;
                    transition: border-color 0.2s ease;
                  "
                  [value]="observaciones()"
                  (input)="onObsChange($event)"
                  (focus)="onObsFocus($event)"
                  (blur)="onObsBlur($event)"
                  [placeholder]="p.observaciones ? '' : 'Agregar observación técnica…'"
                ></textarea>
              </div>
              <div
                class="px-5 py-3 flex items-center justify-between"
                style="background: var(--color-surface-low)"
              >
                <span class="text-xs" style="color: var(--color-secondary); font-family: 'Inter', sans-serif">
                  {{ observaciones().length }} caracteres
                </span>
                @if (obsModificada()) {
                  <span class="text-xs font-medium" style="color: var(--color-primary); font-family: 'Inter', sans-serif">
                    ● Sin guardar
                  </span>
                }
              </div>
            </div>

            <!-- CTA Dashboard Geodata -->
            <a
              [routerLink]="['/geodata', p.id]"
              class="btn-primary text-center text-sm"
            >
              Dashboard Geodata →
            </a>

            <!-- Volver -->
            <a
              routerLink="/detalles"
              class="flex items-center gap-2 text-sm font-medium"
              style="color: var(--color-secondary); font-family: 'Inter', sans-serif"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 2L4 7l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Volver a la tabla
            </a>

          </div>

        </div>
      </section>
    }
  `,
})
export class ProyectoComponent {
  private readonly svc   = inject(InventarioService);
  private readonly route = inject(ActivatedRoute);
  private readonly titleSvc = inject(Title);
  protected readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor() {
    effect(() => {
      const p = this.proyecto();
      if (p) {
        untracked(() => this.titleSvc.setTitle(`${p.nombre} — Detalles`));
      }
    });
  }

  // ID de ruta como signal
  private readonly id = toSignal(
    this.route.paramMap.pipe(map((pm) => pm.get('id') ?? '')),
    { initialValue: '' },
  );

  // Todos los proyectos
  private readonly proyectos = toSignal(this.svc.getInventario());

  // Proyecto actual por id
  protected readonly proyecto = computed<Proyecto | null>(() => {
    const lista = this.proyectos();
    if (!lista) return null;
    return lista.find((p) => p.id === this.id()) ?? null;
  });

  protected readonly cargando = computed(
    () => !this.proyectos() && this.id() !== '',
  );

  // ── Observaciones (editable en UI, no persiste en esta versión) ──
  private readonly _observaciones = signal('');
  protected readonly obsModificada = signal(false);

  protected readonly observaciones = computed(
    () => this._observaciones() || this.proyecto()?.observaciones || '',
  );

  protected onObsChange(e: Event): void {
    this._observaciones.set((e.target as HTMLTextAreaElement).value);
    this.obsModificada.set(true);
  }

  protected onObsFocus(e: Event): void {
    (e.target as HTMLTextAreaElement).style.borderBottomColor = '#a04100';
  }

  protected onObsBlur(e: Event): void {
    (e.target as HTMLTextAreaElement).style.borderBottomColor = 'rgba(31,27,22,0.12)';
  }

  // ── Resumen del proyecto ─────────────────────────────────────────
  protected readonly resumenProyecto = computed(() =>
    this.svc.calcularResumenProyecto(
      this.proyecto() ?? { id: '', nombre: '', responsable: '', elementos: [], observaciones: null, puntosCriticos: null, fechaCompromisoConcesiones: null },
    ),
  );

  // ── Leyenda donut ────────────────────────────────────────────────
  protected readonly leyendaDonut = computed(() => {
    const r = this.resumenProyecto();
    return [
      { label: 'Entregado',       valor: r.entregado,             color: '#16a34a' },
      { label: 'Parc. Entregado', valor: r.parcialmenteEntregado, color: '#d97706' },
      { label: 'Pendiente',       valor: r.pendiente,             color: '#dc2626' },
    ].filter((i) => i.valor > 0);
  });

  // ── Opciones Donut ECharts ───────────────────────────────────────
  protected readonly donutOptions = computed<EChartsOption>(() => {
    const r = this.resumenProyecto();
    const data = [
      { value: r.entregado,             name: 'Entregado',       itemStyle: { color: '#16a34a' } },
      { value: r.parcialmenteEntregado, name: 'Parc. Entregado', itemStyle: { color: '#d97706' } },
      { value: r.pendiente,             name: 'Pendiente',       itemStyle: { color: '#dc2626' } },
    ].filter((d) => d.value > 0);

    return {
      ...echartsBase(),
      tooltip: { trigger: 'item', formatter: '{b}: {c} elementos ({d}%)', ...tooltipBase },
      series: [
        {
          type: 'pie',
          radius: ['45%', '72%'],
          center: ['50%', '50%'],
          itemStyle: { borderWidth: 3, borderColor: '#ffffff' },
          label: { show: false },
          labelLine: { show: false },
          emphasis: {
            scale: true,
            scaleSize: 6,
            itemStyle: { shadowBlur: 16, shadowColor: 'rgba(31,27,22,0.15)' },
          },
          data,
        },
      ],
    };
  });

  // ── Helpers de chip ──────────────────────────────────────────────
  protected chipColor(estado: EstadoElemento): string {
    return COLOR[estado];
  }

  protected chipBg(estado: EstadoElemento): string {
    return CHIP_BG[estado];
  }
}
