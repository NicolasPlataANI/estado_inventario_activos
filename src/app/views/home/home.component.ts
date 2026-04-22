import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface AvanceYear {
  year: string;
  titulo: string;
  resumen: string;
  hitos: string[];
}

interface FlowStep {
  numero: string;
  titulo: string;
  descripcion: string;
  icono: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <!-- ── HERO ─────────────────────────────────────────────────── -->
    <section class="relative min-h-[92vh] flex items-end overflow-hidden">

      <!-- Imagen de fondo -->
      <img
        src="Carretera 1.JPG"
        alt="Corredor vial de concesión ANI"
        class="absolute inset-0 w-full h-full object-cover object-center"
        loading="eager"
      />

      <!-- Overlay gradiente 135° primary → primary-container -->
      <div
        class="absolute inset-0"
        style="background: linear-gradient(135deg, rgba(160,65,0,0.82) 0%, rgba(250,111,24,0.55) 60%, rgba(250,111,24,0.15) 100%)"
      ></div>

      <!-- Contenido hero -->
      <div class="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-10 pb-20 pt-32">

        <!-- Eyebrow -->
        <p class="text-white/70 font-inter text-sm font-medium tracking-widest uppercase mb-6">
          Agencia Nacional de Infraestructura
        </p>

        <!-- Título editorial -->
        <h1
          class="font-sans text-white leading-none mb-8"
          style="font-family: 'Public Sans', sans-serif; font-size: clamp(2.5rem, 6vw, 4.5rem); font-weight: 700; letter-spacing: -0.02em; max-width: 16ch"
        >
          Capacitación sobre el<br />Estado de<br />Georreferenciación de<br />Proyectos de<br />Infraestructura - ANI
        </h1>

        <!-- Bajada -->
        <p
          class="text-white/80 font-inter text-lg leading-relaxed mb-12"
          style="max-width: 52ch"
        >
          Plataforma de seguimiento al estado de georreferenciación
          de los activos de la red vial concesionada en Colombia.
        </p>

        <!-- CTA -->
        <div class="flex flex-wrap gap-4">
          <a routerLink="/georreferenciacion" class="btn-primary">
            Ver estado global
          </a>
          <a routerLink="/detalles" class="btn-secondary" style="border-color: rgba(255,255,255,0.35); color: white">
            Explorar proyectos
          </a>
        </div>

      </div>

      <!-- Indicador de scroll -->
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-white/50">
        <span class="font-inter text-xs tracking-widest uppercase">Flujo de información</span>
        <svg width="16" height="24" viewBox="0 0 16 24" fill="none">
          <rect x="6.5" y="0.5" width="3" height="3" rx="1.5" fill="currentColor" opacity="0.4"/>
          <rect x="6.5" y="6" width="3" height="3" rx="1.5" fill="currentColor" opacity="0.6"/>
          <rect x="6.5" y="11.5" width="3" height="3" rx="1.5" fill="currentColor" opacity="0.8"/>
          <path d="M8 17L4 21L8 21L12 21L8 17Z" fill="currentColor"/>
        </svg>
      </div>
    </section>

    <!-- ── DIAGRAMA DE FLUJO ANI ──────────────────────────────────── -->
    <section class="bg-[var(--color-surface-low)] py-24 px-6 lg:px-10 overflow-hidden">

      <div class="max-w-7xl mx-auto">

        <!-- Encabezado de sección -->
        <div class="mb-16">
          <p class="text-[var(--color-primary)] font-inter text-sm font-medium tracking-widest uppercase mb-3">
            Proceso interno
          </p>
          <h2
            style="font-family: 'Public Sans', sans-serif; font-size: clamp(1.75rem, 3vw, 2.5rem); font-weight: 700; color: var(--color-on-surface); letter-spacing: -0.02em; max-width: 22ch; line-height: 1.15"
          >
            Flujo de información de la ANI
          </h2>
        </div>

        <!-- Data Totems — desktop horizontal / mobile vertical -->
        <div class="flex flex-col lg:flex-row items-stretch gap-0">

