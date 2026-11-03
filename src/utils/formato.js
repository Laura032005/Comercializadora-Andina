const moneda = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});
const numero = new Intl.NumberFormat('es-CO');

export function formatoMoneda(valor) {
  return moneda.format(Number(valor) || 0);
}

export function formatoNumero(valor) {
  return numero.format(Number(valor) || 0);
}

export function formatoFecha(valor, conHora = false) {
  if (!valor) return '—';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return String(valor);
  return fecha.toLocaleString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    ...(conHora ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

// Fecha local en formato YYYY-MM-DD (para inputs type="date" y parámetros del API).
export function fechaISO(fecha = new Date()) {
  const d = new Date(fecha);
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

export function haceDias(dias) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return fechaISO(d);
}

export const NOMBRE_ESTADO_PEDIDO = {
  BORRADOR: 'Borrador',
  CONFIRMADO: 'Confirmado',
  DESPACHADO: 'Despachado',
  ENTREGADO: 'Entregado',
};

export const NOMBRE_TIPO_CLIENTE = {
  DETAL: 'Detal',
  MAYORISTA: 'Mayorista',
};
