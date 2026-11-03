import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useDebounce } from '../../hooks/useDebounce';
import { listarClientes, obtenerCliente } from '../../services/clientesService';
import { listarProductos } from '../../services/productosService';
import { actualizarPedido, confirmarPedido, crearPedido, ESTADOS_PEDIDO, obtenerPedido } from '../../services/pedidosService';
import { calcularTotales, subtotalItem } from '../../utils/calculos';
import { formatoMoneda, formatoNumero, NOMBRE_TIPO_CLIENTE } from '../../utils/formato';
import { validarCantidad } from '../../utils/validaciones';
import { Alerta, Cargando, Confirmacion, Encabezado, Vacio } from '../../components/ui';
import Totales from './Totales';
import Faltantes, { extraerFaltantes } from './Faltantes';

// ---------- Selección de cliente (HU10: el cliente debe existir) ----------
function SelectorCliente({ cliente, onSeleccionar, deshabilitado }) {
  const [texto, setTexto] = useState('');
  const termino = useDebounce(texto.trim());
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (termino.length < 2) {
      setResultados([]);
      setError('');
      return undefined;
    }
    let activo = true;
    setBuscando(true);
    const filtro = /^[0-9-]+$/.test(termino) ? { identificacion: termino } : { nombre: termino };
    listarClientes({ ...filtro, size: 8 })
      .then((r) => {
        if (!activo) return;
        setResultados(r.items);
        setError('');
      })
      .catch((e) => activo && setError(e.message))
      .finally(() => activo && setBuscando(false));
    return () => {
      activo = false;
    };
  }, [termino]);

  if (cliente) {
    return (
      <div className="seleccionado">
        <div>
          <strong>{cliente.nombre}</strong>
          <span className="texto-suave">
            {' '}· {cliente.identificacion} · {NOMBRE_TIPO_CLIENTE[cliente.tipo] || cliente.tipo}
          </span>
        </div>
        {!deshabilitado && (
          <button type="button" className="btn btn-secundario btn-sm" onClick={() => onSeleccionar(null)}>
            Cambiar
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="buscador">
      <label htmlFor="buscar-cliente" className="sr-only">Buscar cliente</label>
      <input
        id="buscar-cliente"
        type="search"
        className="control"
        placeholder="Escribe el nombre o la identificación del cliente…"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        autoComplete="off"
      />
      {buscando && <p className="texto-suave buscador-estado">Buscando…</p>}
      {error && <p className="error-campo buscador-estado">{error}</p>}
      {!buscando && !error && termino.length >= 2 && resultados.length === 0 && (
        <p className="texto-suave buscador-estado">
          No se encontró el cliente. <Link to="/clientes/nuevo">Registrar cliente nuevo</Link>
        </p>
      )}
      {resultados.length > 0 && (
        <ul className="buscador-resultados">
          {resultados.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => onSeleccionar(c)}>
                <strong>{c.nombre}</strong>
                <span>{c.identificacion} · {NOMBRE_TIPO_CLIENTE[c.tipo] || c.tipo}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------- Búsqueda de productos activos (HU11) ----------
function BuscadorProductos({ onAgregar, idsAgregados }) {
  const [texto, setTexto] = useState('');
  const termino = useDebounce(texto.trim());
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (termino.length < 2) {
      setResultados([]);
      setError('');
      return undefined;
    }
    let activo = true;
    setBuscando(true);
    listarProductos({ busqueda: termino, activo: true, size: 8 })
      .then((r) => {
        if (!activo) return;
        setResultados(r.items.filter((p) => p.activo !== false));
        setError('');
      })
      .catch((e) => activo && setError(e.message))
      .finally(() => activo && setBuscando(false));
    return () => {
      activo = false;
    };
  }, [termino]);

  return (
    <div className="buscador">
      <label htmlFor="buscar-producto" className="sr-only">Buscar producto</label>
      <input
        id="buscar-producto"
        type="search"
        className="control"
        placeholder="Busca un producto por nombre o código para agregarlo…"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        autoComplete="off"
      />
      {buscando && <p className="texto-suave buscador-estado">Buscando…</p>}
      {error && <p className="error-campo buscador-estado">{error}</p>}
      {!buscando && !error && termino.length >= 2 && resultados.length === 0 && (
        <p className="texto-suave buscador-estado">No hay productos activos que coincidan.</p>
      )}
      {resultados.length > 0 && (
        <ul className="buscador-resultados">
          {resultados.map((p) => {
            const agotado = Number(p.stock) <= 0;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  disabled={agotado}
                  onClick={() => {
                    onAgregar(p);
                    setTexto('');
                  }}
                >
                  <strong>
                    {p.nombre} <span className="texto-suave">({p.codigo})</span>
                  </strong>
                  <span>
                    {formatoMoneda(p.precio)} · {agotado ? 'Agotado' : `${formatoNumero(p.stock)} disponibles`}
                    {idsAgregados.has(p.id) ? ' · ya agregado (+1)' : ''}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ---------- Página: HU10 Crear pedido / HU11 Agregar productos / HU13 Total / HU14 Confirmar ----------
export default function PedidoFormPage() {
  const { id } = useParams();
  const esEdicion = Boolean(id);
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [cliente, setCliente] = useState(null);
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [faltantes, setFaltantes] = useState([]);
  const [confirmarAbierto, setConfirmarAbierto] = useState(false);
  const [intentoGuardar, setIntentoGuardar] = useState(false);

  // Carga inicial: pedido en borrador (edición) o cliente preseleccionado (?cliente=id).
  useEffect(() => {
    let activo = true;
    async function cargar() {
      try {
        if (esEdicion) {
          const pedido = await obtenerPedido(id);
          if (!activo) return;
          if (String(pedido.estado).toUpperCase() !== ESTADOS_PEDIDO.BORRADOR) {
            navigate(`/pedidos/${id}`, { replace: true });
            return;
          }
          setCliente(pedido.cliente ?? null);
          setItems(
            (pedido.items ?? []).map((i) => ({
              productoId: i.productoId ?? i.producto?.id,
              codigo: i.codigo ?? i.producto?.codigo,
              nombre: i.nombre ?? i.producto?.nombre,
              precioUnitario: i.precioUnitario,
              stock: i.stockDisponible ?? i.producto?.stock,
              cantidad: i.cantidad,
            }))
          );
        } else if (params.get('cliente')) {
          const c = await obtenerCliente(params.get('cliente'));
          if (activo) setCliente(c);
        }
      } catch (e) {
        if (activo) setError(e.message);
      } finally {
        if (activo) setCargando(false);
      }
    }
    cargar();
    return () => {
      activo = false;
    };
  }, [id, esEdicion, params, navigate]);

  const totales = useMemo(() => calcularTotales(items), [items]);
  const idsAgregados = useMemo(() => new Set(items.map((i) => i.productoId)), [items]);
  const erroresCantidad = items.map((i) => validarCantidad(i.cantidad));
  const hayErroresCantidad = erroresCantidad.some(Boolean);

  function agregarProducto(p) {
    setFaltantes([]);
    setItems((actuales) => {
      const existente = actuales.find((i) => i.productoId === p.id);
      if (existente) {
        return actuales.map((i) =>
          i.productoId === p.id ? { ...i, cantidad: (Number(i.cantidad) || 0) + 1, stock: p.stock } : i
        );
      }
      return [
        ...actuales,
        { productoId: p.id, codigo: p.codigo, nombre: p.nombre, precioUnitario: Number(p.precio), stock: p.stock, cantidad: 1 },
      ];
    });
  }

  function cambiarCantidad(productoId, valor) {
    setFaltantes([]);
    setItems((actuales) => actuales.map((i) => (i.productoId === productoId ? { ...i, cantidad: valor } : i)));
  }

  function quitarItem(productoId) {
    setFaltantes([]);
    setItems((actuales) => actuales.filter((i) => i.productoId !== productoId));
  }

  function validarAntesDeGuardar() {
    setIntentoGuardar(true);
    if (!cliente) {
      setError('Selecciona el cliente del pedido.');
      return false;
    }
    if (items.length === 0) {
      setError('Agrega al menos un producto al pedido.');
      return false;
    }
    if (hayErroresCantidad) {
      setError('Revisa las cantidades: deben ser enteros mayores que cero.');
      return false;
    }
    setError('');
    return true;
  }

  async function guardar({ confirmar }) {
    setGuardando(true);
    setError('');
    setFaltantes([]);
    let pedidoId = id;
    try {
      const datos = { clienteId: cliente.id, items };
      const guardado = esEdicion ? await actualizarPedido(id, datos) : await crearPedido(datos);
      pedidoId = guardado?.id ?? id;

      if (confirmar) {
        await confirmarPedido(pedidoId);
        navigate(`/pedidos/${pedidoId}`, { replace: true, state: { mensaje: 'Pedido confirmado. El inventario fue actualizado.' } });
      } else {
        navigate(`/pedidos/${pedidoId}`, { replace: true, state: { mensaje: 'Pedido guardado como borrador.' } });
      }
    } catch (e) {
      const lista = extraerFaltantes(e);
      if (lista.length) setFaltantes(lista);
      else setError(e.message);
      // Si el borrador se creó pero la confirmación falló, se pasa a editar ese borrador.
      if (!esEdicion && pedidoId) {
        navigate(`/pedidos/${pedidoId}/editar`, { replace: true });
      }
      setGuardando(false);
    } finally {
      setConfirmarAbierto(false);
    }
  }

  if (cargando) return <Cargando />;

  return (
    <>
      <Link to={esEdicion ? `/pedidos/${id}` : '/pedidos'} className="volver">← Volver</Link>
      <Encabezado
        titulo={esEdicion ? 'Editar pedido (borrador)' : 'Nuevo pedido'}
        descripcion="Selecciona el cliente, agrega los productos y revisa el total antes de confirmar."
      />

      <Alerta onCerrar={() => setError('')}>{error}</Alerta>
      <Faltantes faltantes={faltantes} />

      <section className="tarjeta">
        <h2>1. Cliente</h2>
        <SelectorCliente cliente={cliente} onSeleccionar={setCliente} deshabilitado={guardando} />
        {intentoGuardar && !cliente && <p className="error-campo">Selecciona un cliente.</p>}
      </section>

      <section className="tarjeta">
        <h2>2. Productos</h2>
        <BuscadorProductos onAgregar={agregarProducto} idsAgregados={idsAgregados} />

        {items.length === 0 ? (
          <Vacio titulo="El pedido no tiene productos">Busca un producto arriba para agregarlo.</Vacio>
        ) : (
          <div className="tabla-contenedor" style={{ marginTop: '1rem' }}>
            <table className="tabla">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th className="num">Precio unit.</th>
                  <th className="num">Cantidad</th>
                  <th className="num">Subtotal</th>
                  <th className="acciones" />
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const errorCantidad = erroresCantidad[idx];
                  const superaStock =
                    item.stock !== undefined && item.stock !== null && Number(item.cantidad) > Number(item.stock);
                  const faltante = faltantes.find((f) => f.productoId === item.productoId);
                  return (
                    <tr key={item.productoId}>
                      <td>
                        <strong>{item.nombre}</strong>
                        <div className="texto-suave" style={{ fontSize: '0.8rem' }}>
                          {item.codigo}
                          {item.stock !== undefined && item.stock !== null && ` · ${formatoNumero(item.stock)} disponibles`}
                        </div>
                        {(superaStock || faltante) && (
                          <div className="texto-error" style={{ fontSize: '0.8rem' }}>
                            La cantidad supera el stock disponible.
                          </div>
                        )}
                      </td>
                      <td className="num">{formatoMoneda(item.precioUnitario)}</td>
                      <td className="num">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          className="control input-cantidad"
                          value={item.cantidad}
                          onChange={(e) => cambiarCantidad(item.productoId, e.target.value)}
                          aria-label={`Cantidad de ${item.nombre}`}
                          aria-invalid={Boolean(errorCantidad) || superaStock}
                          disabled={guardando}
                        />
                        {errorCantidad && <div className="error-campo">Debe ser mayor que 0</div>}
                      </td>
                      <td className="num">{formatoMoneda(subtotalItem(item))}</td>
                      <td className="acciones">
                        <button
                          type="button"
                          className="btn-icono"
                          onClick={() => quitarItem(item.productoId)}
                          aria-label={`Quitar ${item.nombre}`}
                          disabled={guardando}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="tarjeta">
        <h2>3. Resumen</h2>
        <Totales {...totales} />
        <div className="form-acciones">
          <Link to={esEdicion ? `/pedidos/${id}` : '/pedidos'} className="btn btn-secundario">Cancelar</Link>
          <button
            type="button"
            className="btn btn-secundario"
            disabled={guardando}
            onClick={() => validarAntesDeGuardar() && guardar({ confirmar: false })}
          >
            {guardando ? 'Guardando…' : 'Guardar borrador'}
          </button>
          <button
            type="button"
            className="btn"
            disabled={guardando}
            onClick={() => validarAntesDeGuardar() && setConfirmarAbierto(true)}
          >
            Confirmar pedido
          </button>
        </div>
      </section>

      <Confirmacion
        abierta={confirmarAbierto}
        titulo="¿Confirmar pedido?"
        textoConfirmar="Sí, confirmar"
        ocupado={guardando}
        onCancelar={() => setConfirmarAbierto(false)}
        onConfirmar={() => guardar({ confirmar: true })}
      >
        <p>
          Cliente: <strong>{cliente?.nombre}</strong>
          <br />
          Total: <strong>{formatoMoneda(totales.total)}</strong> ({items.length} producto(s))
        </p>
        <p>Una vez confirmado, el pedido no se puede editar y se descontará del inventario.</p>
      </Confirmacion>
    </>
  );
}
