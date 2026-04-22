import { Component, input, signal, computed, inject, PLATFORM_ID, HostListener } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface MazoSlide {
  texto?: string;
  imagen?: { src: string; caption: string };
}

@Component({
  selector: 'app-mazo-card',
  standalone: true,
  template: `
    <!-- ══ DECK COLAPSADO ═════════════════════════════════════════ -->
    @if (!expanded()) {
      <div
        class="relative cursor-pointer select-none"
        style="height: 440px"
        (click)="expand()"
        (keydown.enter)="expand()"
        (keydown.space)="expand()"
        tabindex="0"
        [attr.aria-label]="'Abrir presentación: ' + titulo()"
        role="button"
      >
        <div class="absolute inset-0 rounded-2xl"
          style="background:var(--color-surface-container);transform:rotate(5deg) translate(12px,10px);z-index:1"></div>
        <div class="absolute inset-0 rounded-2xl"
          style="background:var(--color-surface-low);transform:rotate(2.5deg) translate(6px,5px);z-index:2"></div>

        <div class="absolute inset-0 rounded-2xl overflow-hidden flex flex-col transition-transform duration-300 hover:-translate-y-1"
          style="background:white;box-shadow:0 32px 48px rgba(31,27,22,0.08);z-index:3">

          <div class="shrink-0 h-1.5 w-full"
            [style.background]="tipo()==='problema'
              ? 'linear-gradient(90deg,#4e6073,#8da0b5)'
              : 'linear-gradient(90deg,#a04100,#fa6f18)'"></div>

          @if (primeraImagen(); as img) {
            <div class="shrink-0 relative overflow-hidden" style="height:220px">
              <img [src]="img.src" [alt]="img.caption"
                class="w-full h-full object-cover object-top" loading="lazy"/>
              <div class="absolute bottom-0 inset-x-0 h-16"
                style="background:linear-gradient(to top,white,transparent)"></div>
            </div>
          }

          <div class="flex-1 px-7 pt-4 pb-6 flex flex-col justify-between">
            <span class="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase rounded-md px-2.5 py-1 mb-3 self-start"
              [style]="tipo()==='problema'
                ? 'background:rgba(78,96,115,0.10);color:#4e6073'
                : 'background:rgba(160,65,0,0.10);color:#a04100'">
              @if (tipo()==='problema') { ⚠ Escenario problemático } @else { ✓ Escenario ideal }
            </span>
            <h3 style="font-family:'Public Sans',sans-serif;font-size:1.125rem;font-weight:700;color:var(--color-on-surface);line-height:1.25;letter-spacing:-0.01em">
              {{ titulo() }}
            </h3>
            <p class="mt-4 text-xs font-medium flex items-center gap-1.5"
              [style.color]="tipo()==='problema' ? '#4e6073' : '#a04100'">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="3" width="4" height="8" rx="1" fill="currentColor" opacity=".4"/>
                <rect x="6" y="3" width="4" height="8" rx="1" fill="currentColor" opacity=".7"/>
                <rect x="11" y="3" width="2" height="8" rx="1" fill="currentColor"/>
              </svg>
              {{ slides().length }} slides — clic para navegar
            </p>
          </div>
        </div>
      </div>
    }

    <!-- ══ VISOR EXPANDIDO ════════════════════════════════════════ -->
    @if (expanded()) {

      <!-- Backdrop (solo en modo wide) -->
      @if (wide()) {
        <div
          class="fixed inset-0 z-40"
          style="background:rgba(31,27,22,0.48);backdrop-filter:blur(6px)"
          (click)="setWide(false)"
          aria-hidden="true"
        ></div>
      }

      <!-- Placeholder en el grid cuando está en modo wide (evita colapso del layout) -->
      @if (wide()) {
        <div class="rounded-2xl" style="min-height:520px;background:var(--color-surface-container);opacity:0.4"></div>
      }

      <!-- Carta del visor — cambia de posición según modo wide -->
      <div
        [class]="wide()
          ? 'fixed z-50 rounded-2xl overflow-hidden flex flex-col'
          : 'relative rounded-2xl overflow-hidden flex flex-col'"
        [style]="wide()
          ? 'left:50%;top:50%;transform:translate(-50%,-50%);width:min(92vw,1080px);height:min(88vh,800px);background:white;box-shadow:0 48px 96px rgba(31,27,22,0.22)'
          : 'min-height:520px;background:white;box-shadow:0 32px 56px rgba(31,27,22,0.10)'"
        role="region"
        [attr.aria-label]="titulo()"
      >
        <!-- Banda de color -->
        <div class="shrink-0 h-1.5 w-full"
          [style.background]="tipo()==='problema'
            ? 'linear-gradient(90deg,#4e6073,#8da0b5)'
            : 'linear-gradient(90deg,#a04100,#fa6f18)'"></div>

        <!-- Cabecera: badge · contador · [expandir/contraer] · [cerrar] -->
        <div class="shrink-0 flex items-center justify-between px-6 pt-4 pb-3 gap-4">

          <span class="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase rounded-md px-2.5 py-1 shrink-0"
            [style]="tipo()==='problema'
              ? 'background:rgba(78,96,115,0.10);color:#4e6073'
              : 'background:rgba(160,65,0,0.10);color:#a04100'">
            @if (tipo()==='problema') { ⚠ Escenario problemático } @else { ✓ Escenario ideal }
          </span>

          <div class="flex items-center gap-2 ml-auto">
            <!-- Contador -->
            <span class="text-xs font-medium px-2" style="color:var(--color-secondary);font-family:'Inter',sans-serif">
              {{ currentIndex() + 1 }} / {{ slides().length }}
            </span>

            <!-- Botón expandir / contraer -->
            <button
              (click)="setWide(!wide())"
              class="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-[var(--color-surface-low)]"
              [attr.aria-label]="wide() ? 'Contraer' : 'Ver más grande'"
              [title]="wide() ? 'Contraer' : 'Ver más grande'"
            >
              @if (!wide()) {
                <!-- Icono expandir: cuatro flechas hacia afuera -->
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M9 1h4v4M5 13H1V9M13 5L8 10M1 9l5-5" stroke="var(--color-on-surface)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M1 1h4v4M9 13h4V9" stroke="var(--color-on-surface)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity=".4"/>
                </svg>
              } @else {
                <!-- Icono contraer: flechas hacia adentro -->
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M9 5V1M9 5H13M5 9v4M5 9H1" stroke="var(--color-on-surface)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity=".4"/>
                  <path d="M9 5L14 0M0 14l5-5M5 9L0 14M14 0L9 5" stroke="var(--color-on-surface)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              }
            </button>

            <!-- Botón cerrar (vuelve al deck) -->
            <button
              (click)="collapse()"
              class="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-[var(--color-surface-low)]"
              aria-label="Cerrar presentación"
              title="Cerrar"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 1l10 10M11 1L1 11" stroke="var(--color-on-surface)" stroke-width="1.75" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Título -->
        <div class="shrink-0 px-6 pb-3">
          <h3 style="font-family:'Public Sans',sans-serif;font-size:1.125rem;font-weight:700;color:var(--color-on-surface);letter-spacing:-0.01em;line-height:1.2">
            {{ titulo() }}
          </h3>
        </div>

        <!-- Área de slide -->
        <div class="relative flex-1 px-6 overflow-hidden">

          <!-- Flecha izquierda -->
          <button
            class="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all"
            style="background:var(--color-surface-low);box-shadow:0 4px 12px rgba(31,27,22,0.08)"
            [style.opacity]="currentIndex()===0 ? '0.3' : '1'"
            [disabled]="currentIndex()===0"
            (click)="prev()"
            aria-label="Slide anterior"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="var(--color-on-surface)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>

          <!-- Flecha derecha -->
          <button
            class="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all"
            style="background:var(--color-surface-low);box-shadow:0 4px 12px rgba(31,27,22,0.08)"
            [style.opacity]="currentIndex()===slides().length-1 ? '0.3' : '1'"
            [disabled]="currentIndex()===slides().length-1"
            (click)="next()"
            aria-label="Slide siguiente"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 3l5 5-5 5" stroke="var(--color-on-surface)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>

          <!-- Contenido animado -->
          @for (key of [animKey()]; track key) {
            <div [class]="'slide-content slide-in-' + animDir()" style="height:100%">
              @if (currentSlide(); as slide) {

                @if (slide.imagen) {
                  <!-- Slide con imagen (± texto) -->
                  <div class="h-full flex flex-col items-center justify-center gap-3 px-8">
                    <div class="flex-1 flex items-center w-full" style="min-height:0">
                      <img [src]="slide.imagen.src" [alt]="slide.imagen.caption"
                        class="w-full rounded-xl object-contain"
                        [style.max-height]="wide() ? '520px' : '300px'"
                        loading="lazy"/>
                    </div>
                    @if (slide.texto) {
                      <p class="text-sm leading-relaxed text-center shrink-0"
                        style="color:var(--color-secondary);font-family:'Inter',sans-serif;max-width:58ch">
                        {{ slide.texto }}
                      </p>
                    }
                    <p class="text-xs italic shrink-0 text-center"
                      style="color:var(--color-secondary);font-family:'Inter',sans-serif;opacity:.7">
                      {{ slide.imagen.caption }}
                    </p>
                  </div>

                } @else if (slide.texto) {
                  <!-- Slide solo texto -->
                  <div class="h-full flex items-center justify-center px-10">
                    <p class="text-center leading-relaxed"
                      [style.color]="'var(--color-on-surface)'"
                      [style.font-family]="'Inter, sans-serif'"
                      [style.max-width]="'54ch'"
                      [style.font-size]="wide() ? '1.1rem' : 'clamp(0.9rem,1.2vw,1.05rem)'">
                      {{ slide.texto }}
                    </p>
                  </div>
                }

              }
            </div>
          }
        </div>

        <!-- Barra inferior: dots + flechas de texto -->
        <div class="shrink-0 flex items-center justify-between px-6 py-4 mt-1">
          <!-- Dots -->
          <div class="flex items-center gap-1.5" role="tablist">
            @for (s of slides(); track $index) {
              <button
                class="rounded-full transition-all duration-200"
                [style]="$index===currentIndex()
                  ? 'width:20px;height:6px;background:' + (tipo()==='problema' ? '#4e6073' : '#a04100')
                  : 'width:6px;height:6px;background:var(--color-surface-container)'"
                (click)="goTo($index)"
                [attr.aria-label]="'Slide ' + ($index + 1)"
                role="tab"
                [attr.aria-selected]="$index===currentIndex()"
              ></button>
            }
          </div>
          <!-- Texto -->
          <div class="flex items-center gap-4">
            <button class="text-xs font-medium flex items-center gap-1 transition-opacity"
              [style.color]="tipo()==='problema' ? '#4e6073' : '#a04100'"
              [style.opacity]="currentIndex()===0 ? '0.3' : '1'"
              [disabled]="currentIndex()===0"
              (click)="prev()">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M8 2L3 6l5 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Anterior
            </button>
            <button class="text-xs font-medium flex items-center gap-1 transition-opacity"
              [style.color]="tipo()==='problema' ? '#4e6073' : '#a04100'"
              [style.opacity]="currentIndex()===slides().length-1 ? '0.3' : '1'"
              [disabled]="currentIndex()===slides().length-1"
              (click)="next()">
              Siguiente
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M4 2l5 4-5 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

      </div><!-- /carta -->
    }<!-- /expanded -->
  `,
  styles: [`
    :host { display: block; }

    @keyframes slideInFwd {
      from { opacity: 0; transform: translateX(52px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes slideInBack {
      from { opacity: 0; transform: translateX(-52px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    .slide-in-fwd  { animation: slideInFwd  0.32s cubic-bezier(0.4,0,0.2,1); }
    .slide-in-back { animation: slideInBack 0.32s cubic-bezier(0.4,0,0.2,1); }

    div[role="button"]:hover div:nth-child(3) {
      transform: translateY(-4px) !important;
    }
  `],
})
export class MazoCardComponent {
  readonly titulo    = input.required<string>();
  readonly subtitulo = input<string>('');
  readonly tipo      = input.required<'problema' | 'ideal'>();
  readonly slides    = input.required<MazoSlide[]>();

