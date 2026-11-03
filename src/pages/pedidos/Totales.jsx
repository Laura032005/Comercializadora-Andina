import { formatoMoneda } from '../../utils/formato';
import { TASA_IVA } from '../../utils/calculos';

// HU13: subtotal, IVA (19%) por separado y total.
export default function Totales({ subtotal, iva, total }) {
  return (
    <div className="totales" aria-live="polite">
      <div>
        <span>Subtotal</span>
        <span>{formatoMoneda(subtotal)}</span>
      </div>
      <div>
        <span>IVA ({Math.round(TASA_IVA * 100)}%)</span>
        <span>{formatoMoneda(iva)}</span>
      </div>
      <div className="total-final">
        <span>Total</span>
        <span>{formatoMoneda(total)}</span>
      </div>
    </div>
  );
}
