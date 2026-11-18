import { useState } from 'react';
import { useDatos } from '../../hooks/useDatos';
import ventasService from '../../services/ventasService';
import { CANALES, TIPOS_CLIENTE } from '../../services/catalogos';
import { descargarCsv, enRango, fechaInput, formatoFecha, formatoMoneda, formatoNumero, inicioDeMes } from '../../utils/formato';
import { agrupar, productosVendidos, resumen } from '../../utils/estadisticas';
import { Barra, EncabezadoPagina, EstadoDatos, Indicador } from '../../components/UI';

// Reportes que antes armaba el área administrativa a mano cada semana.
export default function ReportesPage() {
  const { datos, cargando, error, recargar } = useDatos(() => ventasService.listar());
  const [rango, setRango] = useState({ desde: fechaInput(inicioDeMes()), hasta: fechaInput() });
  const cambiar = (e) => setRango((r) => ({ ...r, [e.target.name]: e.target.value }));

  const ventas = (datos ?? []).filter((v) => enRango(v.fecha, rango.desde, rango.hasta));
  const r = resumen(ventas);
  const porVendedor = agrupar(ventas, (v) => v.vendedor, (v) => v.vendedorNombre);
  const porCanal = agrupar(ventas, (v) => v.canal, (v) => CANALES[v.canal]);
  const porTipoCliente = agrupar(ventas, (v) => v.clienteTipo, (v) => TIPOS_CLIENTE[v.clienteTipo] ?? 'Sin tipo');
  const clientes = agrupar(ventas, (v) => v.clienteId, (v) => v.clienteNombre).slice(0, 10);
  const productos = productosVendidos(ventas);

  function preset(dias) {
    setRango({ desde: fechaInput(new Date(Date.now() - (dias - 1) * 24 * 3600 * 1000)), hasta: fechaInput() });
  }

  function exportar() {
    descargarCsv(
      `ventas-${rango.desde}-a-${rango.hasta}.csv`,
      ['Venta', 'Factura', 'Fecha', 'Canal', 'Cliente', 'Tipo cliente', 'Vendedor', 'Subtotal', 'IVA', 'Total', 'Estado'],
      ventas.map((v) => [
        v.numero, v.factura.numero, formatoFecha(v.fecha), CANALES[v.canal], v.clienteNombre,
        TIPOS_CLIENTE[v.clienteTipo] ?? '', v.vendedorNombre, v.subtotal, v.iva, v.total,
        v.estado === 'ANULADA' ? 'Anulada' : 'Vigente',
      ])
    );
  }

  return (
    <>
      <EncabezadoPagina
        titulo="Reportes"
        descripcion="Calculados al momento con las ventas registradas (sin anuladas)."
        acciones={<button type="button" className="btn btn-secundario" onClick={exportar} disabled={!ventas.length}>Exportar ventas (CSV)</button>}
      />

      <div className="filtros">
        <label>Desde <input type="date" name="desde" value={rango.desde} onChange={cambiar} max={rango.hasta} /></label>
        <label>Hasta <input type="date" name="hasta" value={rango.hasta} onChange={cambiar} min={rango.desde} /></label>
        <button type="button" className="btn-enlace" onClick={() => preset(1)}>Hoy</button>
        <button type="button" className="btn-enlace" onClick={() => preset(7)}>7 días</button>
        <button type="button" className="btn-enlace" onClick={() => setRango({ desde: fechaInput(inicioDeMes()), hasta: fechaInput() })}>Este mes</button>
        <button type="button" className="btn-enlace" onClick={() => preset(90)}>90 días</button>
      </div>

      <EstadoDatos cargando={cargando && !datos} error={error} onReintentar={recargar}>
        <div className="indicadores">
          <Indicador titulo="Total vendido (con IVA)" valor={formatoMoneda(r.total)} detalle={`Sin IVA: ${formatoMoneda(r.subtotal)}`} />
          <Indicador titulo="Número de ventas" valor={formatoNumero(r.cantidad)} />
          <Indicador titulo="Venta promedio" valor={formatoMoneda(r.ticket)} />
          <Indicador titulo="Unidades vendidas" valor={formatoNumero(r.unidades)} />
        </div>

        <div className="dos-columnas">
          <TablaRanking titulo="Ventas por vendedor" filas={porVendedor} />
          <TablaRanking titulo="Ventas por canal" filas={porCanal} />
          <TablaRanking titulo="Clientes finales vs. mayoristas" filas={porTipoCliente} />
          <TablaRanking titulo="Mejores clientes" filas={clientes} />
        </div>

        <section className="panel">
          <h2>Productos más vendidos</h2>
          <EstadoDatos vacio={productos.length === 0} textoVacio="Sin ventas en el periodo.">
            <div className="tabla-contenedor">
              <table className="tabla">
                <thead><tr><th>#</th><th>Producto</th><th className="num">Unidades</th><th className="num">N.º ventas</th><th className="num">Valor (sin IVA)</th><th className="col-barra"><span className="sr-only">Proporción</span></th></tr></thead>
                <tbody>
                  {productos.map((p, i) => (
                    <tr key={p.productoId}>
                      <td>{i + 1}</td>
                      <td>{p.nombre}</td>
                      <td className="num">{formatoNumero(p.cantidad)} {p.unidad}</td>
                      <td className="num">{formatoNumero(p.ventas)}</td>
                      <td className="num">{formatoMoneda(p.total)}</td>
                      <td className="col-barra"><Barra valor={p.total} maximo={productos[0].total} etiqueta={`${p.nombre}: ${formatoMoneda(p.total)}`} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </EstadoDatos>
        </section>
      </EstadoDatos>
    </>
  );
}

// Tabla de ranking con valor, participación y una barra de una sola serie.
export function TablaRanking({ titulo, filas }) {
  const total = filas.reduce((s, f) => s + f.total, 0);
  const max = filas[0]?.total ?? 0;
  return (
    <section className="panel">
      <h2>{titulo}</h2>
      <EstadoDatos vacio={filas.length === 0} textoVacio="Sin ventas en el periodo.">
        <table className="tabla tabla-compacta">
          <thead><tr><th>Nombre</th><th className="num">Ventas</th><th className="num">Total</th><th className="num">%</th><th className="col-barra"><span className="sr-only">Proporción</span></th></tr></thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.clave}>
                <td>{f.etiqueta}</td>
                <td className="num">{formatoNumero(f.cantidad)}</td>
                <td className="num">{formatoMoneda(f.total)}</td>
                <td className="num">{total ? Math.round((f.total / total) * 100) : 0} %</td>
                <td className="col-barra"><Barra valor={f.total} maximo={max} etiqueta={`${f.etiqueta}: ${formatoMoneda(f.total)}`} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </EstadoDatos>
    </section>
  );
}
