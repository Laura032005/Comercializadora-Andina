import { useNavigate, useParams } from 'react-router-dom';
import { useDatos } from '../../hooks/useDatos';
import ventasService from '../../services/ventasService';
import { CANALES } from '../../services/catalogos';
import { IVA } from '../../services/config';
import { formatoFecha, formatoMoneda, formatoNumero } from '../../utils/formato';
import { EstadoDatos } from '../../components/UI';

// Factura imprimible generada a partir de la venta (sin redigitar nada en contabilidad).
export default function FacturaPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { datos: v, cargando, error, recargar } = useDatos(() => ventasService.obtener(id), [id]);

  return (
    <div className="factura-pagina">
      <div className="factura-barra no-imprimir">
        <button type="button" className="btn btn-secundario" onClick={() => navigate(-1)}>Volver</button>
        <button type="button" className="btn" onClick={() => window.print()} disabled={!v}>Imprimir / Guardar PDF</button>
      </div>

      <EstadoDatos cargando={cargando && !v} error={error} onReintentar={recargar}>
        {v && (
          <article className="factura">
            {v.estado === 'ANULADA' && <p className="factura-anulada">ANULADA</p>}
            <header className="factura-encabezado">
              <div>
                <h1>Comercial Andina S.A.S.</h1>
                <p>Ferretería y materiales de construcción · Bogotá D.C.</p>
              </div>
              <div className="factura-numero">
                <p>Factura de venta</p>
                <strong>{v.factura.numero}</strong>
                <p>{formatoFecha(v.factura.fecha)}</p>
              </div>
            </header>

            <dl className="datos factura-datos">
              <dt>Cliente</dt><dd>{v.clienteNombre}</dd>
              <dt>Cédula / NIT</dt><dd>{v.clienteDocumento}</dd>
              <dt>Venta</dt><dd>{v.numero} · {CANALES[v.canal]}</dd>
              <dt>Vendedor</dt><dd>{v.vendedorNombre}</dd>
            </dl>

            <table className="tabla">
              <thead><tr><th>Código</th><th>Descripción</th><th className="num">Cant.</th><th className="num">Valor unit.</th><th className="num">Valor total</th></tr></thead>
              <tbody>
                {v.items.map((it) => (
                  <tr key={it.productoId}>
                    <td>{it.codigo}</td><td>{it.nombre}</td>
                    <td className="num">{formatoNumero(it.cantidad)} {it.unidad}</td>
                    <td className="num">{formatoMoneda(it.precioUnitario)}</td>
                    <td className="num">{formatoMoneda(it.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <dl className="totales">
              <dt>Subtotal</dt><dd>{formatoMoneda(v.subtotal)}</dd>
              <dt>IVA {Math.round(IVA * 100)} %</dt><dd>{formatoMoneda(v.iva)}</dd>
              <dt className="total">Total a pagar</dt><dd className="total">{formatoMoneda(v.total)}</dd>
            </dl>

            <p className="factura-nota">
              Documento generado por el Sistema de Ventas. Representación de prueba: la factura electrónica
              ante la DIAN se emitirá desde el back-end.
            </p>
          </article>
        )}
      </EstadoDatos>
    </div>
  );
}
