import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { InfoProyecto } from '../models/geodata.model';

const GEODATA_BASE =
  'https://raw.githubusercontent.com/NicolasPlataANI/data_inventario/main/geodata';

@Injectable({ providedIn: 'root' })
export class GeodataService {
  private readonly http = inject(HttpClient);

  getInfoProyecto(projectName: string): Observable<InfoProyecto> {
    const url = `${GEODATA_BASE}/${encodeURIComponent(projectName)}/info_proyecto.json`;
    return this.http
      .get<Record<string, Record<string, unknown>>>(url)
      .pipe(
        map(raw => {
          const g = (key: string): unknown => Object.values(raw[key] ?? {})[0];
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
            // Typo en el JSON: "finaciero" en lugar de "financiero"
            avance_financiero_ejecutado: (g('avance_finaciero_ejecutado') as number) ?? 0,
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
}
