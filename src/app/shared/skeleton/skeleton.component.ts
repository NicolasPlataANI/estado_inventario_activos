import { Component, input } from '@angular/core';

/**
 * Bloque de skeleton reutilizable con animate-pulse.
 * Uso: <app-skeleton height="h-10" [rounded]="true" />
 */
@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    <div
      class="animate-pulse"
      [class]="height() + ' ' + (rounded() ? 'rounded-xl' : 'rounded-lg')"
      style="background: var(--color-surface-container)"
      aria-hidden="true"
    ></div>
  `,
})
export class SkeletonComponent {
  readonly height  = input('h-8');
  readonly rounded = input(true);
}
