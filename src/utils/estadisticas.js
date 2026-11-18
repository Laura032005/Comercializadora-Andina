// Cálculos de reportes a partir de la lista de ventas (se excluyen las anuladas).
import { fechaInput } from './formato';

export const vigentes = (ventas) => ventas.filter((v) => v.estado !== 'ANULADA');

export function resumen(ventas) {
  const v = vigentes(ventas);
  const total = v.reduce((s, x) => s + x.total, 0);
  const subtotal = v.reduce((s, x) => s + x.subtotal, 0);
  const unidades = v.reduce((s, x) => s + x.items.reduce((a, it) => a + it.cantidad, 0), 0);
  return { cantidad: v.length, total, subtotal, iva: total - subtotal, unidades, ticket: v.length ? total / v.length : 0 };
}

// Agrupa ventas vigentes por una clave. Devuelve [{ clave, etiqueta, cantidad, total }] ordenado por total.
export function agrupar(ventas, clave, etiqueta) {
  const grupos = {};
  vigentes(ventas).forEach((v) => {
    const k = clave(v);
    const g = (grupos[k] ??= { clave: k, etiqueta: etiqueta(v), cantidad: 0, total: 0 });
    g.cantidad += 1;
    g.total += v.total;
  });
  return Object.values(grupos).sort((a, b) => b.total - a.total);
}

// Productos por unidades vendidas y por valor (sin IVA).
export function productosVendidos(ventas) {
  const p = {};
  vigentes(ventas).forEach((v) =>
    v.items.forEach((it) => {
      const r = (p[it.productoId] ??= { productoId: it.productoId, codigo: it.codigo, nombre: it.nombre, unidad: it.unidad, cantidad: 0, total: 0, ventas: 0 });
      r.cantidad += it.cantidad;
      r.total += it.subtotal;
      r.ventas += 1;
    })
  );
  return Object.values(p).sort((a, b) => b.total - a.total);
}

// Total por día (aaaa-mm-dd) entre dos fechas, incluyendo días sin ventas.
export function porDia(ventas, desde, hasta) {
  const mapa = {};
  vigentes(ventas).forEach((v) => {
    const d = fechaInput(v.fecha);
    mapa[d] = (mapa[d] ?? 0) + v.total;
  });
  const dias = [];
  const d = new Date(`${desde}T00:00:00`);
  const fin = new Date(`${hasta}T00:00:00`);
  while (d <= fin && dias.length < 400) {
    const k = fechaInput(d);
    dias.push({ dia: k, total: mapa[k] ?? 0 });
    d.setDate(d.getDate() + 1);
  }
  return dias;
}
