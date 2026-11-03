import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PERMISOS } from '../../config/roles';
import { useCarga } from '../../hooks/useCarga';
import { cambiarEstadoProducto, listarCategorias, listarProductos } from '../../services/productosService';
import { Alerta, Cargando, Confirmacion, Encabezado, Paginacion, Vacio } from '../../components/ui';
import { formatoMoneda, formatoNumero } from '../../utils/formato';
import EstadoStock from './EstadoStock';

// HU06 - Consultar productos / HU09 - Activar o desactivar producto
export default function ProductosPage() {
  const { tieneRol } = useAuth();
  const esAdmin = tieneRol(PERMISOS.productosEditar);
  const [params, setParams] = useSearchParams();

  const busqueda = params.get('q') || '';
  const categoria = params.get('categoria') || '';
  const estado = esAdmin ? params.get('estado') || 'todos' : 'activos';
  const pagina = Number(params.get('pagina') || 0);

  const [busquedaForm, setBusquedaForm] = useState(busqueda);
  const [mensaje, setMensaje] = useState('');
  const [errorAccion, setErrorAccion] = useState('');
  const [aDesactivar, setADesactivar] = useState(null);
  const [procesando, setProcesando] = useState(null);

  const activo = estado === 'activos' ? true : estado === 'inactivos' ? false : undefined;

  const { datos, setDatos, cargando, error, recargar } = useCarga(
    () => listarProductos({ busqueda: busqueda || undefined, categoria: categoria || undefined, activo, page: pagina }),
    [busqueda, categoria, activo, pagina]
  );
  const { datos: categorias } = useCarga(listarCategorias, []);

  function actualizarParams(cambios) {
    const nuevos = new URLSearchParams(params);
    Object.entries(cambios).forEach(([k, v]) => (v ? nuevos.set(k, v) : nuevos.delete(k)));
    if (!('pagina' in cambios)) nuevos.delete('pagina');
    setParams(nuevos);
  }

  function buscar(e) {
    e.preventDefault();
    actualizarParams({ q: busquedaForm.trim() });
  }

  async function cambiarEstado(producto, nuevoActivo) {
    setProcesando(producto.id);
    setErrorAccion('');
    setMensaje('');
    try {
      const actualizado = await cambiarEstadoProducto(producto.id, nuevoActivo);
      setDatos((d) => ({
        ...d,
        items: d.items.map((p) => (p.id === producto.id ? { ...p, ...(actualizado || {}), activo: nuevoActivo } : p)),
      }));
      setMensaje(`El producto "${producto.nombre}" quedó ${nuevoActivo ? 'activo' : 'inactivo'}.`);
    } catch (err) {
      setErrorAccion(err.message);
    } finally {
      setProcesando(null);
      setADesactivar(null);
    }
  }

  const productos = datos?.items ?? [];
  const hayFiltros = busqueda || categoria;

  return (
    <>
      <Encabezado titulo="Productos" descripcion="Consulta el catálogo, precios y disponibilidad.">
        {esAdmin && <Link to="/productos/nuevo" className="btn">+ Nuevo producto</Link>}
      </Encabezado>

      <Alerta tipo="exito" onCerrar={() => setMensaje('')}>{mensaje}</Alerta>
      <Alerta onCerrar={() => setErrorAccion('')}>{errorAccion}</Alerta>

      <form className="tarjeta filtros" onSubmit={buscar}>
        <div className="campo">
          <label htmlFor="q">Nombre o código</label>
          <input id="q" type="search" value={busquedaForm} onChange={(e) => setBusquedaForm(e.target.value)} placeholder="Ej. Arroz o PRD-001" />
        </div>
        <div className="campo campo-angosto">
          <label htmlFor="categoria">Categoría</label>
          <select id="categoria" value={categoria} onChange={(e) => actualizarParams({ categoria: e.target.value })}>
            <option value="">Todas</option>
            {(categorias ?? []).map((c) => {
              const valor = typeof c === 'string' ? c : c.nombre;
              return <option key={valor} value={valor}>{valor}</option>;
            })}
          </select>
        </div>
        {esAdmin && (
          <div className="campo campo-angosto">
            <label htmlFor="estado">Estado</label>
            <select id="estado" value={estado} onChange={(e) => actualizarParams({ estado: e.target.value === 'todos' ? '' : e.target.value })}>
              <option value="todos">Todos</option>
              <option value="activos">Activos</option>
              <option value="inactivos">Inactivos</option>
            </select>
          </div>
        )}
        <button type="submit" className="btn">Buscar</button>
        {hayFiltros && (
          <button
            type="button"
            className="btn btn-secundario"
            onClick={() => {
              setBusquedaForm('');
              actualizarParams({ q: '', categoria: '' });
            }}
          >
            Limpiar
          </button>
        )}
      </form>

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
          <Vacio titulo={hayFiltros ? 'No hay productos que coincidan' : 'Aún no hay productos registrados'}>
            {hayFiltros ? 'Prueba con otro nombre, código o categoría.' : null}
          </Vacio>
        ) : (
          <>
            <div className="tabla-contenedor">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Categoría</th>
                    <th className="num">Precio</th>
                    <th className="num">Stock</th>
                    <th>Disponibilidad</th>
                    {esAdmin && <th>Estado</th>}
                    <th className="acciones">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((p) => (
                    <tr key={p.id} className={p.activo === false ? 'fila-inactiva' : ''}>
                      <td>{p.codigo}</td>
                      <td>{p.nombre}</td>
                      <td>{p.categoria}</td>
                      <td className="num">{formatoMoneda(p.precio)}</td>
                      <td className="num">{formatoNumero(p.stock)}</td>
                      <td><EstadoStock producto={p} /></td>
                      {esAdmin && (
                        <td>
                          <span className={`badge ${p.activo === false ? 'badge-gris' : 'badge-exito'}`}>
                            {p.activo === false ? 'Inactivo' : 'Activo'}
                          </span>
                        </td>
                      )}
                      <td className="acciones">
                        <Link to={`/productos/${p.id}`} className="btn btn-secundario btn-sm">Ver</Link>
                        {esAdmin && (
                          <>
                            <Link to={`/productos/${p.id}/editar`} className="btn btn-secundario btn-sm">Editar</Link>
                            {p.activo === false ? (
                              <button
                                type="button"
                                className="btn btn-exito btn-sm"
                                disabled={procesando === p.id}
                                onClick={() => cambiarEstado(p, true)}
                              >
                                Activar
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-peligro btn-sm"
                                disabled={procesando === p.id}
                                onClick={() => setADesactivar(p)}
                              >
                                Desactivar
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Paginacion
              pagina={datos.pagina}
              totalPaginas={datos.totalPaginas}
              totalElementos={datos.totalElementos}
              onCambiar={(p) => actualizarParams({ pagina: String(p) })}
            />
          </>
        )}
      </div>

      <Confirmacion
        abierta={Boolean(aDesactivar)}
        titulo="¿Desactivar producto?"
        textoConfirmar="Sí, desactivar"
        peligro
        ocupado={Boolean(procesando)}
        onCancelar={() => setADesactivar(null)}
        onConfirmar={() => cambiarEstado(aDesactivar, false)}
      >
        <p>
          <strong>{aDesactivar?.nombre}</strong> ({aDesactivar?.codigo}) dejará de aparecer para la venta.
          Podrás activarlo de nuevo cuando quieras.
        </p>
      </Confirmacion>
    </>
  );
}
