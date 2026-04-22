import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavLink {
  label: string;
  path: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="glass-nav sticky top-0 z-50">
      <nav class="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">

        <!-- Logo -->
        <a routerLink="/" class="flex items-center gap-3 shrink-0">
          <img
            src="logoani.svg"
            alt="ANI — Agencia Nacional de Infraestructura"
            class="h-8 w-auto"
          />
        </a>

        <!-- Links desktop -->
        <ul class="hidden md:flex items-center gap-1 list-none m-0 p-0">
          @for (link of links; track link.path) {
            <li>
              <a
                [routerLink]="link.path"
                routerLinkActive="nav-link-active"
                [routerLinkActiveOptions]="{ exact: link.path === '/' }"
                class="nav-link"
              >
                {{ link.label }}
              </a>
            </li>
          }
        </ul>

        <!-- Mobile: menú hamburguesa -->
        <button
          class="md:hidden flex flex-col gap-1.5 p-2"
          (click)="toggleMobile()"
          aria-label="Abrir menú"
        >
          <span class="block w-5 h-0.5 bg-[var(--color-on-surface)]"></span>
          <span class="block w-5 h-0.5 bg-[var(--color-on-surface)]"></span>
          <span class="block w-5 h-0.5 bg-[var(--color-on-surface)]"></span>
        </button>

      </nav>

      <!-- Mobile drawer -->
      @if (mobileOpen) {
        <div class="md:hidden bg-[var(--color-surface-low)] px-6 pb-4">
          <ul class="flex flex-col gap-1 list-none m-0 p-0">
            @for (link of links; track link.path) {
              <li>
                <a
                  [routerLink]="link.path"
                  routerLinkActive="nav-link-active"
                  [routerLinkActiveOptions]="{ exact: link.path === '/' }"
                  class="nav-link block py-2"
                  (click)="mobileOpen = false"
                >
                  {{ link.label }}
                </a>
              </li>
            }
          </ul>
        </div>
      }
    </header>
  `,
  styles: [`
    .nav-link {
      font-family: 'Inter', sans-serif;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-on-surface);
      text-decoration: none;
      padding: 0.375rem 0.875rem;
      border-radius: 9999px;
      transition: background 0.2s ease, color 0.2s ease;
      opacity: 0.75;
    }
    .nav-link:hover {
      background: rgba(160, 65, 0, 0.08);
      opacity: 1;
    }
    .nav-link-active {
      background: rgba(160, 65, 0, 0.12);
      color: var(--color-primary);
      opacity: 1;
    }
  `],
})
export class NavbarComponent {
  protected mobileOpen = false;

  protected readonly links: NavLink[] = [
    { label: 'Inicio', path: '/' },
    { label: 'Entrega de Información', path: '/entrega' },
    { label: 'Georreferenciación', path: '/georreferenciacion' },
    { label: 'Detalles de Activos', path: '/detalles' },
  ];

  protected toggleMobile(): void {
    this.mobileOpen = !this.mobileOpen;
  }
}
