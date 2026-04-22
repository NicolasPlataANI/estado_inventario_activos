import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { makeStateKey, TransferState } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

import {
  ELEMENTOS_VIALES,
  EstadoElemento,
  NombreElemento,
  Proyecto,
  RawInventarioJson,
  ResumenEstados,
} from '../models/inventario.model';

const INVENTARIO_KEY = makeStateKey<Proyecto[]>('inventario');

const RAW_URL =
  'https://raw.githubusercontent.com/NicolasPlataANI/data_inventario/main/inventario.json';

/** Las claves del JSON contienen zero-width spaces (U+200B); esta función los elimina. */
function normalizeKey(key: string): string {
  return key.replace(/[​‌‍﻿]/g, '').trim();
}

function toEstado(value: string | null): EstadoElemento | null {
  if (!value) return null;
  const v = value.trim();
  if (v === 'Entregado') return 'Entregado';
  if (v === 'Parcialmente Entregado') return 'Parcialmente Entregado';
  if (v === 'Pendiente') return 'Pendiente';
  if (v === 'No Aplica') return 'No Aplica';
  return null;
}

function parseRaw(raw: RawInventarioJson): Proyecto[] {
  const normalized: Record<string, Record<string, string | null>> = {};
  for (const key of Object.keys(raw)) {
    normalized[normalizeKey(key)] = raw[key];
  }

  const indices = Object.keys(normalized['Proyecto'] ?? {});

  return indices.map((i) => {
    const elementos = ELEMENTOS_VIALES.map((nombre: NombreElemento) => ({
      nombre,
      estado: toEstado(normalized[nombre]?.[i] ?? null),
    }));

    return {
      id: i,
      nombre: normalized['Proyecto'][i] ?? '',
      responsable: normalized['Responsable']?.[i] ?? '',
      elementos,
      observaciones: normalized['Observaciones']?.[i] ?? null,
      puntosCriticos: normalized['Puntos Críticos']?.[i] ?? null,
      fechaCompromisoConcesiones:
        normalized['Fecha de Compromiso Concesiones']?.[i] ?? null,
    } satisfies Proyecto;
  });
}

@Injectable({ providedIn: 'root' })
export class InventarioService {
  private readonly http = inject(HttpClient);
  private readonly transferState = inject(TransferState);
  private readonly platformId = inject(PLATFORM_ID);

  private cache$: Observable<Proyecto[]> | null = null;

  getInventario(): Observable<Proyecto[]> {
    if (this.cache$) return this.cache$;

    // En el cliente: si el servidor ya transfirió los datos, usarlos directamente.
    if (isPlatformBrowser(this.platformId) && this.transferState.hasKey(INVENTARIO_KEY)) {
      const stored = this.transferState.get<Proyecto[]>(INVENTARIO_KEY, []);
      this.transferState.remove(INVENTARIO_KEY);
      this.cache$ = of(stored);
      return this.cache$;
    }

    this.cache$ = this.http.get<RawInventarioJson>(RAW_URL).pipe(
      map(parseRaw),
      tap((data) => {
        // En el servidor: guardar en TransferState para hidratar el cliente.
        if (isPlatformServer(this.platformId)) {
          this.transferState.set(INVENTARIO_KEY, data);
        }
      }),
      shareReplay(1),
    );

    return this.cache$;
  }

  /** Calcula totales de estados sobre todos los proyectos */
  calcularResumen(proyectos: Proyecto[]): ResumenEstados {
    let entregado = 0;
    let parcialmenteEntregado = 0;
    let pendiente = 0;
    let noAplica = 0;
    let total = 0;

    for (const p of proyectos) {
      for (const el of p.elementos) {
        if (el.estado === null) continue;
        total++;
        if (el.estado === 'Entregado') entregado++;
        else if (el.estado === 'Parcialmente Entregado') parcialmenteEntregado++;
        else if (el.estado === 'Pendiente') pendiente++;
        else if (el.estado === 'No Aplica') noAplica++;
      }
    }

    return { entregado, parcialmenteEntregado, pendiente, noAplica, total };
  }

  /** Calcula resumen de estados para un único proyecto */
  calcularResumenProyecto(proyecto: Proyecto): ResumenEstados {
    return this.calcularResumen([proyecto]);
  }
}
