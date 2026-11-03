import { useState } from 'react';
import { useCarga } from '../../hooks/useCarga';
import { productosMasVendidos } from '../../services/reportesService';
import { Alerta, Cargando, Encabezado, Vacio } from '../../components/ui';
import { fechaISO, formatoMoneda, formatoNumero, haceDias } from '../../utils/formato';
import { descargarCSV } from '../../utils/csv';

// HU20 - Consultar productos más vendidos
export default function MasVendidosPage() {
  const hoy = fechaISO();
  const [filtro, setFiltro] = useState({ desde: haceDias(30), hasta: hoy });
  const [aplicado, setAplicado] = useState(filtro);
  const [errorFiltro, setErrorFiltro] = useState('');

  const { datos, cargando, error, recargar } = useCarga(
    () => productosMasVendidos({ ...aplicado, limite: 10 }),
    [aplicado.desde, aplicado.hasta]
  );

  function consultar(e) {
    e.preventDefault();
    if (!filtro.desde || !filtro.hasta) {
      setErrorFiltro('Selecciona la fecha inicial y la final.');
      return;
    }
    if (filtro.desde > filtro.hasta) {
      setErrorFiltro('La fecha inicial no puede ser posterior a la final.');
      return;
    }
    setErrorFiltro('');
    setAplicado({ ...filtro });
  }

  const productos = (datos ?? []).slice(0, 10);
  const maximo = Math.max(1, ...productos.map((p) => Number(p.cantidadVendida) || 0));

  function exportar() {
    descargarCSV(
      `productos-mas-vendidos_${aplicado.desde}_${aplicado.hasta}.csv`,
      [
        { titulo: 'Posición', valor: (p) => p.posicion },
        { titulo: 'Código', valor: (p) => p.codigo },
        { titulo: 'Producto', valor: (p) => p.nombre },
        { titulo: 'Cantidad vendida', valor: (p) => p.cantidadVendida },
        { titulo: 'Total vendido', valor: (p) => p.totalVendido ?? '' },
      ],
      productos.map((p, i) => ({ ...p, posicion: i + 1 }))
    );
  }

  return (
    <>
      <Encabezado titulo="Productos más vendidos" descripcion="Top 10 por cantidad vendida en el rango de fechas.">
        <button type="button" className="btn btn-secundario" onClick={exportar} disabled={productos.length === 0}>
          Exportar CSV
        </button>
      </Encabezado>

      <form className="tarjeta filtros" onSubmit={consultar}>
        <div className="campo campo-angosto">
          <label htmlFor="desde">Desde</label>
          <input id="desde" type="date" max={hoy} value={filtro.desde} onChange={(e) => setFiltro((f) => ({ ...f, desde: e.target.value }))} />
        </div>
        <div className="campo campo-angosto">
          <label htmlFor="hasta">Hasta</label>
          <input id="hasta" type="date" max={hoy} value={filtro.hasta} onChange={(e) => setFiltro((f) => ({ ...f, hasta: e.target.value }))} />
        </div>
        <button type="submit" className="btn">Consultar</button>
      </form>
      <Alerta>{errorFiltro}</Alerta>

      <div className="tarjeta tarjeta-sin-padding">
        {cargando ? (
          <Cargando />
        ) : error ? (
          <div style={{ padding: '1rem' }}>
            <Alerta>
              {error} <button type="button" className="btn-link" onClick={recargar}>Reintentar</button>
            </Alerta>
          </div>
        ) : productos.length === 0 ? (
          <Vacio titulo="No hay ventas en ese rango de fechas" />
        ) : (
          <div className="tabla-contenedor">
            <table className="tabla">
              <thead>
                <tr>
                  <th className="num">#</th>
                  <th>Código</th>
                  <th>Producto</th>
                  <th style={{ width: '35%' }}>Cantidad vendida</th>
                  <th className="num">Total vendido</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p, i) => (
                  <tr key={p.productoId ?? p.codigo ?? i}>
                    <td className="num">{i + 1}</td>
                    <td>{p.codigo}</td>
                    <td>{p.nombre}</td>
                    <td>
                      <div className="barra">
                        <div className="barra-relleno" style={{ width: `${((Number(p.cantidadVendida) || 0) / maximo) * 100}%` }} />
                        <span className="barra-valor">{formatoNumero(p.cantidadVendida)}</span>
                      </div>
                    </td>
                    <td className="num">{p.totalVendido !== undefined ? formatoMoneda(p.totalVendido) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
