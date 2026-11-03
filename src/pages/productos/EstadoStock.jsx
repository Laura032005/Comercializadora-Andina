// HU08: indica visualmente si el stock está por debajo del mínimo.
export function stockBajo(producto) {
  return Number(producto?.stock) <= Number(producto?.stockMinimo);
}

export default function EstadoStock({ producto }) {
  if (Number(producto?.stock) <= 0) return <span className="badge badge-error">Agotado</span>;
  if (stockBajo(producto)) return <span className="badge badge-aviso">Stock bajo</span>;
  return <span className="badge badge-exito">Disponible</span>;
}
