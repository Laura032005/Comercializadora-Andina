import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PERMISOS } from '../../config/roles';
import { useCarga } from '../../hooks/useCarga';
import { cambiarEstadoPedido, confirmarPedido, ESTADOS_PEDIDO, obtenerPedido } from '../../services/pedidosService';
import { Alerta, Cargando, Confirmacion, Encabezado, EstadoPedido } from '../../components/ui';
import { calcularTotales, subtotalItem } from '../../utils/calculos';
import { formatoFecha, formatoMoneda, formatoNumero, NOMBRE_ESTADO_PEDIDO } from '../../utils/formato';
import Totales from './Totales';
import Faltantes, { extraerFaltantes } from './Faltantes';

const FLUJO = [ESTADOS_PEDIDO.BORRADOR, ESTADOS_PEDIDO.CONFIRMADO, ESTADOS_PEDIDO.DESPACHADO, ESTADOS_PEDIDO.ENTREGADO];

function LineaEstados({ estado }) {
  const actual = FLUJO.indexOf(estado);
  return (
    <ol className="linea-estados" aria-label="Estado del pedido">
      {FLUJO.map((e, i) => (
        <li key={e} className={i < actual ? 'hecho' : i === actual ? 'actual' : ''} aria-current={i === actual ? 'step' : undefined}>
          <span className="linea-punto" aria-hidden="true">{i < actual ? '✓' : i + 1}</span>
          {NOMBRE_ESTADO_PEDIDO[e]}
        </li>
      ))}
    </ol>
  );
}

const ACCIONES = {
  confirmar: {
    titulo: '¿Confirmar pedido?',
    texto: 'Una vez confirmado, el pedido no se puede editar y se descontará del inventario.',
    boton: 'Sí, confirmar',
    mensaje: 'Pedido confirmado. El inventario fue actualizado.',
  },
  despachar: {
    titulo: '¿Marcar como despachado?',
    texto: 'Confirma que la mercancía del pedido salió de bodega.',
    boton: 'Sí, despachado',
    mensaje: 'El pedido quedó marcado como despachado.',
  },
  entregar: {
    titulo: '¿Marcar como entregado?',
    texto: 'Confirma que el cliente recibió el pedido.',
    boton: 'Sí, entregado',
    mensaje: 'El pedido quedó marcado como entregado.',
  },
};

