import { CANALES, ESTADOS_DESPACHO, esPedido, stockTotal } from '../services/catalogos';
import { Insignia } from './UI';

const TONO_DESPACHO = { PENDIENTE: 'alerta', PREPARADO: 'info', DESPACHADO: 'info', ENTREGADO: 'exito' };

// Estado de la venta: anulada, o el estado del pedido (los de mostrador se entregan al instante).
export function InsigniaVenta({ venta }) {
  if (venta.estado === 'ANULADA') return <Insignia tono="error">✕ Anulada</Insignia>;
  if (!esPedido(venta.canal)) return <Insignia tono="exito">✓ Entregada</Insignia>;
  return <InsigniaDespacho estado={venta.estadoDespacho} />;
}

export function InsigniaDespacho({ estado }) {
  const icono = estado === 'ENTREGADO' ? '✓ ' : estado === 'PENDIENTE' ? '● ' : '→ ';
  return <Insignia tono={TONO_DESPACHO[estado]}>{icono}{ESTADOS_DESPACHO[estado] ?? estado}</Insignia>;
}

export function InsigniaCanal({ canal }) {
  return <span className="texto-suave">{CANALES[canal] ?? canal}</span>;
}

// Nivel de inventario: agotado, bajo (≤ mínimo) o normal.
export function nivelStock(p) {
  const total = stockTotal(p);
  if (total === 0) return 'AGOTADO';
  if (total <= p.stockMinimo) return 'BAJO';
  return 'OK';
}

export function InsigniaStock({ producto }) {
  const nivel = nivelStock(producto);
  if (nivel === 'AGOTADO') return <Insignia tono="error">✕ Agotado</Insignia>;
  if (nivel === 'BAJO') return <Insignia tono="alerta">▲ Stock bajo</Insignia>;
  return <Insignia tono="exito">✓ Disponible</Insignia>;
}
