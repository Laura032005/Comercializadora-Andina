// Datos de prueba para el modo mock (ferretería y construcción).
// Se generan una sola vez y quedan en localStorage.
import { IVA } from './config';

const DIA = 24 * 60 * 60 * 1000;

// Generador pseudoaleatorio con semilla fija: los datos salen iguales en todos los equipos.
function aleatorio(semilla) {
  let a = semilla;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const USUARIOS = [
  { id: 1, username: 'admin', password: 'admin123', nombre: 'Administrador del sistema', rol: 'ADMIN', activo: true },
  { id: 2, username: 'vendedor', password: 'vendedor123', nombre: 'Vendedor de mostrador', rol: 'VENDEDOR', activo: true },
  { id: 3, username: 'bodega', password: 'bodega123', nombre: 'Encargado de bodega', rol: 'BODEGA', activo: true },
  { id: 4, username: 'gerente', password: 'gerente123', nombre: 'Gerente general', rol: 'GERENTE', activo: true },
  { id: 5, username: 'mayoristas', password: 'vendedor123', nombre: 'Vendedor de mayoristas', rol: 'VENDEDOR', activo: true },
  { id: 6, username: 'contador', password: 'contador123', nombre: 'Área contable', rol: 'CONTADOR', activo: true },
];

// [código, nombre, categoría, unidad, precio sin IVA, stock mínimo, stock final B1, stock final B2]
const PRODUCTOS = [
  ['FE-001', 'Cemento gris 50 kg', 'Obra negra', 'bulto', 32000, 40, 120, 200],
  ['FE-002', 'Varilla corrugada 3/8" x 6 m', 'Obra negra', 'und', 18500, 50, 150, 300],
  ['FE-003', 'Bloque de arcilla N.º 5', 'Obra negra', 'und', 2300, 300, 900, 1500],
  ['FE-004', 'Tubo PVC sanitario 4" x 3 m', 'Plomería', 'und', 58000, 10, 6, 2],
  ['FE-005', 'Codo PVC presión 1/2"', 'Plomería', 'und', 900, 100, 400, 250],
  ['FE-006', 'Llave de paso 1/2"', 'Plomería', 'und', 21000, 10, 25, 10],
  ['FE-007', 'Pintura vinilo blanco (galón)', 'Pinturas', 'galón', 62000, 15, 30, 20],
  ['FE-008', 'Rodillo de felpa 9"', 'Pinturas', 'und', 14500, 10, 0, 0],
  ['FE-009', 'Tornillo drywall 6 x 1" (caja x100)', 'Tornillería', 'caja', 9800, 20, 60, 35],
  ['FE-010', 'Puntilla con cabeza 2"', 'Tornillería', 'libra', 5200, 30, 18, 4],
  ['FE-011', 'Cable eléctrico THHN N.º 12 (rollo 100 m)', 'Eléctricos', 'rollo', 245000, 5, 9, 6],
  ['FE-012', 'Interruptor sencillo', 'Eléctricos', 'und', 7500, 20, 80, 40],
  ['FE-013', 'Taladro percutor 1/2" 650 W', 'Herramientas', 'und', 289000, 3, 4, 2],
  ['FE-014', 'Martillo de uña 16 oz', 'Herramientas', 'und', 32000, 5, 14, 6],
  ['FE-015', 'Pala punta cuadrada', 'Herramientas', 'und', 41000, 5, 12, 8],
].map(([codigo, nombre, categoria, unidad, precio, stockMinimo, b1, b2], i) => ({
  id: i + 1, codigo, nombre, categoria, unidad, precio, stockMinimo, final: { 1: b1, 2: b2 }, activo: true,
}));

const CLIENTES = [
  { id: 1, tipo: 'FINAL', documento: '222222222222', nombre: 'Consumidor final', telefono: '', email: '', direccion: 'Venta en mostrador' },
  { id: 2, tipo: 'FINAL', documento: '1000000001', nombre: 'Cliente de prueba Uno', telefono: '3000000010', email: '', direccion: 'Calle 1 # 1-01, Bogotá' },
  { id: 3, tipo: 'MAYORISTA', documento: '900000001', nombre: 'Constructora Horizonte S.A.S.', telefono: '3000000001', email: 'compras@horizonte.ejemplo.com', direccion: 'Obra Torres del Parque, Calle 80 # 20-10, Bogotá' },
  { id: 4, tipo: 'MAYORISTA', documento: '900000002', nombre: 'Ferretería El Tornillo', telefono: '3000000002', email: 'pedidos@eltornillo.ejemplo.com', direccion: 'Carrera 30 # 45-12, Bogotá' },
  { id: 5, tipo: 'MAYORISTA', documento: '900000003', nombre: 'Obras y Acabados Ltda.', telefono: '3000000003', email: 'obras@acabados.ejemplo.com', direccion: 'Avenida Boyacá # 60-30, Bogotá' },
  { id: 6, tipo: 'MAYORISTA', documento: '900000004', nombre: 'Ferretería San Cristóbal', telefono: '3000000004', email: '', direccion: 'Calle 22 Sur # 5-40, Bogotá' },
];

export function generarDatosIniciales() {
  const rnd = aleatorio(2024);
  const entero = (min, max) => min + Math.floor(rnd() * (max - min + 1));
  const elegir = (lista) => lista[entero(0, lista.length - 1)];
  const ahora = Date.now();
  const vendedorMostrador = USUARIOS[1];
  const vendedorMayoristas = USUARIOS[4];

  // 1. Ventas y pedidos de los últimos ~75 días.
  const ventas = [];
  const vendidos = {}; // `${productoId}-${bodegaId}` -> unidades vendidas (sin anuladas)
  const TOTAL = 60;
  for (let n = 0; n < TOTAL; n++) {
    const id = n + 1;
    const diasAtras = Math.max(0, Math.round(((TOTAL - n) / TOTAL) * 75 - rnd() * 2));
    const fecha = new Date(ahora - diasAtras * DIA - entero(1, 8) * 3600 * 1000);
    const mayorista = rnd() < 0.45;
    const cliente = mayorista ? elegir(CLIENTES.filter((c) => c.tipo === 'MAYORISTA')) : elegir(CLIENTES.filter((c) => c.tipo === 'FINAL'));
    const canal = mayorista ? (rnd() < 0.6 ? 'WHATSAPP' : 'TELEFONO') : 'MOSTRADOR';
    const vendedor = mayorista ? vendedorMayoristas : vendedorMostrador;
    const bodegaId = canal === 'MOSTRADOR' ? 1 : entero(1, 2);

    const usados = new Set();
    const items = [];
    const cantItems = entero(1, mayorista ? 5 : 3);
    while (items.length < cantItems) {
      const p = elegir(PRODUCTOS);
      if (usados.has(p.id)) continue;
      usados.add(p.id);
      const barato = p.precio < 10000;
      const cantidad = mayorista ? entero(barato ? 20 : 2, barato ? 120 : 15) : entero(1, barato ? 20 : 3);
      items.push({
        productoId: p.id, codigo: p.codigo, nombre: p.nombre, unidad: p.unidad,
        cantidad, precioUnitario: p.precio, subtotal: cantidad * p.precio,
      });
    }

    const subtotal = items.reduce((s, it) => s + it.subtotal, 0);
    const iva = Math.round(subtotal * IVA);
    const anulada = n === 17 || n === 41;
    const edadDias = (ahora - fecha.getTime()) / DIA;
    let estadoDespacho = 'ENTREGADO';
    if (canal !== 'MOSTRADOR') {
      if (edadDias < 1.5) estadoDespacho = 'PENDIENTE';
      else if (edadDias < 3) estadoDespacho = 'PREPARADO';
      else if (edadDias < 5) estadoDespacho = 'DESPACHADO';
    }

    const numero = `V-${String(id).padStart(5, '0')}`;
    ventas.push({
      id, numero, fecha: fecha.toISOString(), canal,
      clienteId: cliente.id, clienteNombre: cliente.nombre, clienteDocumento: cliente.documento,
      clienteTipo: cliente.tipo, direccionEntrega: cliente.direccion,
      vendedor: vendedor.username, vendedorNombre: vendedor.nombre,
      bodegaId, observaciones: '',
      items, subtotal, iva, total: subtotal + iva,
      estado: anulada ? 'ANULADA' : 'REGISTRADA',
      estadoDespacho: anulada ? 'PENDIENTE' : estadoDespacho,
      factura: { numero: `FE-${String(id).padStart(5, '0')}`, fecha: fecha.toISOString() },
    });
    if (!anulada) {
      items.forEach((it) => {
        const k = `${it.productoId}-${bodegaId}`;
        vendidos[k] = (vendidos[k] || 0) + it.cantidad;
      });
    }
  }

  // 2. Inventario inicial por bodega = lo vendido + lo que debe quedar.
  const movimientos = [];
  const mov = (m) => movimientos.push({ id: movimientos.length + 1, proveedor: '', bodegaOrigenId: null, ...m });
  const fechaInicial = new Date(ahora - 80 * DIA).toISOString();
  const productos = PRODUCTOS.map(({ final, ...p }) => {
    [1, 2].forEach((b) => {
      mov({
        fecha: fechaInicial, tipo: 'ENTRADA', productoId: p.id, productoNombre: p.nombre, bodegaId: b,
        cantidad: (vendidos[`${p.id}-${b}`] || 0) + final[b], referencia: 'Inventario inicial', usuario: 'bodega',
      });
    });
    return { ...p, existencias: { 1: final[1], 2: final[2] } };
  });

  // 3. Salidas por cada venta (y devolución si fue anulada).
  ventas.forEach((v) => {
    v.items.forEach((it) => {
      const base = { fecha: v.fecha, productoId: it.productoId, productoNombre: it.nombre, bodegaId: v.bodegaId, cantidad: it.cantidad };
      mov({ ...base, tipo: 'SALIDA', referencia: `Venta ${v.numero}`, usuario: v.vendedor });
      if (v.estado === 'ANULADA') mov({ ...base, tipo: 'ANULACION', referencia: `Anulación ${v.numero}`, usuario: 'admin' });
    });
  });

  return {
    usuarios: USUARIOS,
    productos,
    clientes: CLIENTES,
    ventas,
    movimientos,
    config: { metaMensual: 22000000 },
  };
}
