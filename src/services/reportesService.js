import { api } from './api';

const BASE = '/api/reportes';

// HU19: total vendido y número de pedidos de un día.
export function ventasDelDia(fecha) {
  return api.get(`${BASE}/ventas-dia`, { fecha });
}

// HU20: top de productos más vendidos en un rango de fechas.
export async function productosMasVendidos({ desde, hasta, limite = 10 }) {
  const data = await api.get(`${BASE}/mas-vendidos`, { desde, hasta, limite });
  return Array.isArray(data) ? data : data?.content ?? [];
}
