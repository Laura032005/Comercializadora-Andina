import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PERMISOS } from '../../config/roles';
import { useCarga } from '../../hooks/useCarga';
import { historialCliente, obtenerCliente } from '../../services/clientesService';
import { Alerta, Cargando, Encabezado, EstadoPedido, Vacio } from '../../components/ui';
import { formatoFecha, formatoMoneda, NOMBRE_TIPO_CLIENTE } from '../../utils/formato';

function ordenarPorFechaDesc(pedidos) {
  return [...pedidos].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}

// HU04 - Historial de pedidos del cliente
function HistorialPedidos({ clienteId }) {
  const [filtro, setFiltro] = useState({ desde: '', hasta: '' });
  const [aplicado, setAplicado] = useState({ desde: '', hasta: '' });
  const [errorFiltro, setErrorFiltro] = useState('');

  const { datos, cargando, error, recargar } = useCarga(
    () => historialCliente(clienteId, aplicado),
    [clienteId, aplicado.desde, aplicado.hasta]
  );

  function filtrar(e) {
    e.preventDefault();
    if (filtro.desde && filtro.hasta && filtro.desde > filtro.hasta) {
      setErrorFiltro('La fecha inicial no puede ser posterior a la final.');
      return;
    }
    setErrorFiltro('');
    setAplicado({ ...filtro });
  }

  function limpiar() {
    setFiltro({ desde: '', hasta: '' });
    setAplicado({ desde: '', hasta: '' });
    setErrorFiltro('');
  }

  const pedidos = ordenarPorFechaDesc(datos ?? []);
  const hayFiltro = aplicado.desde || aplicado.hasta;

  return (
    <div className="tarjeta">
      <h2>Historial de pedidos</h2>
      <form className="filtros" onSubmit={filtrar} style={{ marginBottom: '1rem' }}>
        <div className="campo campo-angosto">
          <label htmlFor="desde">Desde</label>
          <input id="desde" type="date" value={filtro.desde} onChange={(e) => setFiltro((f) => ({ ...f, desde: e.target.value }))} />
        </div>
        <div className="campo campo-angosto">
          <label htmlFor="hasta">Hasta</label>
          <input id="hasta" type="date" value={filtro.hasta} onChange={(e) => setFiltro((f) => ({ ...f, hasta: e.target.value }))} />
        </div>
        <button type="submit" className="btn">Filtrar</button>
        {hayFiltro && <button type="button" className="btn btn-secundario" onClick={limpiar}>Quitar filtro</button>}
      </form>
      <Alerta>{errorFiltro}</Alerta>

      {cargando ? (
        <Cargando />
      ) : error ? (
        <Alerta>
          {error} <button type="button" className="btn-link" onClick={recargar}>Reintentar</button>
        </Alerta>
      ) : pedidos.length === 0 ? (
        <Vacio titulo={hayFiltro ? 'No hay pedidos en ese rango de fechas' : 'Este cliente no tiene pedidos'} />
      ) : (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Número</th>
                <th className="num">Total</th>
                <th>Estado</th>
                <th className="acciones" />
              </tr>
            </thead>
            <tbody>
              {pedidos.map((p) => (
                <tr key={p.id}>
                  <td>{formatoFecha(p.fecha, true)}</td>
                  <td>{p.numero}</td>
                  <td className="num">{formatoMoneda(p.total)}</td>
                  <td><EstadoPedido estado={p.estado} /></td>
                  <td className="acciones">
                    <Link to={`/pedidos/${p.id}`} className="btn btn-secundario btn-sm">Ver pedido</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function ClienteDetallePage() {
  const { id } = useParams();
  const { tieneRol } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mensaje, setMensaje] = useState(location.state?.mensaje || '');

  const { datos: cliente, cargando, error } = useCarga(() => obtenerCliente(id), [id]);

  function cerrarMensaje() {
    setMensaje('');
    navigate(location.pathname, { replace: true, state: null });
  }

  if (cargando) return <Cargando />;
  if (error) {
    return (
      <>
        <Link to="/clientes" className="volver">← Volver a clientes</Link>
        <Alerta>{error}</Alerta>
      </>
    );
  }

  return (
    <>
      <Link to="/clientes" className="volver">← Volver a clientes</Link>
      <Encabezado titulo={cliente.nombre} descripcion={`Identificación ${cliente.identificacion}`}>
        {tieneRol(PERMISOS.pedidosCrear) && (
          <Link to={`/pedidos/nuevo?cliente=${cliente.id}`} className="btn btn-secundario">Nuevo pedido</Link>
        )}
        {tieneRol(PERMISOS.clientesEditar) && (
          <Link to={`/clientes/${cliente.id}/editar`} className="btn">Editar</Link>
        )}
      </Encabezado>

      <Alerta tipo="exito" onCerrar={cerrarMensaje}>{mensaje}</Alerta>

      <div className="tarjeta">
        <h2>Datos del cliente</h2>
        <dl className="datos">
          <div><dt>Identificación</dt><dd>{cliente.identificacion}</dd></div>
          <div><dt>Nombre</dt><dd>{cliente.nombre}</dd></div>
          <div><dt>Tipo</dt><dd>{NOMBRE_TIPO_CLIENTE[cliente.tipo] || cliente.tipo}</dd></div>
          <div><dt>Teléfono</dt><dd>{cliente.telefono || '—'}</dd></div>
          <div><dt>Correo</dt><dd>{cliente.correo || '—'}</dd></div>
          <div><dt>Dirección</dt><dd>{cliente.direccion || '—'}</dd></div>
        </dl>
      </div>

      <HistorialPedidos clienteId={cliente.id} />
    </>
  );
}
