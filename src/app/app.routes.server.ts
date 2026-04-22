import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Prerender en build: páginas estáticas sin APIs de browser
  { path: '',        renderMode: RenderMode.Prerender },
  { path: 'entrega', renderMode: RenderMode.Prerender },
  // Client-side rendering: ECharts necesita window/canvas, datos desde API externa
  { path: 'georreferenciacion', renderMode: RenderMode.Client },
  { path: 'detalles',           renderMode: RenderMode.Client },
  { path: 'detalles/:id',       renderMode: RenderMode.Client },
  { path: 'geodata/:id',        renderMode: RenderMode.Client },
  { path: '**',                 renderMode: RenderMode.Client },
];
