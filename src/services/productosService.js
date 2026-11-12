// Módulo Productos. Las existencias NO se editan aquí: cambian con Entradas, Traslados,
// Ventas y Anulaciones, para que el inventario siempre cuadre con lo vendido.
import { BODEGAS } from './catalogos';
import { USE_MOCK } from './config';
import { http } from './http';
import { esperar, guardar, leer, siguienteId } from './mockDb';

function limpiar(datos) {
  return {
    codigo: datos.codigo.trim().toUpperCase(),
    nombre: datos.nombre.trim(),
    categoria: datos.categoria.trim(),
    unidad: datos.unidad,
    precio: Number(datos.precio),
    stockMinimo: Number(datos.stockMinimo),
  };
}

const mock = {
  async listar() {
    await esperar();
    return leer('productos');
  },
  async crear(datos) {
    await esperar();
    const lista = leer('productos');
    const p = limpiar(datos);
    if (lista.some((x) => x.codigo === p.codigo)) throw new Error(`Ya existe un producto con el código ${p.codigo}.`);
    const existencias = Object.fromEntries(BODEGAS.map((b) => [b.id, 0]));
    const nuevo = { id: siguienteId(lista), ...p, existencias, activo: true };
    guardar('productos', [...lista, nuevo]);
    return nuevo;
  },
  async actualizar(id, datos) {
    await esperar();
    const lista = leer('productos');
    const p = limpiar(datos);
    if (lista.some((x) => x.codigo === p.codigo && x.id !== id)) {
      throw new Error(`Ya existe un producto con el código ${p.codigo}.`);
    }
    const actual = lista.find((x) => x.id === id);
    if (!actual) throw new Error('El producto no existe.');
    Object.assign(actual, p);
    guardar('productos', lista);
    return actual;
  },
  async cambiarEstado(id, activo) {
    await esperar();
    const lista = leer('productos');
    const actual = lista.find((x) => x.id === id);
    if (!actual) throw new Error('El producto no existe.');
    actual.activo = activo;
    guardar('productos', lista);
    return actual;
  },
};

const api = {
  listar: () => http('/productos'),
  crear: (datos) => http('/productos', { method: 'POST', body: limpiar(datos) }),
  actualizar: (id, datos) => http(`/productos/${id}`, { method: 'PUT', body: limpiar(datos) }),
  cambiarEstado: (id, activo) => http(`/productos/${id}/estado`, { method: 'PATCH', body: { activo } }),
};

export default USE_MOCK ? mock : api;
