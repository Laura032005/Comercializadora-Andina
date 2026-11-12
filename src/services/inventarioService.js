// Módulo Inventario: movimientos, entradas de mercancía, traslados entre bodegas y meta mensual.
import { nombreBodega, stockEn } from './catalogos';
import { USE_MOCK } from './config';
import { http } from './http';
import { esperar, guardar, leer, siguienteId } from './mockDb';

function validarCantidad(valor) {
  const cantidad = Number(valor);
  if (!Number.isInteger(cantidad) || cantidad < 1) throw new Error('La cantidad debe ser un número entero mayor que 0.');
  return cantidad;
}

const mock = {
  async listarMovimientos() {
    await esperar();
    return leer('movimientos').sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id);
  },

  // datos: { productoId, bodegaId, cantidad, proveedor, referencia }
  async registrarEntrada(datos, usuario) {
    await esperar();
    const productos = leer('productos');
    const p = productos.find((x) => x.id === Number(datos.productoId));
    if (!p) throw new Error('Selecciona un producto válido.');
    const cantidad = validarCantidad(datos.cantidad);
    const bodegaId = Number(datos.bodegaId);

    p.existencias[bodegaId] = stockEn(p, bodegaId) + cantidad;
    const movimientos = leer('movimientos');
    const mov = {
      id: siguienteId(movimientos), fecha: new Date().toISOString(), tipo: 'ENTRADA',
      productoId: p.id, productoNombre: p.nombre, bodegaId, bodegaOrigenId: null, cantidad,
      referencia: datos.referencia.trim(), proveedor: datos.proveedor.trim(), usuario: usuario.username,
    };
    guardar('productos', productos);
    guardar('movimientos', [...movimientos, mov]);
    return mov;
  },

  // datos: { productoId, bodegaOrigenId, bodegaId (destino), cantidad, referencia }
  async registrarTraslado(datos, usuario) {
    await esperar();
    const origen = Number(datos.bodegaOrigenId);
    const destino = Number(datos.bodegaId);
    if (origen === destino) throw new Error('La bodega de origen y la de destino deben ser distintas.');
    const productos = leer('productos');
    const p = productos.find((x) => x.id === Number(datos.productoId));
    if (!p) throw new Error('Selecciona un producto válido.');
    const cantidad = validarCantidad(datos.cantidad);
    if (cantidad > stockEn(p, origen)) {
      throw new Error(`Solo hay ${stockEn(p, origen)} unidades de ${p.nombre} en ${nombreBodega(origen)}.`);
    }

    p.existencias[origen] -= cantidad;
    p.existencias[destino] = stockEn(p, destino) + cantidad;
    const movimientos = leer('movimientos');
    const mov = {
      id: siguienteId(movimientos), fecha: new Date().toISOString(), tipo: 'TRASLADO',
      productoId: p.id, productoNombre: p.nombre, bodegaId: destino, bodegaOrigenId: origen, cantidad,
      referencia: datos.referencia.trim(), proveedor: '', usuario: usuario.username,
    };
    guardar('productos', productos);
    guardar('movimientos', [...movimientos, mov]);
    return mov;
  },

  async obtenerMeta() {
    await esperar(100);
    return leer('config').metaMensual;
  },

  async guardarMeta(metaMensual) {
    await esperar();
    guardar('config', { ...leer('config'), metaMensual });
    return metaMensual;
  },
};

const api = {
  listarMovimientos: () => http('/inventario/movimientos'),
  registrarEntrada: (d) =>
    http('/inventario/entradas', {
      method: 'POST',
      body: {
        productoId: Number(d.productoId), bodegaId: Number(d.bodegaId), cantidad: Number(d.cantidad),
        proveedor: d.proveedor.trim(), referencia: d.referencia.trim(),
      },
    }),
  registrarTraslado: (d) =>
    http('/inventario/traslados', {
      method: 'POST',
      body: {
        productoId: Number(d.productoId), bodegaOrigenId: Number(d.bodegaOrigenId), bodegaId: Number(d.bodegaId),
        cantidad: Number(d.cantidad), referencia: d.referencia.trim(),
      },
    }),
  obtenerMeta: async () => (await http('/indicadores/meta')).metaMensual,
  guardarMeta: async (metaMensual) =>
    (await http('/indicadores/meta', { method: 'PUT', body: { metaMensual } })).metaMensual,
};

export default USE_MOCK ? mock : api;
