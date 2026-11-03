import { api, normalizarPagina } from './api';

const BASE = '/api/productos';
export const TAMANO_PAGINA = 20;

// HU06: búsqueda por nombre o código, filtro por categoría, paginación de 20.
export async function listarProductos({ busqueda, categoria, activo, page = 0, size = TAMANO_PAGINA } = {}) {
  const data = await api.get(BASE, { busqueda, categoria, activo, page, size });
  return normalizarPagina(data, size);
}

export function obtenerProducto(id) {
  return api.get(`${BASE}/${id}`);
}

export async function listarCategorias() {
  const data = await api.get(`${BASE}/categorias`);
  return Array.isArray(data) ? data : [];
}

// HU05
export function crearProducto(producto) {
  return api.post(BASE, producto);
}

// HU07: el código no se envía porque no se puede modificar.
export function actualizarProducto(id, { nombre, categoria, precio, stockMinimo }) {
  return api.put(`${BASE}/${id}`, { nombre, categoria, precio, stockMinimo });
}

// HU09
export function cambiarEstadoProducto(id, activo) {
  return api.patch(`${BASE}/${id}/estado`, { activo });
}

// HU21: productos con stock menor o igual al mínimo.
export async function productosBajoStock() {
  const data = await api.get(`${BASE}/bajo-stock`);
  return normalizarPagina(data).items;
}
