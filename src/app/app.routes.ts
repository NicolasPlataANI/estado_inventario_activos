import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./views/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'entrega',
    loadComponent: () =>
      import('./views/entrega/entrega.component').then((m) => m.EntregaComponent),
  },
  {
    path: 'georreferenciacion',
    loadComponent: () =>
      import('./views/georreferenciacion/georreferenciacion.component').then(
        (m) => m.GeorreferenciacionComponent,
      ),
  },
  {
    path: 'detalles',
    loadComponent: () =>
      import('./views/detalles/detalles.component').then((m) => m.DetallesComponent),
  },
  {
    path: 'detalles/:id',
    loadComponent: () =>
      import('./views/proyecto/proyecto.component').then((m) => m.ProyectoComponent),
  },
  {
    path: 'geodata/:id',
    loadComponent: () =>
      import('./views/geodata/geodata.component').then((m) => m.GeodataComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