// HU14 - Confirmar pedido / HU15 - Consultar pedido y estado de despacho
export default function PedidoDetallePage() {
  const { id } = useParams();
  const { tieneRol } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mensaje, setMensaje] = useState(location.state?.mensaje || '');
  const [errorAccion, setErrorAccion] = useState('');
  const [faltantes, setFaltantes] = useState([]);
  const [accion, setAccion] = useState(null);
  const [procesando, setProcesando] = useState(false);

  const { datos: pedido, setDatos, cargando, error } = useCarga(() => obtenerPedido(id), [id]);

  function cerrarMensaje() {
    setMensaje('');
    navigate(location.pathname, { replace: true, state: null });
  }

  async function ejecutarAccion() {
    setProcesando(true);
    setErrorAccion('');
    setFaltantes([]);
    setMensaje('');
    try {
      let actualizado;
      if (accion === 'confirmar') actualizado = await confirmarPedido(id);
      if (accion === 'despachar') actualizado = await cambiarEstadoPedido(id, ESTADOS_PEDIDO.DESPACHADO);
      if (accion === 'entregar') actualizado = await cambiarEstadoPedido(id, ESTADOS_PEDIDO.ENTREGADO);
      setDatos(actualizado && actualizado.id ? actualizado : await obtenerPedido(id));
      setMensaje(ACCIONES[accion].mensaje);
    } catch (e) {
      const lista = extraerFaltantes(e);
      if (lista.length) setFaltantes(lista);
      else setErrorAccion(e.message);
    } finally {
      setProcesando(false);
      setAccion(null);
    }
  }

  if (cargando) return <Cargando />;
  if (error) {
    return (
      <>
        <Link to="/pedidos" className="volver">← Volver a pedidos</Link>
        <Alerta>{error}</Alerta>
      </>
    );
  }

  const estado = String(pedido.estado || '').toUpperCase();
  const items = (pedido.items ?? []).map((i) => ({
    ...i,
    nombre: i.nombre ?? i.producto?.nombre,
    codigo: i.codigo ?? i.producto?.codigo,
  }));
  const calculados = calcularTotales(items);
  const totales = {
    subtotal: pedido.subtotal ?? calculados.subtotal,
    iva: pedido.iva ?? calculados.iva,
    total: pedido.total ?? calculados.total,
  };
  const puedeEditar = estado === ESTADOS_PEDIDO.BORRADOR && tieneRol(PERMISOS.pedidosCrear);
  const puedeDespachar = estado === ESTADOS_PEDIDO.CONFIRMADO && tieneRol(PERMISOS.pedidosDespachar);
  const puedeEntregar = estado === ESTADOS_PEDIDO.DESPACHADO && tieneRol(PERMISOS.pedidosDespachar);

  return (
    <>
      <Link to="/pedidos" className="volver">← Volver a pedidos</Link>
      <Encabezado titulo={`Pedido ${pedido.numero ?? ''}`} descripcion={`Creado el ${formatoFecha(pedido.fecha, true)}`}>
        {puedeEditar && (
          <>
            <Link to={`/pedidos/${pedido.id}/editar`} className="btn btn-secundario">Editar</Link>
            <button type="button" className="btn" onClick={() => setAccion('confirmar')}>Confirmar pedido</button>
          </>
        )}
        {puedeDespachar && (
          <button type="button" className="btn" onClick={() => setAccion('despachar')}>Marcar como despachado</button>
        )}
        {puedeEntregar && (
          <button type="button" className="btn btn-exito" onClick={() => setAccion('entregar')}>Marcar como entregado</button>
        )}
      </Encabezado>

      <Alerta tipo="exito" onCerrar={cerrarMensaje}>{mensaje}</Alerta>
      <Alerta onCerrar={() => setErrorAccion('')}>{errorAccion}</Alerta>
      <Faltantes faltantes={faltantes} />

      <div className="tarjeta">
        <LineaEstados estado={estado} />
      </div>

      <div className="tarjeta">
        <h2>Datos del pedido</h2>
        <dl className="datos">
          <div><dt>Número</dt><dd>{pedido.numero}</dd></div>
          <div><dt>Estado</dt><dd><EstadoPedido estado={estado} /></dd></div>
          <div>
            <dt>Cliente</dt>
            <dd>
              {pedido.cliente?.id && tieneRol(PERMISOS.clientesVer) ? (
                <Link to={`/clientes/${pedido.cliente.id}`}>{pedido.cliente.nombre}</Link>
              ) : (
                pedido.cliente?.nombre ?? pedido.clienteNombre ?? '—'
              )}
            </dd>
          </div>
          <div><dt>Identificación</dt><dd>{pedido.cliente?.identificacion ?? '—'}</dd></div>
          <div><dt>Vendedor</dt><dd>{pedido.vendedor?.nombre ?? pedido.vendedor ?? '—'}</dd></div>
          <div><dt>Fecha de confirmación</dt><dd>{formatoFecha(pedido.fechaConfirmacion, true)}</dd></div>
          {pedido.fechaDespacho && (
            <div><dt>Fecha de despacho</dt><dd>{formatoFecha(pedido.fechaDespacho, true)}</dd></div>
          )}
        </dl>
      </div>

      <div className="tarjeta">
        <h2>Productos</h2>
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th>Código</th>
                <th>Producto</th>
                <th className="num">Cantidad</th>
                <th className="num">Precio unit.</th>
                <th className="num">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i, idx) => (
                <tr key={i.productoId ?? i.id ?? idx}>
                  <td>{i.codigo}</td>
                  <td>{i.nombre}</td>
                  <td className="num">{formatoNumero(i.cantidad)}</td>
                  <td className="num">{formatoMoneda(i.precioUnitario)}</td>
                  <td className="num">{formatoMoneda(i.subtotal ?? subtotalItem(i))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <Totales {...totales} />
        </div>
      </div>

      <Confirmacion
        abierta={Boolean(accion)}
        titulo={accion ? ACCIONES[accion].titulo : ''}
        textoConfirmar={accion ? ACCIONES[accion].boton : ''}
        ocupado={procesando}
        onCancelar={() => setAccion(null)}
        onConfirmar={ejecutarAccion}
      >
        <p>{accion ? ACCIONES[accion].texto : ''}</p>
      </Confirmacion>
    </>
  );
}
