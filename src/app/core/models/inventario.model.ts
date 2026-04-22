export type EstadoElemento = 'Entregado' | 'Parcialmente Entregado' | 'Pendiente' | 'No Aplica';

export const ELEMENTOS_VIALES = [
  'Calzada',
  'Berma',
  'Separador',
  'Cunetas',
  'Puentes',
  'Drenajes',
  'Defensas Viales',
  'Peajes',
  'Estación de Pesaje',
  'CCO',
  'ITS',
  'Predios',
  'Túneles',
  'Luminarias',
  'Señales',
  'Muros',
  'Zona de Servicio',
  'Ciclorruta',
  'Taludes',
] as const;

export type NombreElemento = (typeof ELEMENTOS_VIALES)[number];

export interface ElementoVial {
  nombre: NombreElemento;
  estado: EstadoElemento | null;
}

export interface Proyecto {
  id: string;
  nombre: string;
  responsable: string;
  elementos: ElementoVial[];
  observaciones: string | null;
  puntosCriticos: string | null;
  fechaCompromisoConcesiones: string | null;
}

/** Formato columnar crudo que devuelve el JSON de GitHub */
export type RawInventarioJson = Record<string, Record<string, string | null>>;

/** Conteo de estados para gráficas */
export interface ResumenEstados {
  entregado: number;
  parcialmenteEntregado: number;
  pendiente: number;
  noAplica: number;
  total: number;
}