          @for (step of flowSteps; track step.numero; let last = $last) {

            <!-- Totem card -->
            <div class="flex lg:flex-col items-start lg:items-center gap-4 lg:gap-0 flex-1 relative group">

              <!-- Línea conectora (solo desktop, excluye último) -->
              @if (!last) {
                <div
                  class="hidden lg:block absolute top-[3.25rem] left-[calc(50%+2.5rem)] right-0 h-px z-0"
                  style="background: linear-gradient(to right, var(--color-primary-container), transparent)"
                ></div>
              }

              <!-- Cuerpo del totem -->
              <div
                class="relative z-10 w-full lg:w-auto flex flex-row lg:flex-col items-start lg:items-center gap-4 lg:gap-0 lg:px-4"
              >
                <!-- Número / icono -->
                <div
                  class="shrink-0 w-24 lg:w-24 h-24 rounded-2xl flex flex-col items-center justify-center gap-1 transition-transform duration-300 group-hover:-translate-y-1"
                  style="background: var(--color-surface-container-highest, #e8ddd2)"
                >
                  <span
                    class="text-3xl"
                    role="img"
                    [attr.aria-label]="step.titulo"
                  >{{ step.icono }}</span>
                  <span
                    class="font-inter text-xs font-semibold"
                    style="color: var(--color-primary)"
                  >{{ step.numero }}</span>
                </div>

                <!-- Texto -->
                <div class="lg:text-center lg:mt-5 lg:px-2">
                  <p
                    class="font-sans font-semibold text-sm leading-snug mb-1"
                    style="font-family: 'Public Sans', sans-serif; color: var(--color-on-surface)"
                  >{{ step.titulo }}</p>
                  <p
                    class="font-inter text-xs leading-relaxed"
                    style="color: var(--color-secondary)"
                  >{{ step.descripcion }}</p>
                </div>
              </div>

              <!-- Línea conectora (mobile vertical, excluye último) -->
              @if (!last) {
                <div
                  class="lg:hidden w-px self-stretch ml-12 mt-1"
                  style="background: linear-gradient(to bottom, var(--color-primary-container), transparent); min-height: 2rem"
                ></div>
              }

            </div>

          }

        </div>

        <!-- Nota al pie del diagrama -->
        <p
          class="mt-16 font-inter text-xs leading-relaxed"
          style="color: var(--color-secondary); max-width: 72ch"
        >
          El tiempo estimado para el ciclo completo varía según el escenario de entrega:
          desde <strong style="color: var(--color-primary)">menos de una semana</strong>
          en entregas estructuradas, hasta
          <strong style="color: var(--color-primary)">más de un mes</strong>
          cuando la información llega dispersa y sin estandarización.
        </p>

      </div>
    </section>

    <!-- ── STATS BAR ──────────────────────────────────────────────── -->
    <section class="bg-[var(--color-surface)] py-16 px-6 lg:px-10">
      <div class="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">

        @for (stat of stats; track stat.label) {
          <div class="flex flex-col gap-1">
            <span
              class="font-sans font-bold"
              style="font-family: 'Public Sans', sans-serif; font-size: 2.25rem; color: var(--color-primary); letter-spacing: -0.03em; line-height: 1"
            >{{ stat.valor }}</span>
            <span
              class="font-inter text-sm"
              style="color: var(--color-secondary)"
            >{{ stat.label }}</span>
          </div>
        }

      </div>
    </section>

    <!-- ── AVANCES AÑO A AÑO ─────────────────────────────────────── -->
    <section class="bg-[var(--color-surface-low)] py-24 px-6 lg:px-10">
      <div class="max-w-7xl mx-auto">

        <!-- Encabezado -->
        <div class="mb-16">
          <p class="text-[var(--color-primary)] font-inter text-sm font-medium tracking-widest uppercase mb-3">
            Línea de tiempo
          </p>
          <h2
            style="font-family: 'Public Sans', sans-serif; font-size: clamp(1.75rem, 3vw, 2.5rem); font-weight: 700; color: var(--color-on-surface); letter-spacing: -0.02em; max-width: 22ch; line-height: 1.15"
          >
            Avances año a año
          </h2>
        </div>

        <!-- Timeline con años clickeables -->
        <div class="flex items-start gap-0 mb-12">
          @for (avance of avances; track avance.year; let last = $last) {

            <div class="flex flex-col items-center flex-1 relative">

              <!-- Línea conectora (excluye último) -->
              @if (!last) {
                <div
                  class="absolute top-7 left-[calc(50%+2rem)] right-0 h-0.5 z-0 transition-colors duration-500"
                  [style.background]="avance.year < selectedYear() ? 'var(--color-primary)' : 'var(--color-surface-container)'"
                ></div>
              }

              <!-- Círculo botón -->
              <button
                type="button"
                (click)="selectedYear.set(avance.year)"
                class="relative z-10 w-14 h-14 rounded-full font-inter text-xs font-bold border-2 transition-all duration-300 cursor-pointer"
                [style.background]="selectedYear() === avance.year ? 'var(--color-primary)' : 'var(--color-surface)'"
                [style.color]="selectedYear() === avance.year ? 'white' : 'var(--color-on-surface-variant)'"
                [style.borderColor]="selectedYear() === avance.year ? 'var(--color-primary)' : 'var(--color-surface-container)'"
                [style.boxShadow]="selectedYear() === avance.year ? '0 4px 20px rgba(160,65,0,0.28)' : 'none'"
              >{{ avance.year }}</button>

              <!-- Etiqueta del año -->
              <p
                class="mt-3 font-inter text-xs text-center px-2 leading-snug transition-colors duration-300"
                style="max-width: 12ch"
                [style.color]="selectedYear() === avance.year ? 'var(--color-primary)' : 'var(--color-secondary)'"
                [style.fontWeight]="selectedYear() === avance.year ? '600' : '400'"
              >{{ avance.titulo }}</p>

            </div>

          }
        </div>

