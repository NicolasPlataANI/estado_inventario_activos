import { Component, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';

import { InventarioService } from '../../core/services/inventario.service';
import { echartsBase, tooltipBase, ESTADO_COLORS } from '../../shared/echart-defaults';

// Alias locales — siguen el orden semáforo: verde · amarillo · rojo · gris
const COLORES = {
  entregado: ESTADO_COLORS.entregado,             // #16a34a verde
  parcial:   ESTADO_COLORS.parcialmenteEntregado, // #d97706 amarillo
  pendiente: ESTADO_COLORS.pendiente,             // #dc2626 rojo
  noAplica:  ESTADO_COLORS.noAplica,              // #9ca3af gris
};

@Component({
  selector: 'app-georreferenciacion',
  standalone: true,
  imports: [RouterLink, NgxEchartsDirective],
  template: `
    <!-- ── HERO ─────────────────────────────────────────────── -->
    <section class="bg-[var(--color-surface)] pt-20 pb-12 px-6 lg:px-10">
      <div class="max-w-7xl mx-auto">
        <p class="text-[var(--color-primary)] font-inter text-sm font-medium tracking-widest uppercase mb-3">
          Seguimiento técnico
        </p>
        <h1
          style="font-family: 'Public Sans', sans-serif; font-size: clamp(2rem, 4vw, 3rem); font-weight: 700; color: var(--color-on-surface); letter-spacing: -0.02em; max-width: 24ch; line-height: 1.15"
        >
          Estado de Georreferenciación de Activos Viales
        </h1>
      </div>
    </section>

    <!-- ── CONTENIDO PRINCIPAL ──────────────────────────────── -->
    <section class="bg-[var(--color-surface-low)] py-16 px-6 lg:px-10">
      <div class="max-w-7xl mx-auto grid lg:grid-cols-[1fr_440px] gap-16 items-start">

        <!-- ── Columna izquierda: texto normativo ── -->
        <div class="space-y-8">

          <!-- Marco normativo -->
          <div>
            <h2
              class="mb-5"
              style="font-family: 'Public Sans', sans-serif; font-size: 1.25rem; font-weight: 700; color: var(--color-on-surface); letter-spacing: -0.01em"
            >Marco normativo</h2>

            <div class="space-y-4 text-base leading-relaxed" style="color: var(--color-on-surface); font-family: 'Inter', sans-serif">
              <p>
                La <strong>Agencia Nacional de Infraestructura (ANI)</strong> tiene la obligación de
                mantener un inventario georreferenciado y actualizado de los activos de la red vial
                concesionada, en cumplimiento de los contratos de concesión de cuarta generación (4G)
                y de la política de gestión de activos de infraestructura vial del país.
              </p>
              <p>
                Cada concesionario debe entregar la información geoespacial de sus activos
                —calzadas, bermas, separadores, puentes, túneles, sistemas de drenaje,
                señalización y demás elementos— en formatos estandarizados (AutoCAD DWG
                estructurado o Shapefiles SIG), con nomenclatura de capas claramente definida
                y geometría verificable.
              </p>
              <p>
                El incumplimiento o la entrega parcial de esta información genera retrasos en
                los procesos de revisión técnica, impide la toma de decisiones basada en datos
                y dificulta el seguimiento al estado de conservación de la red.
              </p>
            </div>
          </div>

          <!-- Separador tonal (sin línea 1px) -->
          <div class="h-px" style="background: var(--color-surface-container)"></div>

          <!-- KPIs de contexto -->
          <div>
            <h2
              class="mb-5"
              style="font-family: 'Public Sans', sans-serif; font-size: 1.25rem; font-weight: 700; color: var(--color-on-surface); letter-spacing: -0.01em"
            >Resumen global de cumplimiento</h2>

            @if (cargando()) {
              <div class="grid grid-cols-2 gap-4">
                @for (_ of [1,2,3,4]; track $index) {
                  <div class="rounded-xl h-24 animate-pulse" style="background: var(--color-surface-container)"></div>
                }
              </div>
            } @else {
              <div class="grid grid-cols-2 gap-4">
                <!-- Entregado — verde -->
                <div class="rounded-xl p-5" style="background: rgba(22,163,74,0.08)">
                  <span
                    class="block font-bold leading-none mb-1"
                    style="font-family: 'Public Sans', sans-serif; font-size: 2rem; color: #16a34a; letter-spacing: -0.03em"
                  >{{ resumen().entregado }}</span>
                  <span class="text-xs font-semibold" style="color: #16a34a">Entregado</span>
                  <span class="block text-xs mt-0.5" style="color: var(--color-secondary)">
                    {{ pct(resumen().entregado) }}% del total
                  </span>
                </div>

                <!-- Parcialmente Entregado — amarillo -->
                <div class="rounded-xl p-5" style="background: rgba(217,119,6,0.08)">
                  <span
                    class="block font-bold leading-none mb-1"
                    style="font-family: 'Public Sans', sans-serif; font-size: 2rem; color: #d97706; letter-spacing: -0.03em"
                  >{{ resumen().parcialmenteEntregado }}</span>
                  <span class="text-xs font-semibold" style="color: #d97706">Parcialmente Entregado</span>
                  <span class="block text-xs mt-0.5" style="color: var(--color-secondary)">
                    {{ pct(resumen().parcialmenteEntregado) }}% del total
                  </span>
                </div>

                <!-- Pendiente — rojo -->
                <div class="rounded-xl p-5" style="background: rgba(220,38,38,0.08)">
                  <span
                    class="block font-bold leading-none mb-1"
                    style="font-family: 'Public Sans', sans-serif; font-size: 2rem; color: #dc2626; letter-spacing: -0.03em"
                  >{{ resumen().pendiente }}</span>
                  <span class="text-xs font-semibold" style="color: #dc2626">Pendiente</span>
                  <span class="block text-xs mt-0.5" style="color: var(--color-secondary)">
                    {{ pct(resumen().pendiente) }}% del total
                  </span>
                </div>

                <!-- No Aplica — gris -->
                <div class="rounded-xl p-5" style="background: rgba(156,163,175,0.12)">
                  <span
                    class="block font-bold leading-none mb-1"
                    style="font-family: 'Public Sans', sans-serif; font-size: 2rem; color: #9ca3af; letter-spacing: -0.03em"
                  >{{ resumen().noAplica }}</span>
                  <span class="text-xs font-semibold" style="color: #9ca3af">No Aplica</span>
                  <span class="block text-xs mt-0.5" style="color: var(--color-secondary)">
                    {{ pct(resumen().noAplica) }}% del total
                  </span>
                </div>
              </div>
            }
          </div>

          <!-- CTA -->
          <div class="pt-4">
            <a routerLink="/detalles" class="btn-primary">
              Visualizar datos por proyecto →
            </a>
          </div>

        </div>

        <!-- ── Columna derecha: Pie Chart ── -->
        <div class="flex flex-col gap-4">
          <h2
            class="mb-2"
            style="font-family: 'Public Sans', sans-serif; font-size: 1.25rem; font-weight: 700; color: var(--color-on-surface); letter-spacing: -0.01em"
          >Distribución de estados</h2>

          <p class="text-sm mb-4" style="color: var(--color-secondary); font-family: 'Inter', sans-serif">
            Total de elementos trazados: <strong style="color: var(--color-on-surface)">{{ resumen().total }}</strong>
            en {{ proyectos()?.length ?? 0 }} proyectos concesionados.
          </p>

          @if (cargando()) {
            <!-- Skeleton chart -->
            <div
              class="rounded-2xl flex items-center justify-center animate-pulse"
              style="height: 380px; background: var(--color-surface-container)"
            >
              <div class="w-40 h-40 rounded-full" style="background: var(--color-surface-low)"></div>
            </div>
          } @else if (isBrowser) {
            <div
              echarts
              [options]="chartOptions()"
              class="w-full rounded-2xl"
              style="height: 380px; background: white; box-shadow: 0 32px 48px rgba(31,27,22,0.06)"
            ></div>
          }

          <!-- Leyenda manual alineada con el diseño -->
          <div class="grid grid-cols-2 gap-3 mt-2">
            @for (item of leyenda(); track item.label) {
              <div class="flex items-center gap-2">
                <span
                  class="shrink-0 w-2.5 h-2.5 rounded-full"
                  [style.background]="item.color"
                ></span>
                <span class="text-xs" style="color: var(--color-secondary); font-family: 'Inter', sans-serif">
                  {{ item.label }}
                </span>
              </div>
            }
          </div>
        </div>

      </div>
    </section>
  `,
})
export class GeorreferenciacionComponent {
  private readonly svc = inject(InventarioService);
  protected readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly proyectos = toSignal(this.svc.getInventario());

  protected readonly cargando = computed(() => !this.proyectos());

  protected readonly resumen = computed(() =>
    this.svc.calcularResumen(this.proyectos() ?? []),
  );

  protected readonly leyenda = computed(() => [
    { label: `Entregado (${this.pct(this.resumen().entregado)}%)`,             color: COLORES.entregado },
    { label: `Parc. Entregado (${this.pct(this.resumen().parcialmenteEntregado)}%)`, color: COLORES.parcial },
    { label: `Pendiente (${this.pct(this.resumen().pendiente)}%)`,             color: COLORES.pendiente },
    { label: `No Aplica (${this.pct(this.resumen().noAplica)}%)`,              color: COLORES.noAplica },
  ]);

  protected readonly chartOptions = computed<EChartsOption>(() => {
    const r = this.resumen();
    return {
      ...echartsBase(),
      tooltip: { trigger: 'item', formatter: '{b}<br/>{c} elementos ({d}%)', ...tooltipBase },
      series: [
        {
          type: 'pie',
          radius: ['0%', '62%'],
          center: ['50%', '48%'],
          itemStyle: { borderWidth: 0, borderColor: 'transparent' },
          label: {
            show: true,
            formatter: '{d}%',
            fontFamily: 'Inter, sans-serif',
            fontSize: 11,
            color: '#fff8f4',
            fontWeight: 'bold' as const,
          },
          labelLine: { show: false },
          emphasis: {
            itemStyle: { shadowBlur: 20, shadowColor: 'rgba(31,27,22,0.12)' },
            label: { fontSize: 13 },
          },
          data: [
            { value: r.entregado,             name: 'Entregado',             itemStyle: { color: COLORES.entregado } },
            { value: r.parcialmenteEntregado, name: 'Parc. Entregado',       itemStyle: { color: COLORES.parcial } },
            { value: r.pendiente,             name: 'Pendiente',             itemStyle: { color: COLORES.pendiente } },
            { value: r.noAplica,              name: 'No Aplica',             itemStyle: { color: COLORES.noAplica } },
          ],
        },
      ],
    };
  });

  protected pct(valor: number): number {
    const total = this.resumen().total;
    if (!total) return 0;
    return Math.round((valor / total) * 100);
  }
}
