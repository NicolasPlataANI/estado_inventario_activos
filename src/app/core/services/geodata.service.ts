import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap } from 'rxjs/operators';

import { InfoProyecto } from '../models/geodata.model';

const GEODATA_BASE =
  'https://raw.githubusercontent.com/NicolasPlataANI/data_inventario/main/geodata';

/** Normaliza nombres de proyecto eliminando caracteres invisibles y espacios extra */
function normalizeProjectName(name: string): string {
  return name.replace(/[​‌‍﻿]/g, '').trim();
}


@Injectable({ providedIn: 'root' })
export class GeodataService {
  private readonly http = inject(HttpClient);

  // Caché para evitar peticiones repetidas al API de GitHub
  private layersCache = new Map<string, Observable<string[]>>();
  private foldersCache$: Observable<string[]> | null = null;

  getInfoProyecto(projectName: string): Observable<InfoProyecto> {
    return this.getCorrectFolderPath(projectName).pipe(
      switchMap(folder => {
        const url = `${GEODATA_BASE}/${encodeURIComponent(folder)}/info_proyecto.json`;
        return this.http.get<Record<string, Record<string, unknown>>>(url);
      }),
      map(raw => {
        const normalizedRaw: Record<string, Record<string, unknown>> = {};
        for (const key of Object.keys(raw)) {
          normalizedRaw[normalizeProjectName(key)] = raw[key];
        }

        const g = (key: string): unknown => {
          const data = normalizedRaw[key] ?? (key === 'avance_financiero_ejecutado' ? normalizedRaw['avance_finaciero_ejecutado'] : undefined);
          return data ? Object.values(data)[0] : undefined;
        };

        return {
          project_id:                  (g('project_id') as number)  ?? 0,
          nombre:                      (g('nombre') as string)       ?? projectName,
          nit:                         (g('nit') as number)          ?? 0,
          entidad:                     (g('entidad') as string)      ?? 'ANI',
          modo:                        (g('modo') as string)         ?? '',
          etapa:                       (g('etapa') as string)        ?? '',
          longitud:                    (g('longitud') as string)     ?? '0',
          avance_fisico_planeado:      (g('avance_fisico_planeado') as number)     ?? 0,
          avance_fisico_ejecutado:     (g('avance_fisico_ejecutado') as number)    ?? 0,
          avance_financiero_planeado:  (g('avance_financiero_planeado') as number) ?? 0,
          avance_financiero_ejecutado: (g('avance_financiero_ejecutado') as number) ?? 0,
          empleos_generados:           (g('empleos_generados') as number)          ?? 0,
          habitantes_beneficiados:     (g('habitantes_beneficiados') as number)    ?? 0,
          fecha_avance:                (g('fecha_avance') as string)               ?? '',
        } satisfies InfoProyecto;
      }),
      catchError(() =>
        of({
          project_id: 0, nombre: projectName, nit: 0, entidad: 'ANI',
          modo: '', etapa: '', longitud: '0',
          avance_fisico_planeado: 0, avance_fisico_ejecutado: 0,
          avance_financiero_planeado: 0, avance_financiero_ejecutado: 0,
          empleos_generados: 0, habitantes_beneficiados: 0, fecha_avance: '',
        } satisfies InfoProyecto),
      ),
    );
  }

  private getGeodataFolders(): Observable<string[]> {
    if (this.foldersCache$) return this.foldersCache$;

    this.foldersCache$ = this.http.get<any[]>('https://api.github.com/repos/NicolasPlataANI/data_inventario/contents/geodata').pipe(
      map(items => Array.isArray(items) ? items.filter(i => i.type === 'dir').map(i => i.name) : []),
      catchError(() => of([])),
      shareReplay(1)
    );
    return this.foldersCache$;
  }

  private getCorrectFolderPath(projectName: string): Observable<string> {
    const normalized = normalizeProjectName(projectName);
    
    return this.getGeodataFolders().pipe(
      map(folders => {
        if (!folders || folders.length === 0) return normalized;

        const exact = folders.find(f => f.toLowerCase() === normalized.toLowerCase());
        if (exact) return exact;

        const searchName = normalized.replace(/^IP\s*-\s*/i, '').toLowerCase();
        const partial = folders.find(f => {
          const fLow = f.toLowerCase();
          return fLow.includes(searchName) || searchName.includes(fLow);
        });
        if (partial) return partial;

        return normalized;
      })
    );
  }

  getCapasDisponibles(projectName: string): Observable<string[]> {
    if (this.layersCache.has(projectName)) {
      return this.layersCache.get(projectName)!;
    }

    const obs = this.getCorrectFolderPath(projectName).pipe(
      switchMap(folder => {
        const url = `https://api.github.com/repos/NicolasPlataANI/data_inventario/contents/geodata/${encodeURIComponent(folder)}`;
        return this.http.get<any[]>(url).pipe(
          map(files => 
            Array.isArray(files) 
              ? files.filter(f => f.name.endsWith('.fgb') || f.name.endsWith('.fdb')).map(f => f.name)
              : []
          ),
          catchError((err) => {
            console.warn(`GitHub API error (status ${err.status}) for ${projectName}`);
            return of([]);
          })
        );
      }),
      shareReplay(1)
    );

    this.layersCache.set(projectName, obs);
    return obs;
  }

  async getGeometriasPorArchivo(projectName: string, fileName: string): Promise<any[]> {
    const folder = await firstValueFrom(this.getCorrectFolderPath(projectName));
    const url = `${GEODATA_BASE}/${encodeURIComponent(folder)}/${fileName}`;
    
    try {
      const { geojson } = await import('flatgeobuf');
      const response = await fetch(url);
      if (!response.ok) return [];

      const features: any[] = [];
      const iterador = geojson.deserialize(response.body!);
      for await (const feature of iterador) {
        features.push(feature);
      }
      return features;
    } catch (error) {
      console.error(`Error descargando archivo ${fileName}:`, error);
      return [];
    }
  }

  async getGeometrias(projectName: string, layerKey: string): Promise<any[]> {
    return this.getGeometriasPorArchivo(projectName, `${layerKey}.fgb`);
  }
}