        <!-- Tarjeta de contenido del año seleccionado -->
        <div
          class="rounded-2xl p-8 lg:p-10"
          style="background: var(--color-surface)"
        >
          <p
            class="font-inter text-base leading-relaxed mb-8"
            style="color: var(--color-secondary); max-width: 72ch"
          >{{ selectedAvance().resumen }}</p>

          <ul class="flex flex-col gap-4">
            @for (hito of selectedAvance().hitos; track hito) {
              <li class="flex items-start gap-4">
                <span
                  class="shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5"
                  style="background: var(--color-primary-container)"
                >
                  <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                    <path d="M1 4.5L4.5 8L11 1" stroke="var(--color-primary)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
                <span
                  class="font-inter text-sm leading-relaxed"
                  style="color: var(--color-on-surface)"
                >{{ hito }}</span>
              </li>
            }
          </ul>
        </div>

      </div>
    </section>
  `,
})
export class HomeComponent {
  protected readonly flowSteps: FlowStep[] = [
    {
      numero: '01',
      titulo: 'Entrega del Concesionario',
      descripcion: 'El concesionario remite la información geoespacial del activo vial.',
      icono: '🏗️',
    },
    {
      numero: '02',
      titulo: 'Recepción ANI',
      descripcion: 'El profesional ANI recibe y registra los archivos entregados.',
      icono: '📥',
    },
    {
      numero: '03',
      titulo: 'Revisión Técnica',
      descripcion: 'Verificación de estructura, nomenclatura y completitud de capas.',
      icono: '🔍',
    },
    {
      numero: '04',
      titulo: 'Retroalimentación',
      descripcion: 'En caso de inconsistencias, se emite memorando de solicitud de ajustes.',
      icono: '📋',
    },
    {
      numero: '05',
      titulo: 'Integración al Sistema',
      descripcion: 'La información validada se incorpora al inventario de activos viales.',
      icono: '✅',
    },
  ];

  protected readonly stats: { valor: string; label: string }[] = [
    { valor: '41', label: 'Proyectos concesionados' },
    { valor: '19', label: 'Tipos de activo vial' },
    { valor: '5', label: 'Responsables ANI' },
    { valor: '779', label: 'Elementos trazados' },
  ];

  protected readonly avances: AvanceYear[] = [
    {
      year: '2024',
      titulo: 'Inicio y contacto',
      resumen: 'Se da inicio al proceso de captura de información geográfica para el inventario de activos del modo carretero, con comunicación directa a los grupos responsables de los 41 proyectos concesionados.',
      hitos: [
        'Solicitud a líderes y gerentes de proyecto a través de llamadas telefónicas y correos institucionales',
        'Reuniones con cada grupo responsable de los 41 proyectos para acordar la entrega de información',
        'Inicio del proceso de trazado de ejes de calzada para la totalidad de proyectos ANI',
      ],
    },
    {
      year: '2025',
      titulo: 'Requerimiento formal',
      resumen: 'Se formaliza la exigencia a los concesionarios mediante memorandos y se adopta el marco normativo que establece oficialmente los 17 elementos del inventario vial.',
      hitos: [
        'Memorandos formales a cada concesionario solicitando la georreferenciación de activos para cumplimiento normativo',
        'Georreferenciación completada de 3 de los 17 elementos: Berma, Calzada y Separador',
        'Expedición de la Resolución 20253040053135 del 23 de diciembre de 2025 por el Ministerio de Transporte',
        'Adopción oficial de la metodología SINC y formalización del listado de 17 elementos del inventario',
      ],
    },
    {
      year: '2026',
      titulo: 'Revisión y ampliación',
      resumen: 'Se revisa y valida la información obtenida, se convocan mesas de trabajo con los concesionarios y se avanza en la georreferenciación de los 14 elementos restantes de la resolución ministerial.',
      hitos: [
        'Revisión y validación de la información georreferenciada recibida de los concesionarios',
        'Convocatoria y realización de mesas de trabajo para coordinar entregas pendientes',
        'Georreferenciación en curso de los 14 elementos restantes de los 17 establecidos en la resolución',
      ],
    },
  ];

  protected readonly selectedYear = signal<string>('2026');

  protected readonly selectedAvance = computed(() =>
    this.avances.find(a => a.year === this.selectedYear())!
  );
}
