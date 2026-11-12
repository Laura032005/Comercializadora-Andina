// Módulo Ventas: registra la venta, descuenta inventario de la bodega y genera la factura
// en una sola operación (lo que antes eran el cuaderno, el Excel y el programa contable).
import { esPedido, SIGUIENTE_ESTADO, stockEn, nombreBodega } from './catalogos';
import { IVA, USE_MOCK } from './config';
import { http, query } from './http';
import { esperar, guardar, leer, siguienteId } from './mockDb';

const mock = {
  // filtros: { vendedor, clienteId }
  async listar({ vendedor, clienteId } = {}) {
    await esperar();
    return leer('ventas')
      .filter((v) => !vendedor || v.vendedor === vendedor)
      .filter((v) => !clienteId || v.clienteId === Number(clienteId))
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  },

  async obtener(id) {
    await esperar();
    const v = leer('ventas').find((x) => x.id === Number(id));
    if (!v) throw new Error('La venta no existe.');
    return v;
  },

  // datos: { clienteId, canal, bodegaId, direccionEntrega, observaciones, items: [{ productoId, cantidad }] }
  async registrar(datos, usuario) {
    await esperar(400);
    const productos = leer('productos');
    const cliente = leer('clientes').find((c) => c.id === Number(datos.clienteId));
    if (!cliente) throw new Error('Selecciona un cliente válido.');
    if (!datos.items?.length) throw new Error('Agrega al menos un producto.');
    const bodegaId = Number(datos.bodegaId);

    const items = datos.items.map(({ productoId, cantidad }) => {
      const p = productos.find((x) => x.id === productoId);
      if (!p || !p.activo) throw new Error('Uno de los productos ya no está disponible.');
      if (!Number.isInteger(cantidad) || cantidad < 1) throw new Error(`Cantidad inválida para ${p.nombre}.`);
      const disponible = stockEn(p, bodegaId);
      if (cantidad > disponible) {
        throw new Error(`Stock insuficiente de ${p.nombre} en ${nombreBodega(bodegaId)} (disponible: ${disponible}).`);
      }
      return {
        productoId: p.id, codigo: p.codigo, nombre: p.nombre, unidad: p.unidad,
        cantidad, precioUnitario: p.precio, subtotal: cantidad * p.precio,
      };
    });

    const ventas = leer('ventas');
    const movimientos = leer('movimientos');
    const id = siguienteId(ventas);
    const numero = `V-${String(id).padStart(5, '0')}`;
    const fecha = new Date().toISOString();
    const subtotal = items.reduce((s, it) => s + it.subtotal, 0);
    const iva = Math.round(subtotal * IVA);

    items.forEach((it) => {
      productos.find((p) => p.id === it.productoId).existencias[bodegaId] -= it.cantidad;
      movimientos.push({
        id: siguienteId(movimientos), fecha, tipo: 'SALIDA', bodegaId, bodegaOrigenId: null,
        productoId: it.productoId, productoNombre: it.nombre, cantidad: it.cantidad,
        referencia: `Venta ${numero}`, proveedor: '', usuario: usuario.username,
      });
    });

    const venta = {
      id, numero, fecha, canal: datos.canal,
      clienteId: cliente.id, clienteNombre: cliente.nombre, clienteDocumento: cliente.documento,
      clienteTipo: cliente.tipo, direccionEntrega: (datos.direccionEntrega || cliente.direccion).trim(),
      vendedor: usuario.username, vendedorNombre: usuario.nombre,
      bodegaId, observaciones: (datos.observaciones || '').trim(),
      items, subtotal, iva, total: subtotal + iva,
      estado: 'REGISTRADA',
      estadoDespacho: esPedido(datos.canal) ? 'PENDIENTE' : 'ENTREGADO',
      factura: { numero: `FE-${String(id).padStart(5, '0')}`, fecha },
    };
    guardar('productos', productos);
    guardar('movimientos', movimientos);
    guardar('ventas', [...ventas, venta]);
    return venta;
  },

  // Anula la venta y su factura, y devuelve las unidades a la bodega.
  async anular(id, motivo, usuario) {
    await esperar();
    const ventas = leer('ventas');
    const v = ventas.find((x) => x.id === Number(id));
    if (!v) throw new Error('La venta no existe.');
    if (v.estado === 'ANULADA') throw new Error('La venta ya está anulada.');
    if (['DESPACHADO', 'ENTREGADO'].includes(v.estadoDespacho) && esPedido(v.canal)) {
      throw new Error('No se puede anular un pedido que ya salió de bodega.');
    }

    const productos = leer('productos');
    const movimientos = leer('movimientos');
    const fecha = new Date().toISOString();
    v.items.forEach((it) => {
      const p = productos.find((x) => x.id === it.productoId);
      if (p) p.existencias[v.bodegaId] = (p.existencias[v.bodegaId] || 0) + it.cantidad;
      movimientos.push({
        id: siguienteId(movimientos), fecha, tipo: 'ANULACION', bodegaId: v.bodegaId, bodegaOrigenId: null,
        productoId: it.productoId, productoNombre: it.nombre, cantidad: it.cantidad,
        referencia: `Anulación ${v.numero}`, proveedor: '', usuario: usuario.username,
      });
    });
    v.estado = 'ANULADA';
    v.anulacion = { fecha, motivo: motivo.trim(), usuario: usuario.username };
    guardar('productos', productos);
    guardar('movimientos', movimientos);
    guardar('ventas', ventas);
    return v;
  },

  // Avanza el pedido un paso: PENDIENTE → PREPARADO → DESPACHADO → ENTREGADO.
  async avanzarDespacho(id) {
    await esperar();
    const ventas = leer('ventas');
    const v = ventas.find((x) => x.id === Number(id));
    if (!v) throw new Error('El pedido no existe.');
    if (v.estado === 'ANULADA') throw new Error('El pedido está anulado.');
    const siguiente = SIGUIENTE_ESTADO[v.estadoDespacho];
    if (!siguiente) throw new Error('El pedido ya fue entregado.');
    v.estadoDespacho = siguiente;
    v.historialDespacho = [...(v.historialDespacho ?? []), { estado: siguiente, fecha: new Date().toISOString() }];
    guardar('ventas', ventas);
    return v;
  },
};

const api = {
  listar: (filtros = {}) => http(`/ventas${query(filtros)}`),
  obtener: (id) => http(`/ventas/${id}`),
  registrar: (datos) => http('/ventas', { method: 'POST', body: datos }),
  anular: (id, motivo) => http(`/ventas/${id}/anular`, { method: 'POST', body: { motivo } }),
  avanzarDespacho: (id) => http(`/ventas/${id}/despacho/avanzar`, { method: 'POST' }),
};

export default USE_MOCK ? mock : api;
