import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PERMISOS } from '../../config/roles';
import { useCarga } from '../../hooks/useCarga';
import { listarPedidos } from '../../services/pedidosService';
import { Alerta, Cargando, Encabezado, EstadoPedido, Paginacion, Vacio } from '../../components/ui';
import { formatoFecha, formatoMoneda, NOMBRE_ESTADO_PEDIDO } from '../../utils/formato';

// HU15 - Consultar pedido y estado de despacho
export default function PedidosPage() {
  const { tieneRol } = useAuth();
  const [params, setParams] = useSearchParams();
  const criterio = params.get('criterio') || 'numero';
  const texto = params.get('q') || '';
  const estado = params.get('estado') || '';
  const pagina = Number(params.get('pagina') || 0);

  const [criterioForm, setCriterioForm] = useState(criterio);
  const [textoForm, setTextoForm] = useState(texto);

  const { datos, cargando, error, recargar } = useCarga(
    () => listarPedidos({ [criterio]: texto || undefined, estado: estado || undefined, page: pagina }),
    [criterio, texto, estado, pagina]
  );

  function actualizarParams(cambios) {
    const nuevos = new URLSearchParams(params);
    Object.entries(cambios).forEach(([k, v]) => (v ? nuevos.set(k, v) : nuevos.delete(k)));
    if (!('pagina' in cambios)) nuevos.delete('pagina');
    setParams(nuevos);
  }

  function buscar(e) {
    e.preventDefault();
    actualizarParams({ criterio: textoForm.trim() ? criterioForm : '', q: textoForm.trim() });
  }

  const pedidos = datos?.items ?? [];
  const hayFiltros = texto || estado;

  return (
    <>
      <Encabezado titulo="Pedidos" descripcion="Consulta pedidos por número o por cliente y revisa su estado de despacho.">
        {tieneRol(PERMISOS.pedidosCrear) && <Link to="/pedidos/nuevo" className="btn">+ Nuevo pedido</Link>}
      </Encabezado>

      <form className="tarjeta filtros" onSubmit={buscar}>
        <div className="campo campo-angosto">
          <label htmlFor="criterio">Buscar por</label>
          <select id="criterio" value={criterioForm} onChange={(e) => setCriterioForm(e.target.value)}>
            <option value="numero">Número de pedido</option>
            <option value="cliente">Cliente</option>
          </select>
        </div>
        <div className="campo">
          <label htmlFor="q">{criterioForm === 'numero' ? 'Número' : 'Nombre o identificación del cliente'}</label>
          <input id="q" type="search" value={textoForm} onChange={(e) => setTextoForm(e.target.value)} />
        </div>
        <div className="campo campo-angosto">
          <label htmlFor="estado">Estado</label>
          <select id="estado" value={estado} onChange={(e) => actualizarParams({ estado: e.target.value })}>
            <option value="">Todos</option>
            {Object.entries(NOMBRE_ESTADO_PEDIDO).map(([valor, nombre]) => (
              <option key={valor} value={valor}>{nombre}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn">Buscar</button>
        {hayFiltros && (
          <button
            type="button"
            className="btn btn-secundario"
            onClick={() => {
              setTextoForm('');
              setParams({});
            }}
          >
            Limpiar
          </button>
        )}
      </form>

      <div className="tarjeta tarjeta-sin-padding">
        {cargando ? (
          <Cargando />
        ) : error ? (
          <div style={{ padding: '1rem' }}>
            <Alerta>
              {error} <button type="button" className="btn-link" onClick={recargar}>Reintentar</button>
            </Alerta>
          </div>
        ) : pedidos.length === 0 ? (
          <Vacio titulo={hayFiltros ? 'No se encontraron pedidos' : 'Aún no hay pedidos registrados'}>
            {hayFiltros ? 'Prueba con otro número, cliente o estado.' : null}
          </Vacio>
        ) : (
          <>
            <div className="tabla-contenedor">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th className="num">Total</th>
                    <th>Estado</th>
                    <th className="acciones" />
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map((p) => (
                    <tr key={p.id}>
                      <td><strong>{p.numero}</strong></td>
                      <td>{formatoFecha(p.fecha, true)}</td>
                      <td>{p.cliente?.nombre ?? p.clienteNombre}</td>
                      <td className="num">{formatoMoneda(p.total)}</td>
                      <td><EstadoPedido estado={p.estado} /></td>
                      <td className="acciones">
                        <Link to={`/pedidos/${p.id}`} className="btn btn-secundario btn-sm">Ver</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Paginacion
              pagina={datos.pagina}
              totalPaginas={datos.totalPaginas}
              totalElementos={datos.totalElementos}
              onCambiar={(p) => actualizarParams({ pagina: String(p) })}
            />
          </>
        )}
      </div>
    </>
  );
}
