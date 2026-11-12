import { useState } from 'react';
import { useDatos } from '../../hooks/useDatos';
import productosService from '../../services/productosService';
import inventarioService from '../../services/inventarioService';
import { BODEGAS, nombreBodega, stockEn, stockTotal, TIPOS_MOVIMIENTO } from '../../services/catalogos';
import { descargarCsv, enRango, fechaInput, formatoFecha, formatoMoneda, formatoNumero } from '../../utils/formato';
import { EncabezadoPagina, EstadoDatos, Indicador } from '../../components/UI';
import { InsigniaStock, nivelStock } from '../../components/Insignias';

export default function InventarioPage() {
  const [pestana, setPestana] = useState('existencias');
  return (
    <>
      <EncabezadoPagina
        titulo="Inventario"
        descripcion="Existencias en tiempo real: cada venta, entrada, traslado y anulación se refleja de inmediato."
      />
      <div className="pestanas" role="tablist">
        <button type="button" role="tab" aria-selected={pestana === 'existencias'} onClick={() => setPestana('existencias')}>Existencias</button>
        <button type="button" role="tab" aria-selected={pestana === 'movimientos'} onClick={() => setPestana('movimientos')}>Movimientos</button>
      </div>
      {pestana === 'existencias' ? <Existencias /> : <Movimientos />}
    </>
  );
}

