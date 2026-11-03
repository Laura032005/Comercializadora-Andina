import { api, normalizarPagina } from './api';

const BASE = '/api/pedidos';

export const ESTADOS_PEDIDO = {
  BORRADOR: 'BORRADOR',
  CONFIRMADO: 'CONFIRMADO',
  DESPACHADO: 'DESPACHADO',
  ENTREGADO: 'ENTREGADO',
};

// HU15: buscar por número de pedido o por cliente.
export async function listarPedidos({ numero, cliente, estado, page = 0, size = 20 } = {}) {
  const data = await api.get(BASE, { numero, cliente, estado, page, size });
  return normalizarPagina(data, size);
}

export function obtenerPedido(id) {
  return api.get(`${BASE}/${id}`);
}

function itemsParaApi(items) {
  return items.map((i) => ({ productoId: i.productoId, cantidad: Number(i.cantidad) }));
}

// HU10 / HU11: crea el pedido en estado Borrador.
export function crearPedido({ clienteId, items }) {
  return api.post(BASE, { clienteId, items: itemsParaApi(items) });
}

export function actualizarPedido(id, { clienteId, items }) {
  return api.put(`${BASE}/${id}`, { clienteId, items: itemsParaApi(items) });
}

// HU12 / HU14 / HU16: el back valida stock, confirma y descuenta inventario.
export function confirmarPedido(id) {
  return api.post(`${BASE}/${id}/confirmar`);
}

// HU15: bodega marca el pedido como Despachado (o Entregado).
export function cambiarEstadoPedido(id, estado) {
  return api.patch(`${BASE}/${id}/estado`, { estado });
}
