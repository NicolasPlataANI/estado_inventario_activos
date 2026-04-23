import { Component, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { MazoCardComponent, MazoSlide } from '../../shared/mazo-card/mazo-card.component';

interface Escenario {
  titulo: string;
  subtitulo: string;
  tipo: 'problema' | 'ideal';
  slides: MazoSlide[];
}

@Component({
  selector: 'app-entrega',
  standalone: true,
  imports: [MazoCardComponent],
  template: `
    <!-- ── ENCABEZADO ─────────────────────────────────────────── -->
    <section class="bg-[var(--color-surface)] pt-20 pb-12 px-6 lg:px-10">
      <div class="max-w-7xl mx-auto">
        <p class="text-[var(--color-primary)] font-inter text-base font-medium tracking-widest uppercase mb-3">
          Gestión de Información
        </p>
        <h1
          style="font-family:'Public Sans',sans-serif;font-size:clamp(2.5rem,4.5vw,3.75rem);font-weight:700;color:var(--color-on-surface);letter-spacing:-0.02em;max-width:22ch;line-height:1.15"
        >
          Entrega de Información por Concesionarios
        </h1>
        <p class="mt-4 text-lg leading-relaxed"
          style="color:var(--color-secondary);font-family:'Inter',sans-serif;max-width:60ch">
          Dos escenarios que contrastan la entrega problemática frente a la entrega estructurada.
          Haz clic en cada mazo y navega con las flechas.
        </p>
      </div>
    </section>

    <!-- ── MAZOS ─────────────────────────────────────────────── -->
    <section class="bg-[var(--color-surface-low)] py-16 px-6 lg:px-10">
      <div class="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 lg:gap-16 items-start">

        @for (esc of escenarios; track esc.titulo) {
          <div class="flex flex-col gap-3">
            <div class="flex items-center gap-3 mb-1">
              <span
                class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                [style]="esc.tipo==='problema'
                  ? 'background:rgba(78,96,115,0.12);color:#4e6073'
                  : 'background:rgba(160,65,0,0.12);color:#a04100'"
              >{{ $index + 1 }}</span>
              <span class="text-sm font-semibold tracking-widest uppercase"
                [style.color]="esc.tipo==='problema' ? '#4e6073' : '#a04100'">
                Escenario {{ $index + 1 }}
              </span>
            </div>

            <app-mazo-card
              [titulo]="esc.titulo"
              [subtitulo]="esc.subtitulo"
              [tipo]="esc.tipo"
              [slides]="esc.slides"
            />
          </div>
        }

      </div>
    </section>

    <!-- ── COMPARATIVA ──────────────────────────────────────── -->
    <section class="bg-[var(--color-surface)] py-20 px-6 lg:px-10">
      <div class="max-w-7xl mx-auto">
        <h2 class="mb-10"
          style="font-family:'Public Sans',sans-serif;font-size:clamp(1.75rem,3vw,2.5rem);font-weight:700;color:var(--color-on-surface);letter-spacing:-0.02em">
          Impacto en tiempos de ciclo
        </h2>
        <div class="grid md:grid-cols-2 gap-6">
          <div class="rounded-2xl p-8" style="background:rgba(78,96,115,0.06)">
            <p class="text-sm font-semibold uppercase tracking-widest mb-5" style="color:#4e6073">⚠ Entrega dispersa</p>
            <div class="space-y-5">
              @for (item of impactoProblema; track item.label) {
                <div class="flex items-start gap-4">
                  <span class="text-3xl shrink-0">{{ item.icono }}</span>
                  <div>
                    <p class="text-base font-semibold" style="color:var(--color-on-surface);font-family:'Public Sans',sans-serif">{{ item.label }}</p>
                    <p class="text-base mt-0.5" style="color:var(--color-secondary);font-family:'Inter',sans-serif">{{ item.valor }}</p>
                  </div>
                </div>
              }
            </div>
          </div>
          <div class="rounded-2xl p-8" style="background:rgba(160,65,0,0.06)">
            <p class="text-sm font-semibold uppercase tracking-widest mb-5" style="color:#a04100">✓ Entrega estructurada</p>
            <div class="space-y-5">
              @for (item of impactoIdeal; track item.label) {
                <div class="flex items-start gap-4">
                  <span class="text-3xl shrink-0">{{ item.icono }}</span>
                  <div>
                    <p class="text-base font-semibold" style="color:var(--color-on-surface);font-family:'Public Sans',sans-serif">{{ item.label }}</p>
                    <p class="text-base mt-0.5" style="color:var(--color-secondary);font-family:'Inter',sans-serif">{{ item.valor }}</p>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class EntregaComponent {
  private readonly titleSvc = inject(Title);

  constructor() {
    this.titleSvc.setTitle('Entrega de Información — ANI');
  }

  protected readonly escenarios: Escenario[] = [
    {
      titulo: 'Entrega Dispersa y Sin Estandarización',
      subtitulo: 'Escenario 1 — Problemático',
      tipo: 'problema',
      slides: [
        {
          texto: 'La información entregada por el concesionario se distribuye en múltiples carpetas sin estructura unificada, obligando a revisiones manuales que pueden superar un mes por ciclo completo de recepción, revisión, retroalimentación y ajuste.',
        },
        {
          texto: 'La revisión manual toma aproximadamente dos (2) semanas por parte del profesional ANI. A esto se suma el tiempo de respuesta del concesionario, que puede alcanzar dos (2) semanas adicionales en días hábiles.',
        },
        {
          imagen: {
            src: 'Escenario 1_html_ee07e765.png',
            caption: 'Ilustración 1. Proyecto Autopista al Mar 1 — carpetas de entrega sin estructura unificada.',
          },
        },
        {
          imagen: {
            src: 'Escenario 1_html_5ceb00cd.png',
            caption: 'Ilustración 2. Proyecto Villavicencio-Yopal — carpeta de planos As-Built.',
          },
        },
        {
          imagen: {
            src: 'Escenario 1_html_cc0e48f6.png',
            caption: 'Ilustración 3. Proyecto Villavicencio-Yopal — activo puente desglosado por carpetas.',
          },
        },
        {
          imagen: {
            src: 'Escenario 1_html_517103ae.png',
            caption: 'Ilustración 4. Proyecto Río Magdalena 2 — capas nombradas sin convenciones explicadas.',
          },
          texto: 'Las capas carecen de nomenclatura estandarizada, impidiendo identificar eficientemente activos como calzada, berma o separador.',
        },
      ],
    },
    {
      titulo: 'Entrega Estructurada',
      subtitulo: 'Escenario 2 — Ideal',
      tipo: 'ideal',
      slides: [
        {
          texto: 'En este escenario la información es entregada de manera completa, organizada y estructurada, permitiendo su uso directo en procesos técnicos y de análisis sin necesidad de reprocesos.',
        },
        {
          texto: 'En AutoCAD puede presentarse como un único archivo con capas por tipo de elemento, o como archivos independientes por componente (cunetas, drenajes, señalización). La clave está en la correcta estructuración de las capas y la claridad de la geometría.',
        },
        {
          imagen: {
            src: 'Escenario 2_html_145e1fa4.jpg',
            caption: 'Ilustración 1. Proyecto Buga-Buenaventura — AutoCAD con capas organizadas por elemento.',
          },
        },
        {
          imagen: {
            src: 'Escenario 2_html_d2a79b00.jpg',
            caption: 'Ilustración 2. Proyecto Vías del Nus — archivos independientes por elemento.',
          },
        },
        {
          imagen: {
            src: 'Escenario 2_html_ff9764f7.jpg',
            caption: 'Ilustración 3. Proyecto Rumichaca-Pato — Shapefiles por elemento en ArcGIS Pro.',
          },
          texto: 'En entornos SIG, las capas temáticas con geometría definida habilitan directamente el análisis espacial, reduciendo tiempos de integración.',
        },
      ],
    },
  ];

  protected readonly impactoProblema = [
    { icono: '⏱', label: 'Revisión profesional ANI',    valor: '~2 semanas por iteración' },
    { icono: '📬', label: 'Respuesta del concesionario', valor: '~2 semanas adicionales' },
    { icono: '🔄', label: 'Ciclo completo',              valor: 'Puede superar 1 mes' },
    { icono: '⚠',  label: 'Riesgo de inconsistencias',  valor: 'Alto — capas sin nomenclatura' },
  ];

  protected readonly impactoIdeal = [
    { icono: '✅', label: 'Integración directa',  valor: 'Sin reprocesos manuales' },
    { icono: '⚡', label: 'Tiempo de ciclo',       valor: 'Reducido significativamente' },
    { icono: '🗺', label: 'Análisis espacial',     valor: 'Disponible de inmediato (SIG)' },
    { icono: '📐', label: 'Estructura de capas',   valor: 'Clara y estandarizada' },
  ];
}
