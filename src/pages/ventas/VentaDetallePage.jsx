import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDatos } from '../../hooks/useDatos';
import ventasService from '../../services/ventasService';
import { CANALES, ESTADOS_DESPACHO, esPedido, nombreBodega, TIPOS_CLIENTE } from '../../services/catalogos';
import { formatoFecha, formatoMoneda, formatoNumero } from '../../utils/formato';
import { Aviso, Campo, EncabezadoPagina, EstadoDatos, Modal } from '../../components/UI';
import { InsigniaVenta } from '../../components/Insignias';

const PASOS = Object.keys(ESTADOS_DESPACHO);

export default function VentaDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const { datos: venta, cargando, error, recargar } = useDatos(() => ventasService.obtener(id), [id]);
  const [anulando, setAnulando] = useState(false);
  const [aviso, setAviso] = useState(null);

  const puedeAnular =
    usuario.rol === 'ADMIN' &&
    venta?.estado !== 'ANULADA' &&
    !(esPedido(venta?.canal) && ['DESPACHADO', 'ENTREGADO'].includes(venta?.estadoDespacho));

  return (
    <EstadoDatos cargando={cargando && !venta} error={error} onReintentar={recargar}>
      {venta && (
        <>
          <EncabezadoPagina
            titulo={`Venta ${venta.numero}`}
            descripcion={`${formatoFecha(venta.fecha)} · ${CANALES[venta.canal]} · Vendedor: ${venta.vendedorNombre}`}
            acciones={
              <>
                <button type="button" className="btn btn-secundario" onClick={() => navigate(-1)}>Volver</button>
                <Link className="btn" to={`/ventas/${venta.id}/factura`}>Factura {venta.factura.numero}</Link>
                {puedeAnular && <button type="button" className="btn btn-peligro" onClick={() => setAnulando(true)}>Anular</button>}
              </>
            }
          />
          <Aviso aviso={aviso} onCerrar={() => setAviso(null)} />

          {venta.estado === 'ANULADA' && (
            <div className="alerta-error" role="status">
              Venta anulada{venta.anulacion ? ` el ${formatoFecha(venta.anulacion.fecha)} por @${venta.anulacion.usuario}: ${venta.anulacion.motivo}` : ''}.
              Las unidades volvieron a {nombreBodega(venta.bodegaId)} y la factura quedó sin efecto.
            </div>
          )}

          <div className="dos-columnas">
            <section className="panel">
              <h2>Cliente</h2>
              <dl className="datos">
                <dt>Nombre</dt><dd>{venta.clienteId ? <Link to={`/clientes/${venta.clienteId}`}>{venta.clienteNombre}</Link> : venta.clienteNombre}</dd>
                <dt>Documento</dt><dd>{venta.clienteDocumento}</dd>
                <dt>Tipo</dt><dd>{TIPOS_CLIENTE[venta.clienteTipo] ?? '—'}</dd>
                {esPedido(venta.canal) && (<><dt>Entrega en</dt><dd>{venta.direccionEntrega || '—'}</dd></>)}
                {venta.observaciones && (<><dt>Observaciones</dt><dd>{venta.observaciones}</dd></>)}
              </dl>
            </section>

            <section className="panel">
              <h2>Estado</h2>
              <p><InsigniaVenta venta={venta} /> · Sale de {nombreBodega(venta.bodegaId)}</p>
              {esPedido(venta.canal) && venta.estado !== 'ANULADA' && (
                <ol className="pasos">
                  {PASOS.map((p) => {
                    const hecho = PASOS.indexOf(p) <= PASOS.indexOf(venta.estadoDespacho);
                    const registro = venta.historialDespacho?.find((h) => h.estado === p);
                    return (
                      <li key={p} className={hecho ? 'paso-hecho' : ''}>
                        <span aria-hidden="true">{hecho ? '✓' : '○'}</span> {ESTADOS_DESPACHO[p]}
                        {registro && <span className="texto-suave"> · {formatoFecha(registro.fecha)}</span>}
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>
          </div>

          <section className="panel">
            <h2>Productos</h2>
            <div className="tabla-contenedor">
              <table className="tabla">
                <thead><tr><th>Código</th><th>Producto</th><th className="num">Cantidad</th><th className="num">Precio unitario</th><th className="num">Subtotal</th></tr></thead>
                <tbody>
                  {venta.items.map((it) => (
                    <tr key={it.productoId}>
                      <td>{it.codigo}</td><td>{it.nombre}</td>
                      <td className="num">{formatoNumero(it.cantidad)} {it.unidad}</td>
                      <td className="num">{formatoMoneda(it.precioUnitario)}</td>
                      <td className="num">{formatoMoneda(it.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <dl className="totales">
              <dt>Subtotal</dt><dd>{formatoMoneda(venta.subtotal)}</dd>
              <dt>IVA</dt><dd>{formatoMoneda(venta.iva)}</dd>
              <dt className="total">Total</dt><dd className="total">{formatoMoneda(venta.total)}</dd>
            </dl>
          </section>

          <Modal titulo={`Anular venta ${venta.numero}`} abierto={anulando} onCerrar={() => setAnulando(false)}>
            {anulando && (
              <AnularForm
                venta={venta}
                onCancelar={() => setAnulando(false)}
                onAnulada={() => {
                  setAnulando(false);
                  setAviso({ tipo: 'exito', texto: 'Venta anulada. El inventario se restableció.' });
                  recargar();
                }}
                usuario={usuario}
              />
            )}
          </Modal>
        </>
      )}
    </EstadoDatos>
  );
}

function AnularForm({ venta, usuario, onAnulada, onCancelar }) {
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function confirmar(e) {
    e.preventDefault();
    if (motivo.trim().length < 5) return setError('Escribe el motivo de la anulación (mínimo 5 caracteres).');
    setEnviando(true);
    try {
      await ventasService.anular(venta.id, motivo, usuario);
      onAnulada();
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={confirmar} noValidate className="formulario">
      <p>
        Se anulará la venta y la factura {venta.factura.numero} por {formatoMoneda(venta.total)}, y las unidades
        volverán a {nombreBodega(venta.bodegaId)}. Esta acción no se puede deshacer.
      </p>
      <Campo id="motivo" label="Motivo" error={error}>
        <textarea id="motivo" rows={3} value={motivo} onChange={(e) => { setMotivo(e.target.value); setError(''); }} maxLength={200} />
      </Campo>
      <div className="formulario-acciones">
        <button type="button" className="btn btn-secundario" onClick={onCancelar} disabled={enviando}>Cancelar</button>
        <button type="submit" className="btn btn-peligro" disabled={enviando}>{enviando ? 'Anulando…' : 'Anular venta'}</button>
      </div>
    </form>
  );
}