  protected readonly expanded     = signal(false);
  protected readonly wide         = signal(false);
  protected readonly currentIndex = signal(0);
  protected readonly animDir      = signal<'fwd' | 'back'>('fwd');
  protected readonly animKey      = signal(0);

  private readonly platformId = inject(PLATFORM_ID);

  protected readonly currentSlide = computed(
    () => this.slides()[this.currentIndex()] ?? null,
  );
  protected readonly primeraImagen = computed(
    () => this.slides().find((s) => s.imagen)?.imagen ?? null,
  );

  // ── Teclado ──────────────────────────────────────────────────────
  @HostListener('keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (!this.expanded()) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); this.next(); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); this.prev(); }
    if (e.key === 'Escape')     {
      e.preventDefault();
      // Escape cierra primero el wide, luego el visor
      if (this.wide()) { this.setWide(false); }
      else             { this.collapse(); }
    }
  }

  // ── Acciones ─────────────────────────────────────────────────────
  protected expand(): void {
    this.currentIndex.set(0);
    this.expanded.set(true);
  }

  protected collapse(): void {
    this.setWide(false);
    this.expanded.set(false);
  }

  protected setWide(val: boolean): void {
    this.wide.set(val);
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = val ? 'hidden' : '';
    }
  }

  protected next(): void {
    if (this.currentIndex() >= this.slides().length - 1) return;
    this.animDir.set('fwd');
    this.animKey.update((k) => k + 1);
    this.currentIndex.update((i) => i + 1);
  }

  protected prev(): void {
    if (this.currentIndex() <= 0) return;
    this.animDir.set('back');
    this.animKey.update((k) => k + 1);
    this.currentIndex.update((i) => i - 1);
  }

  protected goTo(index: number): void {
    if (index === this.currentIndex()) return;
    this.animDir.set(index > this.currentIndex() ? 'fwd' : 'back');
    this.animKey.update((k) => k + 1);
    this.currentIndex.set(index);
  }
}
