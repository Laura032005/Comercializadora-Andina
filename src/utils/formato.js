// Formatos para Colombia (pesos sin decimales, fechas dd/mm/aaaa).
const moneda = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const numero = new Intl.NumberFormat('es-CO');

export const formatoMoneda = (n) => moneda.format(n ?? 0);
export const formatoNumero = (n) => numero.format(n ?? 0);

export function formatoFecha(iso, conHora = true) {
  if (!iso) return '—';
  const opciones = { day: '2-digit', month: '2-digit', year: 'numeric' };
  if (conHora) Object.assign(opciones, { hour: '2-digit', minute: '2-digit' });
  return new Date(iso).toLocaleString('es-CO', opciones);
}

// 'aaaa-mm-dd' en hora local (para <input type="date">).
export function fechaInput(d = new Date()) {
  const f = new Date(d);
  const mm = String(f.getMonth() + 1).padStart(2, '0');
  const dd = String(f.getDate()).padStart(2, '0');
  return `${f.getFullYear()}-${mm}-${dd}`;
}

export const inicioDeMes = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), 1);

// ¿La fecha ISO cae entre dos valores 'aaaa-mm-dd' (inclusive)?
export function enRango(iso, desde, hasta) {
  const dia = fechaInput(iso);
  return (!desde || dia >= desde) && (!hasta || dia <= hasta);
}

export function porcentaje(valor, base) {
  if (!base) return null;
  return ((valor - base) / base) * 100;
}

// Descarga un CSV (separado por ";" para que Excel en español lo abra bien).
export function descargarCsv(nombreArchivo, encabezados, filas) {
  const escapar = (v) => {
    const s = String(v ?? '');
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const contenido = [encabezados, ...filas].map((f) => f.map(escapar).join(';')).join('\r\n');
  const blob = new Blob([`﻿${contenido}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  a.click();
  URL.revokeObjectURL(url);
}
