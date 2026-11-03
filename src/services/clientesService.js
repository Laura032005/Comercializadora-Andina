import { api, normalizarPagina } from './api';

const BASE = '/api/clientes';

// HU02: buscar por identificación o por nombre (coincidencia parcial).
export async function listarClientes({ identificacion, nombre, page = 0, size = 20 } = {}) {
  const data = await api.get(BASE, { identificacion, nombre, page, size });
  return normalizarPagina(data, size);
}

export function obtenerCliente(id) {
  return api.get(`${BASE}/${id}`);
}

// HU01
export function crearCliente(cliente) {
  return api.post(BASE, cliente);
}

// HU03: la identificación no se envía porque no se puede modificar.
export function actualizarCliente(id, { telefono, correo, direccion, tipo }) {
  return api.put(`${BASE}/${id}`, { telefono, correo, direccion, tipo });
}

// HU04: historial de pedidos, del más reciente al más antiguo.
export async function historialCliente(id, { desde, hasta } = {}) {
  const data = await api.get(`${BASE}/${id}/pedidos`, { desde, hasta });
  return normalizarPagina(data).items;
}
