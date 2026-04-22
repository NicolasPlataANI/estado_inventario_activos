import type { EChartsOption } from 'echarts';

/**
 * Opciones base para todos los charts del sistema.
 * Aplica las reglas de DESIGN.md: sin bordes, fondo transparente,
 * tipografía Inter, paleta "Civic Luminary".
 *
 * Uso: { ...echartsBase(), series: [...] }
 */
export function echartsBase(): Partial<EChartsOption> {
  return {
    backgroundColor: 'transparent',
    textStyle: {
      fontFamily: 'Inter, sans-serif',
      color: '#1f1b16',
    },
    grid: {
      containLabel: true,
      borderWidth: 0,
    },
    legend: {
      show: false, // cada chart gestiona su propia leyenda visual
    },
  };
}

/** Tooltip estándar con estética crema */
export const tooltipBase = {
  backgroundColor: '#fff8f4',
  borderWidth: 0,
  textStyle: { fontFamily: 'Inter, sans-serif', color: '#1f1b16', fontSize: 12 },
  extraCssText: 'box-shadow: 0 8px 24px rgba(31,27,22,0.08); border-radius: 8px;',
} as const;

/**
 * Paleta semántica de estados — nomenclatura estándar tipo semáforo.
 * Verde → Entregado · Amarillo → Parcial · Rojo → Pendiente · Gris → N/A
 */
export const ESTADO_COLORS = {
  entregado:             '#16a34a',   // green-600
  parcialmenteEntregado: '#d97706',   // amber-600
  pendiente:             '#dc2626',   // red-600
  noAplica:              '#9ca3af',   // gray-400
} as const;
