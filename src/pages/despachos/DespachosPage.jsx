import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDatos } from '../../hooks/useDatos';
import ventasService from '../../services/ventasService';
import { BODEGAS, CANALES, ESTADOS_DESPACHO, esPedido, nombreBodega, SIGUIENTE_ESTADO } from '../../services/catalogos';
import { formatoFecha, formatoNumero } from '../../utils/formato';
import { Aviso, EncabezadoPagina, EstadoDatos } from '../../components/UI';
import { InsigniaDespacho } from '../../components/Insignias';

const ACCION = { PENDIENTE: 'Marcar preparado', PREPARADO: 'Marcar despachado', DESPACHADO: 'Confirmar entrega' };

// Pedidos mayoristas (WhatsApp / teléfono) que bodega debe preparar y despachar.
export default function DespachosPage() {
  const { datos, cargando, error, recargar } = useDatos(() => ventasService.listar());
  const [estado, setEstado] = useState('PENDIENTE');
  const [bodega, setBodega] = useState('');
  const [procesando, setProcesando] = useState(null);
  const [aviso, setAviso] = useState(null);

  const pedidos = (datos ?? []).filter((v) => esPedido(v.canal) && v.estado !== 'ANULADA');
  const conteo = Object.fromEntries(Object.keys(ESTADOS_DESPACHO).map((k) => [k, pedidos.filter((p) => p.estadoDespacho === k).length]));
  const lista = pedidos
    .filter((p) => p.estadoDespacho === estado && (!bodega || String(p.bodegaId) === bodega))
    .sort((a, b) => (estado === 'ENTREGADO' ? b.fecha.localeCompare(a.fecha) : a.fecha.localeCompare(b.fecha)));

  async function avanzar(p) {
    setProcesando(p.id);
    try {
      const v = await ventasService.avanzarDespacho(p.id);
      setAviso({ tipo: 'exito', texto: `Pedido ${v.numero}: ${ESTADOS_DESPACHO[v.estadoDespacho].toLowerCase()}.` });
      await recargar();
    } catch (e) {
      setAviso({ tipo: 'error', texto: e.message });
    } finally {
      setProcesando(null);
    }
  }

  return (
    <>
      <EncabezadoPagina titulo="Despachos" descripcion="Los vendedores ven el estado de cada pedido en cuanto lo actualizas aquí." />
      <Aviso aviso={aviso} onCerrar={() => setAviso(null)} />

      <div className="pestanas" role="tablist">
        {Object.entries(ESTADOS_DESPACHO).map(([k, v]) => (
          <button key={k} type="button" role="tab" aria-selected={estado === k} onClick={() => setEstado(k)}>
            {v} <span className="pestana-conteo">{conteo[k] ?? 0}</span>
          </button>
        ))}
      </div>
      <div className="filtros">
        <select aria-label="Bodega" value={bodega} onChange={(e) => setBodega(e.target.value)}>
          <option value="">Todas las bodegas</option>
          {BODEGAS.map((b) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
        </select>
      </div>

      <EstadoDatos cargando={cargando && !datos} error={error} vacio={lista.length === 0} textoVacio={`No hay pedidos en estado "${ESTADOS_DESPACHO[estado].toLowerCase()}".`} onReintentar={recargar}>
        <div className="tarjetas">
          {lista.map((p) => (
            <article key={p.id} className="tarjeta-pedido">
              <header>
                <div>
                  <Link to={`/ventas/${p.id}`}><strong>{p.numero}</strong></Link>
                  <span className="texto-suave"> · {formatoFecha(p.fecha)}</span>
                </div>
                <InsigniaDespacho estado={p.estadoDespacho} />
              </header>
              <p><strong>{p.clienteNombre}</strong></p>
              <p className="texto-suave">{p.direccionEntrega || 'Sin dirección'}</p>
              <p className="texto-suave">{CANALES[p.canal]} · Sale de {nombreBodega(p.bodegaId)} · Vendedor: {p.vendedorNombre}</p>
              {p.observaciones && <p className="nota">{p.observaciones}</p>}
              <ul className="lista-items">
                {p.items.map((it) => (
                  <li key={it.productoId}><strong>{formatoNumero(it.cantidad)}</strong> {it.unidad} · {it.nombre}</li>
                ))}
              </ul>
              {SIGUIENTE_ESTADO[p.estadoDespacho] && (
                <button type="button" className="btn btn-bloque" onClick={() => avanzar(p)} disabled={procesando === p.id}>
                  {procesando === p.id ? 'Guardando…' : ACCION[p.estadoDespacho]}
                </button>
              )}
            </article>
          ))}
        </div>
      </EstadoDatos>
    </>
  );
}
