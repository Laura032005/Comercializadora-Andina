import { formatoNumero } from '../../utils/formato';

// HU12: obtiene la lista de productos sin stock suficiente que devuelve el back.
export function extraerFaltantes(error) {
  const data = error?.data;
  const lista = data?.faltantes || data?.productosSinStock || data?.detalles;
  return Array.isArray(lista) ? lista : [];
}

export default function Faltantes({ faltantes }) {
  if (!faltantes?.length) return null;
  return (
    <div className="alerta alerta-error" role="alert">
      <div className="alerta-texto">
        <strong>No hay stock suficiente para confirmar el pedido:</strong>
        <ul>
          {faltantes.map((f, i) => (
            <li key={f.productoId ?? f.codigo ?? i}>
              {f.nombre || f.codigo || `Producto ${f.productoId}`}: pedido {formatoNumero(f.solicitado ?? f.cantidad)},
              disponible {formatoNumero(f.disponible ?? f.stock)} (faltan{' '}
              {formatoNumero((f.solicitado ?? f.cantidad) - (f.disponible ?? f.stock))}).
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
