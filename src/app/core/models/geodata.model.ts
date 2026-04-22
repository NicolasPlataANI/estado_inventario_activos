export interface InfoProyecto {
  project_id: number;
  nombre: string;
  nit: number;
  entidad: string;
  modo: string;
  etapa: string;
  longitud: string;
  avance_fisico_planeado: number;
  avance_fisico_ejecutado: number;
  avance_financiero_planeado: number;
  avance_financiero_ejecutado: number;
  empleos_generados: number;
  habitantes_beneficiados: number;
  fecha_avance: string;
}

export interface ElementoGeodata {
  key: string;
  label: string;
  color: string;
  count: number;
  available: boolean;
}

/** Paleta de alto contraste para capas sobre mapa (igual que reference component) */
export const ELEMENTOS_GEODATA: ReadonlyArray<{ key: string; label: string; color: string }> = [
  { key: 'berma',           label: 'Berma',                color: '#FFD700' },
  { key: 'calzada',         label: 'Calzada',              color: '#FF5733' },
  { key: 'cco',             label: 'CCO',                  color: '#FF00FF' },
  { key: 'ciclorruta',      label: 'Ciclorruta',           color: '#00FF00' },
  { key: 'cuneta',          label: 'Cuneta',               color: '#00FFFF' },
  { key: 'defensa_vial',    label: 'Defensa Vial',         color: '#FF1493' },
  { key: 'dispositivo_its', label: 'Dispositivo ITS',      color: '#9400D3' },
  { key: 'estacion_peaje',  label: 'Estación de Peaje',    color: '#FFFF00' },
  { key: 'estacion_pesaje', label: 'Estación de Pesaje',   color: '#FF4500' },
  { key: 'luminarias',      label: 'Luminarias',           color: '#7FFF00' },
  { key: 'muro',            label: 'Muro',                 color: '#8A2BE2' },
  { key: 'puente',          label: 'Puente',               color: '#DC143C' },
  { key: 'senal_vertical',  label: 'Señal Vertical',       color: '#1E90FF' },
  { key: 'separador',       label: 'Separador',            color: '#32CD32' },
  { key: 'tunel',           label: 'Túnel',                color: '#FF69B4' },
  { key: 'zona_servicio',   label: 'Zona de Servicio',     color: '#FFA500' },
] as const;
