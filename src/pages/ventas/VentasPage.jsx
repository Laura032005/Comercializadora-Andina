import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDatos } from '../../hooks/useDatos';
import ventasService from '../../services/ventasService';
import { CANALES, ESTADOS_DESPACHO, esPedido } from '../../services/catalogos';
import { enRango, fechaInput, formatoFecha, formatoMoneda, inicioDeMes } from '../../utils/formato';
import { EncabezadoPagina, EstadoDatos } from '../../components/UI';
import { InsigniaCanal, InsigniaVenta } from '../../components/Insignias';

export default function VentasPage() {
  const { usuario } = useAuth();
  const esVendedor = usuario.rol === 'VENDEDOR';
  const [verTodas, setVerTodas] = useState(false);
  const soloMias = esVendedor && !verTodas;

  const { datos, cargando, error, recargar } = useDatos(
    () => ventasService.listar(soloMias ? { vendedor: usuario.username } : {}),
    [soloMias, usuario.username]
  );

  const [filtros, setFiltros] = useState({
    desde: fechaInput(new Date(Date.now() - 30 * 24 * 3600 * 1000)),
    hasta: fechaInput(),
    canal: '',
    estado: '',
    texto: '',
  });
  const cambiar = (e) => setFiltros((f) => ({ ...f, [e.target.name]: e.target.value }));

  const texto = filtros.texto.trim().toLowerCase();
  const ventas = (datos ?? []).filter((v) => {
    if (!enRango(v.fecha, filtros.desde, filtros.hasta)) return false;
    if (filtros.canal && v.canal !== filtros.canal) return false;
    if (filtros.estado === 'ANULADA' && v.estado !== 'ANULADA') return false;
    if (filtros.estado && filtros.estado !== 'ANULADA' && (v.estado === 'ANULADA' || !esPedido(v.canal) || v.estadoDespacho !== filtros.estado)) return false;
    if (texto && !v.numero.toLowerCase().includes(texto) && !v.clienteNombre.toLowerCase().includes(texto) && !v.factura.numero.toLowerCase().includes(texto)) return false;
    return true;
  });
  const total = ventas.filter((v) => v.estado !== 'ANULADA').reduce((s, v) => s + v.total, 0);

  return (
    <>
      <EncabezadoPagina
        titulo={soloMias ? 'Mis ventas y pedidos' : 'Ventas y pedidos'}
        descripcion="El estado del pedido se actualiza cuando bodega lo prepara y despacha: no hace falta llamar a la bodega."
        acciones={esVendedor && <Link className="btn" to="/ventas/nueva">Nueva venta</Link>}
      />

      <div className="filtros">
        <label>Desde <input type="date" name="desde" value={filtros.desde} onChange={cambiar} /></label>
        <label>Hasta <input type="date" name="hasta" value={filtros.hasta} onChange={cambiar} /></label>
        <select name="canal" aria-label="Canal" value={filtros.canal} onChange={cambiar}>
          <option value="">Todos los canales</option>
          {Object.entries(CANALES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select name="estado" aria-label="Estado" value={filtros.estado} onChange={cambiar}>
          <option value="">Todos los estados</option>
          {Object.entries(ESTADOS_DESPACHO).map(([k, v]) => <option key={k} value={k}>Pedido {v.toLowerCase()}</option>)}
          <option value="ANULADA">Anuladas</option>
        </select>
        <input type="search" name="texto" placeholder="N.º de venta, factura o cliente" aria-label="Buscar" value={filtros.texto} onChange={cambiar} />
        {esVendedor && (
          <label className="check">
            <input type="checkbox" checked={verTodas} onChange={(e) => setVerTodas(e.target.checked)} /> Ver las de todos los vendedores
          </label>
        )}
        <button type="button" className="btn-enlace" onClick={() => setFiltros((f) => ({ ...f, desde: fechaInput(inicioDeMes()), hasta: fechaInput() }))}>Este mes</button>
      </div>

      <p className="resumen-filtro">
        {ventas.length} registro(s) · Total vendido (sin anuladas): <strong>{formatoMoneda(total)}</strong>
      </p>

      <EstadoDatos cargando={cargando && !datos} error={error} vacio={ventas.length === 0} textoVacio="No hay ventas con esos filtros." onReintentar={recargar}>
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th>Venta</th><th>Fecha</th><th>Cliente</th><th>Canal</th>
                {!soloMias && <th>Vendedor</th>}
                <th className="num">Total</th><th>Estado</th><th className="acciones" />
              </tr>
            </thead>
            <tbody>
              {ventas.map((v) => (
                <tr key={v.id} className={v.estado === 'ANULADA' ? 'fila-inactiva' : ''}>
                  <td><Link to={`/ventas/${v.id}`}>{v.numero}</Link></td>
                  <td>{formatoFecha(v.fecha)}</td>
                  <td>{v.clienteNombre}</td>
                  <td><InsigniaCanal canal={v.canal} /></td>
                  {!soloMias && <td>{v.vendedorNombre}</td>}
                  <td className="num">{formatoMoneda(v.total)}</td>
                  <td><InsigniaVenta venta={v} /></td>
                  <td className="acciones"><Link className="btn-enlace" to={`/ventas/${v.id}/factura`}>Factura</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </EstadoDatos>
    </>
  );
}