function Existencias() {
  const { datos, cargando, error, recargar } = useDatos(() => productosService.listar());
  const [texto, setTexto] = useState('');
  const [nivel, setNivel] = useState('');
  const [bodega, setBodega] = useState('');

  const productos = (datos ?? []).filter((p) => p.activo);
  const t = texto.trim().toLowerCase();
  const cantidad = (p) => (bodega ? stockEn(p, bodega) : stockTotal(p));
  const filtrados = productos.filter(
    (p) =>
      (!t || p.nombre.toLowerCase().includes(t) || p.codigo.toLowerCase().includes(t)) &&
      (!nivel || (nivel === 'ALERTA' ? nivelStock(p) !== 'OK' : nivelStock(p) === nivel))
  );
  const enAlerta = productos.filter((p) => nivelStock(p) !== 'OK').length;
  const valor = productos.reduce((s, p) => s + cantidad(p) * p.precio, 0);

  function exportar() {
    descargarCsv(
      `inventario-${fechaInput()}.csv`,
      ['Código', 'Producto', 'Categoría', 'Unidad', ...BODEGAS.map((b) => b.nombre), 'Total', 'Stock mínimo', 'Precio', 'Valor'],
      filtrados.map((p) => [
        p.codigo, p.nombre, p.categoria, p.unidad, ...BODEGAS.map((b) => stockEn(p, b.id)),
        stockTotal(p), p.stockMinimo, p.precio, stockTotal(p) * p.precio,
      ])
    );
  }

  return (
    <EstadoDatos cargando={cargando && !datos} error={error} onReintentar={recargar}>
      <div className="indicadores">
        <Indicador titulo="Productos activos" valor={formatoNumero(productos.length)} />
        <Indicador titulo={`Unidades ${bodega ? `en ${nombreBodega(bodega)}` : 'en total'}`} valor={formatoNumero(productos.reduce((s, p) => s + cantidad(p), 0))} />
        <Indicador titulo="Valor a precio de venta (sin IVA)" valor={formatoMoneda(valor)} />
        <Indicador titulo="Productos agotados o bajo el mínimo" valor={formatoNumero(enAlerta)} tono={enAlerta ? 'alerta' : undefined} />
      </div>

      <div className="filtros">
        <input type="search" placeholder="Buscar producto" aria-label="Buscar producto" value={texto} onChange={(e) => setTexto(e.target.value)} />
        <select aria-label="Bodega" value={bodega} onChange={(e) => setBodega(e.target.value)}>
          <option value="">Todas las bodegas</option>
          {BODEGAS.map((b) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
        </select>
        <select aria-label="Nivel de stock" value={nivel} onChange={(e) => setNivel(e.target.value)}>
          <option value="">Todos los niveles</option>
          <option value="ALERTA">Solo con alerta</option>
          <option value="BAJO">Stock bajo</option>
          <option value="AGOTADO">Agotados</option>
        </select>
        <button type="button" className="btn btn-secundario" onClick={exportar} disabled={!filtrados.length}>Exportar CSV</button>
      </div>

      <EstadoDatos vacio={filtrados.length === 0} textoVacio="No hay productos con esos filtros.">
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th>Código</th><th>Producto</th>
                {BODEGAS.map((b) => <th key={b.id} className="num">{b.nombre}</th>)}
                <th className="num">Total</th><th className="num">Mínimo</th><th>Nivel</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p) => (
                <tr key={p.id}>
                  <td>{p.codigo}</td>
                  <td>{p.nombre} <span className="texto-suave">/ {p.unidad}</span></td>
                  {BODEGAS.map((b) => <td key={b.id} className="num">{formatoNumero(stockEn(p, b.id))}</td>)}
                  <td className="num"><strong>{formatoNumero(stockTotal(p))}</strong></td>
                  <td className="num">{formatoNumero(p.stockMinimo)}</td>
                  <td><InsigniaStock producto={p} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </EstadoDatos>
    </EstadoDatos>
  );
}

function Movimientos() {
  const { datos, cargando, error, recargar } = useDatos(() => inventarioService.listarMovimientos());
  const [filtros, setFiltros] = useState({ tipo: '', bodega: '', texto: '', desde: '', hasta: fechaInput() });
  const cambiar = (e) => setFiltros((f) => ({ ...f, [e.target.name]: e.target.value }));

  const t = filtros.texto.trim().toLowerCase();
  const movimientos = (datos ?? []).filter(
    (m) =>
      (!filtros.tipo || m.tipo === filtros.tipo) &&
      (!filtros.bodega || String(m.bodegaId) === filtros.bodega || String(m.bodegaOrigenId) === filtros.bodega) &&
      (!t || m.productoNombre.toLowerCase().includes(t) || m.referencia.toLowerCase().includes(t)) &&
      enRango(m.fecha, filtros.desde, filtros.hasta)
  );
  const visibles = movimientos.slice(0, 300);

  return (
    <>
      <div className="filtros">
        <select name="tipo" aria-label="Tipo de movimiento" value={filtros.tipo} onChange={cambiar}>
          <option value="">Todos los tipos</option>
          {Object.entries(TIPOS_MOVIMIENTO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select name="bodega" aria-label="Bodega" value={filtros.bodega} onChange={cambiar}>
          <option value="">Todas las bodegas</option>
          {BODEGAS.map((b) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
        </select>
        <label>Desde <input type="date" name="desde" value={filtros.desde} onChange={cambiar} /></label>
        <label>Hasta <input type="date" name="hasta" value={filtros.hasta} onChange={cambiar} /></label>
        <input type="search" name="texto" placeholder="Producto o referencia" aria-label="Buscar" value={filtros.texto} onChange={cambiar} />
      </div>
      {movimientos.length > visibles.length && (
        <p className="resumen-filtro">Mostrando los {visibles.length} más recientes de {movimientos.length}. Usa los filtros para acotar.</p>
      )}

      <EstadoDatos cargando={cargando && !datos} error={error} vacio={visibles.length === 0} textoVacio="No hay movimientos con esos filtros." onReintentar={recargar}>
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr><th>Fecha</th><th>Tipo</th><th>Producto</th><th>Bodega</th><th className="num">Cantidad</th><th>Referencia</th><th>Usuario</th></tr>
            </thead>
            <tbody>
              {visibles.map((m) => {
                const signo = m.tipo === 'SALIDA' ? '−' : m.tipo === 'TRASLADO' ? '' : '+';
                return (
                  <tr key={m.id}>
                    <td>{formatoFecha(m.fecha)}</td>
                    <td>{TIPOS_MOVIMIENTO[m.tipo] ?? m.tipo}</td>
                    <td>{m.productoNombre}</td>
                    <td>{m.tipo === 'TRASLADO' ? `${nombreBodega(m.bodegaOrigenId)} → ${nombreBodega(m.bodegaId)}` : nombreBodega(m.bodegaId)}</td>
                    <td className={`num ${m.tipo === 'SALIDA' ? 'texto-negativo' : ''}`}>{signo}{formatoNumero(m.cantidad)}</td>
                    <td>{m.referencia}{m.proveedor ? ` · ${m.proveedor}` : ''}</td>
                    <td>{m.usuario}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </EstadoDatos>
    </>
  );
}
