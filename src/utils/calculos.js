// HU13: total = suma(cantidad x precio unitario), IVA 19% por separado.
export const TASA_IVA = 0.19;

function redondear(valor) {
  return Math.round(valor * 100) / 100;
}

export function subtotalItem({ cantidad, precioUnitario }) {
  return redondear((Number(cantidad) || 0) * (Number(precioUnitario) || 0));
}

export function calcularTotales(items) {
  const subtotal = redondear(items.reduce((acc, item) => acc + subtotalItem(item), 0));
  const iva = redondear(subtotal * TASA_IVA);
  return { subtotal, iva, total: redondear(subtotal + iva) };
}
