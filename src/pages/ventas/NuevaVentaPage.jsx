import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDatos } from '../../hooks/useDatos';
import clientesService from '../../services/clientesService';
import productosService from '../../services/productosService';
import ventasService from '../../services/ventasService';
import { BODEGAS, CANALES, esPedido, nombreBodega, stockEn } from '../../services/catalogos';
import { IVA } from '../../services/config';
import { formatoMoneda, formatoNumero } from '../../utils/formato';
import { Campo, EncabezadoPagina, EstadoDatos, Modal } from '../../components/UI';
import ClienteForm from '../clientes/ClienteForm';

const VENTA_VACIA = { clienteId: '', canal: 'MOSTRADOR', bodegaId: '1', direccionEntrega: '', observaciones: '' };

export default function NuevaVentaPage() {
  const { usuario } = useAuth();
  const { datos, cargando, error, recargar } = useDatos(() =>
    Promise.all([clientesService.listar(), productosService.listar()])
  );
  const [clientes, productos] = datos ?? [[], []];

  const [venta, setVenta] = useState(VENTA_VACIA);
  const [carrito, setCarrito] = useState([]); // [{ productoId, cantidad }]
  const [seleccion, setSeleccion] = useState({ productoId: '', cantidad: '1' });
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [registrada, setRegistrada] = useState(null);
  const [nuevoCliente, setNuevoCliente] = useState(false);

  const bodegaId = Number(venta.bodegaId);
  const pedido = esPedido(venta.canal);
  const cliente = clientes.find((c) => c.id === Number(venta.clienteId));
  const productosVenta = productos.filter((p) => p.activo);
  const porId = useMemo(() => Object.fromEntries(productos.map((p) => [p.id, p])), [productos]);

  const lineas = carrito.map((l) => {
    const p = porId[l.productoId];
    return { ...l, producto: p, subtotal: p.precio * l.cantidad, excede: l.cantidad > stockEn(p, bodegaId) };
  });
  const subtotal = lineas.reduce((s, l) => s + l.subtotal, 0);
  const iva = Math.round(subtotal * IVA);
  const hayExceso = lineas.some((l) => l.excede);

  function cambiarVenta(e) {
    const { name, value } = e.target;
    setVenta((v) => {
      const nueva = { ...v, [name]: value };
      if (name === 'clienteId') {
        const c = clientes.find((x) => x.id === Number(value));
        nueva.direccionEntrega = c?.direccion ?? '';
        if (c?.tipo === 'MAYORISTA' && v.canal === 'MOSTRADOR') nueva.canal = 'WHATSAPP';
      }
      return nueva;
    });
    setErrores((er) => ({ ...er, [name]: undefined }));
    setErrorGeneral('');
  }

  function agregar(e) {
    e.preventDefault();
    const p = porId[seleccion.productoId];
    const cantidad = Number(seleccion.cantidad);
    if (!p) return setErrores((er) => ({ ...er, producto: 'Selecciona un producto.' }));
    if (!Number.isInteger(cantidad) || cantidad < 1) return setErrores((er) => ({ ...er, producto: 'La cantidad debe ser un entero mayor que 0.' }));
    const yaEnCarrito = carrito.find((l) => l.productoId === p.id)?.cantidad ?? 0;
    const disponible = stockEn(p, bodegaId);
    if (yaEnCarrito + cantidad > disponible) {
      return setErrores((er) => ({ ...er, producto: `Solo hay ${formatoNumero(disponible)} ${p.unidad} de ${p.nombre} en ${nombreBodega(bodegaId)}.` }));
    }
    setCarrito((c) =>
      yaEnCarrito ? c.map((l) => (l.productoId === p.id ? { ...l, cantidad: l.cantidad + cantidad } : l)) : [...c, { productoId: p.id, cantidad }]
    );
    setSeleccion({ productoId: '', cantidad: '1' });
    setErrores((er) => ({ ...er, producto: undefined, carrito: undefined }));
  }

  function cambiarCantidad(productoId, valor) {
    const cantidad = Math.max(1, Math.floor(Number(valor) || 1));
    setCarrito((c) => c.map((l) => (l.productoId === productoId ? { ...l, cantidad } : l)));
  }

  async function registrar() {
    const errs = {};
    if (!cliente) errs.clienteId = 'Selecciona el cliente.';
    if (carrito.length === 0) errs.carrito = 'Agrega al menos un producto.';
    if (pedido && !venta.direccionEntrega.trim()) errs.direccionEntrega = 'Indica la dirección de entrega del pedido.';
    setErrores(errs);
    if (Object.keys(errs).length || hayExceso) return;

    setGuardando(true);
    setErrorGeneral('');
    try {
      const v = await ventasService.registrar({ ...venta, bodegaId, items: carrito }, usuario);
      setRegistrada(v);
      setVenta(VENTA_VACIA);
      setCarrito([]);
      recargar(); // existencias actualizadas
    } catch (err) {
      setErrorGeneral(err.message);
      recargar();
    } finally {
      setGuardando(false);
    }
  }

  if (registrada) {
    return (
      <div className="panel panel-exito">
        <h1>✓ Venta {registrada.numero} registrada</h1>
        <p>
          Factura <strong>{registrada.factura.numero}</strong> por <strong>{formatoMoneda(registrada.total)}</strong> a {registrada.clienteNombre}.
          El inventario de {nombreBodega(registrada.bodegaId)} ya se descontó.
        </p>
        {esPedido(registrada.canal) && <p>El pedido quedó <strong>pendiente</strong> en bodega para su despacho.</p>}
        <div className="formulario-acciones izquierda">
          <Link className="btn" to={`/ventas/${registrada.id}/factura`}>Ver factura</Link>
          <Link className="btn btn-secundario" to={`/ventas/${registrada.id}`}>Ver detalle</Link>
          <button type="button" className="btn btn-secundario" onClick={() => setRegistrada(null)}>Registrar otra venta</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <EncabezadoPagina titulo="Nueva venta" descripcion="El stock se valida contra la bodega elegida y se descuenta al registrar." />
      <EstadoDatos cargando={cargando && !datos} error={error} onReintentar={recargar}>
        {errorGeneral && <div className="alerta-error" role="alert">{errorGeneral}</div>}

        <div className="venta-grid">
          <section className="panel">
            <h2>1. Cliente y tipo de venta</h2>
            <div className="formulario">
              <Campo id="v-cliente" label="Cliente" error={errores.clienteId}>
                <div className="campo-con-boton">
                  <select id="v-cliente" name="clienteId" value={venta.clienteId} onChange={cambiarVenta}>
                    <option value="">Selecciona…</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre} ({c.documento}){c.tipo === 'MAYORISTA' ? ' · Mayorista' : ''}</option>
                    ))}
                  </select>
                  <button type="button" className="btn btn-secundario" onClick={() => setNuevoCliente(true)}>Nuevo</button>
                </div>
              </Campo>
              <div className="formulario-fila">
                <Campo id="v-canal" label="Canal">
                  <select id="v-canal" name="canal" value={venta.canal} onChange={cambiarVenta}>
                    {Object.entries(CANALES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </Campo>
                <Campo id="v-bodega" label="Sale de" ayuda={carrito.length ? 'Cambiar de bodega revalida el stock.' : undefined}>
                  <select id="v-bodega" name="bodegaId" value={venta.bodegaId} onChange={cambiarVenta}>
                    {BODEGAS.map((b) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                  </select>
                </Campo>
              </div>
              {pedido && (
                <Campo id="v-direccion" label="Dirección de entrega" error={errores.direccionEntrega}>
                  <input id="v-direccion" name="direccionEntrega" value={venta.direccionEntrega} onChange={cambiarVenta} maxLength={150} />
                </Campo>
              )}
              <Campo id="v-obs" label="Observaciones (opcional)">
                <input id="v-obs" name="observaciones" value={venta.observaciones} onChange={cambiarVenta} maxLength={200} placeholder={pedido ? 'Ej.: entregar en portería de la obra, horario 7 a. m. a 4 p. m.' : ''} />
              </Campo>
            </div>
          </section>

          <section className="panel">
            <h2>2. Productos</h2>
            <form className="agregar-producto" onSubmit={agregar} noValidate>
              <Campo id="v-producto" label="Producto" error={errores.producto}>
                <select id="v-producto" value={seleccion.productoId} onChange={(e) => setSeleccion((s) => ({ ...s, productoId: e.target.value }))}>
                  <option value="">Selecciona…</option>
                  {productosVenta.map((p) => {
                    const disp = stockEn(p, bodegaId);
                    return (
                      <option key={p.id} value={p.id} disabled={disp === 0}>
                        {p.codigo} · {p.nombre} — {formatoMoneda(p.precio)} ({disp === 0 ? 'sin stock' : `${formatoNumero(disp)} ${p.unidad}`})
                      </option>
                    );
                  })}
                </select>
              </Campo>
              <Campo id="v-cantidad" label="Cantidad">
                <input id="v-cantidad" type="number" min="1" step="1" value={seleccion.cantidad} onChange={(e) => setSeleccion((s) => ({ ...s, cantidad: e.target.value }))} />
              </Campo>
              <button type="submit" className="btn">Agregar</button>
            </form>

            {errores.carrito && <p className="error-campo">{errores.carrito}</p>}
            {lineas.length > 0 && (
              <div className="tabla-contenedor">
                <table className="tabla">
                  <thead>
                    <tr><th>Producto</th><th className="num">Precio</th><th className="num">Cantidad</th><th className="num">Subtotal</th><th /></tr>
                  </thead>
                  <tbody>
                    {lineas.map((l) => (
                      <tr key={l.productoId}>
                        <td>
                          {l.producto.nombre}
                          {l.excede && <p className="error-campo">Solo hay {formatoNumero(stockEn(l.producto, bodegaId))} en {nombreBodega(bodegaId)}.</p>}
                        </td>
                        <td className="num">{formatoMoneda(l.producto.precio)}</td>
                        <td className="num">
                          <input
                            className="input-cantidad"
                            type="number" min="1" step="1"
                            aria-label={`Cantidad de ${l.producto.nombre}`}
                            value={l.cantidad}
                            onChange={(e) => cambiarCantidad(l.productoId, e.target.value)}
                          />
                        </td>
                        <td className="num">{formatoMoneda(l.subtotal)}</td>
                        <td>
                          <button type="button" className="btn-enlace" onClick={() => setCarrito((c) => c.filter((x) => x.productoId !== l.productoId))}>
                            Quitar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <dl className="totales">
              <dt>Subtotal</dt><dd>{formatoMoneda(subtotal)}</dd>
              <dt>IVA ({Math.round(IVA * 100)} %)</dt><dd>{formatoMoneda(iva)}</dd>
              <dt className="total">Total</dt><dd className="total">{formatoMoneda(subtotal + iva)}</dd>
            </dl>

            <button type="button" className="btn btn-bloque" onClick={registrar} disabled={guardando || hayExceso}>
              {guardando ? 'Registrando…' : pedido ? 'Registrar pedido y facturar' : 'Registrar venta y facturar'}
            </button>
          </section>
        </div>
      </EstadoDatos>

      <Modal titulo="Nuevo cliente" abierto={nuevoCliente} onCerrar={() => setNuevoCliente(false)}>
        {nuevoCliente && (
          <ClienteForm
            onCancelar={() => setNuevoCliente(false)}
            onGuardado={async (c) => {
              setNuevoCliente(false);
              await recargar();
              setVenta((v) => ({
                ...v,
                clienteId: String(c.id),
                direccionEntrega: c.direccion,
                canal: c.tipo === 'MAYORISTA' && v.canal === 'MOSTRADOR' ? 'WHATSAPP' : v.canal,
              }));
            }}
          />
        )}
      </Modal>
    </>
  );
}
