import { Link } from 'react-router-dom';
import { useCarga } from '../../hooks/useCarga';
import { productosBajoStock } from '../../services/productosService';
import { Alerta, Cargando, Encabezado, Vacio } from '../../components/ui';
import { fechaISO, formatoNumero } from '../../utils/formato';
import { descargarCSV } from '../../utils/csv';
import EstadoStock from '../productos/EstadoStock';

// HU21 - Alertar productos con bajo stock
export default function BajoStockPage() {
  const { datos, cargando, error, recargar } = useCarga(productosBajoStock, []);

  const productos = [...(datos ?? [])].sort(
    (a, b) => Number(a.stock) - Number(a.stockMinimo) - (Number(b.stock) - Number(b.stockMinimo))
  );

  function exportar() {
    descargarCSV(
      `productos-bajo-stock_${fechaISO()}.csv`,
      [
        { titulo: 'Código', valor: (p) => p.codigo },
        { titulo: 'Producto', valor: (p) => p.nombre },
        { titulo: 'Categoría', valor: (p) => p.categoria },
        { titulo: 'Stock actual', valor: (p) => p.stock },
        { titulo: 'Stock mínimo', valor: (p) => p.stockMinimo },
        { titulo: 'Unidades para llegar al mínimo', valor: (p) => Math.max(0, p.stockMinimo - p.stock) },
      ],
      productos
    );
  }

  return (
    <>
      <Encabezado titulo="Productos con bajo stock" descripcion="Productos cuyo stock es menor o igual al stock mínimo.">
        <button type="button" className="btn btn-secundario" onClick={recargar} disabled={cargando}>
          {cargando ? 'Actualizando…' : 'Actualizar'}
        </button>
        <button type="button" className="btn btn-secundario" onClick={exportar} disabled={productos.length === 0}>
          Exportar CSV
        </button>
      </Encabezado>

      {!cargando && !error && productos.length > 0 && (
        <Alerta tipo="aviso">
          <strong>{productos.length} producto(s)</strong> necesitan reabastecerse.
        </Alerta>
      )}

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
          <Vacio titulo="Todo en orden">Ningún producto está por debajo de su stock mínimo.</Vacio>
        ) : (
          <div className="tabla-contenedor">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th className="num">Stock actual</th>
                  <th className="num">Stock mínimo</th>
                  <th className="num">Faltan</th>
                  <th>Estado</th>
                  <th className="acciones" />
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => (
                  <tr key={p.id}>
                    <td>{p.codigo}</td>
                    <td>{p.nombre}</td>
                    <td>{p.categoria}</td>
                    <td className="num">{formatoNumero(p.stock)}</td>
                    <td className="num">{formatoNumero(p.stockMinimo)}</td>
                    <td className="num">{formatoNumero(Math.max(0, p.stockMinimo - p.stock))}</td>
                    <td><EstadoStock producto={p} /></td>
                    <td className="acciones">
                      <Link to={`/productos/${p.id}`} className="btn btn-secundario btn-sm">Ver</Link>
                    </td>
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
