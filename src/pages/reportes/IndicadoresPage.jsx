import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDatos } from '../../hooks/useDatos';
import ventasService from '../../services/ventasService';
import productosService from '../../services/productosService';
import inventarioService from '../../services/inventarioService';
import { esPedido, stockTotal } from '../../services/catalogos';
import { enRango, fechaInput, formatoMoneda, formatoNumero, inicioDeMes, porcentaje } from '../../utils/formato';
import { porDia, productosVendidos, resumen } from '../../utils/estadisticas';
import { Aviso, Barra, EncabezadoPagina, EstadoDatos, Indicador } from '../../components/UI';
import { InsigniaStock, nivelStock } from '../../components/Insignias';

const DIA = 24 * 3600 * 1000;
const REFRESCO_MS = 60 * 1000;

function cargarTablero() {
  return Promise.all([ventasService.listar(), productosService.listar(), inventarioService.obtenerMeta()]);
}

// Tablero del gerente: lo que antes esperaba en el reporte semanal, ahora al momento.
export default function IndicadoresPage() {
  const { usuario } = useAuth();
  const { datos, cargando, error, recargar } = useDatos(cargarTablero);
  const [actualizado, setActualizado] = useState(new Date());
  const [aviso, setAviso] = useState(null);

  // Se actualiza solo cada minuto.
  useEffect(() => {
    const t = setInterval(() => recargar().then(() => setActualizado(new Date())), REFRESCO_MS);
    return () => clearInterval(t);
  }, [recargar]);

  const [ventas, productos, meta] = datos ?? [[], [], 0];
  const hoy = fechaInput();
  const ahora = new Date();
  const inicioMes = fechaInput(inicioDeMes());
  // Mes anterior hasta el mismo día del mes (comparación justa).
  const inicioMesAnt = fechaInput(new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1));
  const ultimoDiaMesAnt = new Date(ahora.getFullYear(), ahora.getMonth(), 0).getDate();
  const mismoDiaMesAnt = fechaInput(new Date(ahora.getFullYear(), ahora.getMonth() - 1, Math.min(ahora.getDate(), ultimoDiaMesAnt)));

  const rHoy = resumen(ventas.filter((v) => enRango(v.fecha, hoy, hoy)));
  const rMes = resumen(ventas.filter((v) => enRango(v.fecha, inicioMes, hoy)));
  const rMesAnt = resumen(ventas.filter((v) => enRango(v.fecha, inicioMesAnt, mismoDiaMesAnt)));
  const variacion = porcentaje(rMes.total, rMesAnt.total);

  const pendientes = ventas.filter((v) => v.estado !== 'ANULADA' && esPedido(v.canal) && v.estadoDespacho !== 'ENTREGADO');
  const sinPreparar = pendientes.filter((v) => v.estadoDespacho === 'PENDIENTE').length;

  const desde30 = fechaInput(new Date(Date.now() - 29 * DIA));
  const rotacion = productosVendidos(ventas.filter((v) => enRango(v.fecha, desde30, hoy)))
    .sort((a, b) => b.cantidad - a.cantidad || b.total - a.total)
    .slice(0, 5);
  const alertas = productos.filter((p) => p.activo && nivelStock(p) !== 'OK').sort((a, b) => stockTotal(a) - stockTotal(b));
  const dias = porDia(ventas, fechaInput(new Date(Date.now() - 13 * DIA)), hoy);
  const maxDia = Math.max(...dias.map((d) => d.total), 0);
  const avanceMeta = meta ? Math.min(100, (rMes.total / meta) * 100) : 0;

  async function editarMeta(e) {
    e.preventDefault();
    const valor = Number(new FormData(e.currentTarget).get('meta'));
    if (!(valor > 0)) return setAviso({ tipo: 'error', texto: 'La meta debe ser mayor que 0.' });
    try {
      await inventarioService.guardarMeta(valor);
      setAviso({ tipo: 'exito', texto: 'Meta mensual actualizada.' });
      recargar();
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.message });
    }
  }

  return (
    <>
      <EncabezadoPagina
        titulo="Tablero gerencial"
        descripcion={`Datos al momento · actualizado a las ${actualizado.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} (se refresca cada minuto)`}
        acciones={<button type="button" className="btn btn-secundario" onClick={() => recargar().then(() => setActualizado(new Date()))}>Actualizar</button>}
      />
      <Aviso aviso={aviso} onCerrar={() => setAviso(null)} />

      <EstadoDatos cargando={cargando && !datos} error={error} onReintentar={recargar}>
        <div className="indicadores">
          <Indicador titulo="Vendido hoy" valor={formatoMoneda(rHoy.total)} detalle={`${rHoy.cantidad} venta(s)`} />
          <Indicador
            titulo="Vendido este mes"
            valor={formatoMoneda(rMes.total)}
            detalle={variacion === null ? 'Sin datos del mes anterior' : `${variacion >= 0 ? '▲' : '▼'} ${Math.abs(variacion).toFixed(1)} % vs. mismo corte del mes anterior`}
            tono={variacion === null ? undefined : variacion >= 0 ? 'exito' : 'error'}
          />
          <Indicador titulo="Venta promedio del mes" valor={formatoMoneda(rMes.ticket)} detalle={`${rMes.cantidad} venta(s)`} />
          <Indicador
            titulo="Pedidos en curso"
            valor={formatoNumero(pendientes.length)}
            detalle={`${sinPreparar} sin preparar`}
            tono={sinPreparar ? 'alerta' : undefined}
          />
        </div>

        <section className="panel">
          <div className="panel-titulo">
            <h2>Meta de ventas del mes</h2>
            {(usuario.rol === 'GERENTE' || usuario.rol === 'ADMIN') && (
              <form className="meta-form" onSubmit={editarMeta}>
                <label htmlFor="meta">Meta (COP)</label>
                <input id="meta" name="meta" type="number" min="1" step="100000" defaultValue={meta} key={meta} />
                <button type="submit" className="btn btn-secundario">Guardar</button>
              </form>
            )}
          </div>
          <div className="meta" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(avanceMeta)} aria-label="Avance de la meta mensual">
            <div className="meta-relleno" style={{ width: `${avanceMeta}%` }} />
          </div>
          <p className="texto-suave">
            {formatoMoneda(rMes.total)} de {formatoMoneda(meta)} · <strong>{avanceMeta.toFixed(0)} %</strong>
            {meta > rMes.total ? ` · faltan ${formatoMoneda(meta - rMes.total)}` : ' · ¡meta cumplida!'}
          </p>
        </section>

        <div className="dos-columnas">
          <section className="panel">
            <h2>Ventas de los últimos 14 días</h2>
            <table className="tabla tabla-compacta">
              <thead><tr><th>Día</th><th className="num">Total</th><th className="col-barra"><span className="sr-only">Proporción</span></th></tr></thead>
              <tbody>
                {[...dias].reverse().map((d) => (
                  <tr key={d.dia}>
                    <td>{new Date(`${d.dia}T00:00:00`).toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit', month: 'short' })}</td>
                    <td className="num">{formatoMoneda(d.total)}</td>
                    <td className="col-barra"><Barra valor={d.total} maximo={maxDia} etiqueta={formatoMoneda(d.total)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <div className="columna">
            <section className="panel">
              <h2>Productos que más rotan (30 días)</h2>
              <EstadoDatos vacio={rotacion.length === 0} textoVacio="Sin ventas en los últimos 30 días.">
                <ol className="lista-simple lista-numerada">
                  {rotacion.map((p) => (
                    <li key={p.productoId}>
                      <span>{p.nombre}</span>
                      <span className="texto-suave">{formatoNumero(p.cantidad)} {p.unidad}</span>
                    </li>
                  ))}
                </ol>
              </EstadoDatos>
            </section>

            <section className="panel">
              <div className="panel-titulo">
                <h2>Alertas de inventario</h2>
                <Link to="/inventario" className="btn-enlace">Ver inventario</Link>
              </div>
              <EstadoDatos vacio={alertas.length === 0} textoVacio="✓ Todos los productos están sobre el mínimo.">
                <ul className="lista-simple">
                  {alertas.map((p) => (
                    <li key={p.id}>
                      <span>{p.nombre}<br /><span className="texto-suave">{formatoNumero(stockTotal(p))} de mínimo {formatoNumero(p.stockMinimo)} {p.unidad}</span></span>
                      <InsigniaStock producto={p} />
                    </li>
                  ))}
                </ul>
              </EstadoDatos>
            </section>
          </div>
        </div>
      </EstadoDatos>
    </>
  );
}
