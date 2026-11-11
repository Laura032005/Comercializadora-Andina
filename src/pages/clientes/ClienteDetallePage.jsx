import { Link, useParams } from 'react-router-dom';
import { useDatos } from '../../hooks/useDatos';
import clientesService from '../../services/clientesService';
import ventasService from '../../services/ventasService';
import { TIPOS_CLIENTE } from '../../services/catalogos';
import { formatoFecha, formatoMoneda, formatoNumero } from '../../utils/formato';
import { EncabezadoPagina, EstadoDatos, Indicador } from '../../components/UI';
import { InsigniaVenta } from '../../components/Insignias';

// Historial de compras de un cliente: qué compra, cuánto y cada cuánto.
export default function ClienteDetallePage() {
  const { id } = useParams();
  const { datos, cargando, error, recargar } = useDatos(
    () => Promise.all([clientesService.obtener(id), ventasService.listar({ clienteId: id })]),
    [id]
  );

  const [cliente, ventas = []] = datos ?? [];
  const validas = ventas.filter((v) => v.estado !== 'ANULADA');
  const total = validas.reduce((s, v) => s + v.total, 0);

  const porProducto = {};
  validas.forEach((v) =>
    v.items.forEach((it) => {
      const r = (porProducto[it.productoId] ??= { nombre: it.nombre, unidad: it.unidad, cantidad: 0, total: 0 });
      r.cantidad += it.cantidad;
      r.total += it.subtotal;
    })
  );
  const productosFrecuentes = Object.values(porProducto).sort((a, b) => b.total - a.total).slice(0, 5);

  return (
    <EstadoDatos cargando={cargando && !datos} error={error} onReintentar={recargar}>
      {cliente && (
        <>
          <EncabezadoPagina
            titulo={cliente.nombre}
            descripcion={`${TIPOS_CLIENTE[cliente.tipo]} · Doc. ${cliente.documento}${cliente.telefono ? ` · Tel. ${cliente.telefono}` : ''} · ${cliente.direccion || 'Sin dirección'}`}
            acciones={<Link className="btn btn-secundario" to="/clientes">Volver a clientes</Link>}
          />

          <div className="indicadores">
            <Indicador titulo="Compras" valor={formatoNumero(validas.length)} />
            <Indicador titulo="Total comprado (con IVA)" valor={formatoMoneda(total)} />
            <Indicador titulo="Compra promedio" valor={formatoMoneda(validas.length ? total / validas.length : 0)} />
            <Indicador titulo="Última compra" valor={formatoFecha(validas[0]?.fecha, false)} />
          </div>

          <div className="dos-columnas">
            <section className="panel">
              <h2>Historial de compras</h2>
              <EstadoDatos vacio={ventas.length === 0} textoVacio="Este cliente aún no tiene compras.">
                <div className="tabla-contenedor">
                  <table className="tabla">
                    <thead><tr><th>Venta</th><th>Fecha</th><th className="num">Total</th><th>Estado</th></tr></thead>
                    <tbody>
                      {ventas.map((v) => (
                        <tr key={v.id}>
                          <td><Link to={`/ventas/${v.id}`}>{v.numero}</Link></td>
                          <td>{formatoFecha(v.fecha)}</td>
                          <td className="num">{formatoMoneda(v.total)}</td>
                          <td><InsigniaVenta venta={v} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </EstadoDatos>
            </section>

            <section className="panel">
              <h2>Productos que más compra</h2>
              <EstadoDatos vacio={productosFrecuentes.length === 0} textoVacio="Sin datos.">
                <ul className="lista-simple">
                  {productosFrecuentes.map((p) => (
                    <li key={p.nombre}>
                      <span>{p.nombre}</span>
                      <span className="texto-suave">{formatoNumero(p.cantidad)} {p.unidad} · {formatoMoneda(p.total)}</span>
                    </li>
                  ))}
                </ul>
              </EstadoDatos>
            </section>
          </div>
        </>
      )}
    </EstadoDatos>
  );
}
