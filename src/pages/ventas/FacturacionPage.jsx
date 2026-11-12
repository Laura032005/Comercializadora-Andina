import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDatos } from '../../hooks/useDatos';
import ventasService from '../../services/ventasService';
import { descargarCsv, fechaInput, formatoFecha, formatoMoneda, formatoNumero } from '../../utils/formato';
import { EncabezadoPagina, EstadoDatos, Indicador, Insignia } from '../../components/UI';

const mesActual = () => fechaInput().slice(0, 7); // 'aaaa-mm' en hora local

// Facturas del mes, listas para contabilidad: ya no hay que redigitar las ventas.
export default function FacturacionPage() {
  const { datos, cargando, error, recargar } = useDatos(() => ventasService.listar());
  const [mes, setMes] = useState(mesActual());

  // El mes se compara en hora local.
  const mesDe = (iso) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };
  const facturas = (datos ?? [])
    .filter((v) => mesDe(v.factura.fecha) === mes)
    .sort((a, b) => a.factura.numero.localeCompare(b.factura.numero));
  const vigentes = facturas.filter((v) => v.estado !== 'ANULADA');
  const suma = (campo) => vigentes.reduce((s, v) => s + v[campo], 0);

  function exportar() {
    descargarCsv(
      `facturas-${mes}.csv`,
      ['Factura', 'Fecha', 'Venta', 'Documento cliente', 'Cliente', 'Subtotal', 'IVA', 'Total', 'Estado'],
      facturas.map((v) => [
        v.factura.numero, formatoFecha(v.factura.fecha), v.numero, v.clienteDocumento, v.clienteNombre,
        v.subtotal, v.iva, v.total, v.estado === 'ANULADA' ? 'Anulada' : 'Vigente',
      ])
    );
  }

  return (
    <>
      <EncabezadoPagina
        titulo="Facturación"
        descripcion="Cada venta genera su factura automáticamente. Exporta el mes para el programa contable."
        acciones={<button type="button" className="btn" onClick={exportar} disabled={!facturas.length}>Exportar CSV del mes</button>}
      />

      <div className="filtros">
        <label>Mes <input type="month" value={mes} onChange={(e) => setMes(e.target.value)} max={mesActual()} /></label>
      </div>

      <EstadoDatos cargando={cargando && !datos} error={error} onReintentar={recargar}>
        <div className="indicadores">
          <Indicador titulo="Facturas vigentes" valor={formatoNumero(vigentes.length)} detalle={`${facturas.length - vigentes.length} anulada(s)`} />
          <Indicador titulo="Base gravable (subtotal)" valor={formatoMoneda(suma('subtotal'))} />
          <Indicador titulo="IVA generado" valor={formatoMoneda(suma('iva'))} />
          <Indicador titulo="Total facturado" valor={formatoMoneda(suma('total'))} />
        </div>

        <EstadoDatos vacio={facturas.length === 0} textoVacio="No hay facturas en este mes.">
          <div className="tabla-contenedor">
            <table className="tabla">
              <thead>
                <tr><th>Factura</th><th>Fecha</th><th>Cliente</th><th>Documento</th><th className="num">Subtotal</th><th className="num">IVA</th><th className="num">Total</th><th>Estado</th><th className="acciones" /></tr>
              </thead>
              <tbody>
                {facturas.map((v) => (
                  <tr key={v.id} className={v.estado === 'ANULADA' ? 'fila-inactiva' : ''}>
                    <td>{v.factura.numero}</td>
                    <td>{formatoFecha(v.factura.fecha, false)}</td>
                    <td>{v.clienteNombre}</td>
                    <td>{v.clienteDocumento}</td>
                    <td className="num">{formatoMoneda(v.subtotal)}</td>
                    <td className="num">{formatoMoneda(v.iva)}</td>
                    <td className="num">{formatoMoneda(v.total)}</td>
                    <td>{v.estado === 'ANULADA' ? <Insignia tono="error">✕ Anulada</Insignia> : <Insignia tono="exito">✓ Vigente</Insignia>}</td>
                    <td className="acciones"><Link className="btn-enlace" to={`/ventas/${v.id}/factura`}>Ver</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </EstadoDatos>
      </EstadoDatos>
    </>
  );
}
