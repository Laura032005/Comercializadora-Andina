import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PERMISOS } from '../../config/roles';
import { useCarga } from '../../hooks/useCarga';
import { obtenerProducto } from '../../services/productosService';
import { Alerta, Cargando, Encabezado } from '../../components/ui';
import { formatoMoneda, formatoNumero } from '../../utils/formato';
import EstadoStock, { stockBajo } from './EstadoStock';

const INTERVALO_ACTUALIZACION = 30000; // 30 s

// HU08 - Consultar disponibilidad (stock)
export default function ProductoDetallePage() {
  const { id } = useParams();
  const { tieneRol } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mensaje, setMensaje] = useState(location.state?.mensaje || '');
  const [actualizado, setActualizado] = useState(null);

  const { datos: producto, setDatos, cargando, error, recargar } = useCarga(async () => {
    const p = await obtenerProducto(id);
    setActualizado(new Date());
    return p;
  }, [id]);

  // Mantiene la disponibilidad al día mientras la página está abierta.
  useEffect(() => {
    const t = setInterval(() => {
      obtenerProducto(id)
        .then((p) => {
          setDatos(p);
          setActualizado(new Date());
        })
        .catch(() => {});
    }, INTERVALO_ACTUALIZACION);
    return () => clearInterval(t);
  }, [id, setDatos]);

  function cerrarMensaje() {
    setMensaje('');
    navigate(location.pathname, { replace: true, state: null });
  }

  if (cargando && !producto) return <Cargando />;
  if (error && !producto) {
    return (
      <>
        <Link to="/productos" className="volver">← Volver a productos</Link>
        <Alerta>{error}</Alerta>
      </>
    );
  }

  const inactivo = producto.activo === false;

  return (
    <>
      <Link to="/productos" className="volver">← Volver a productos</Link>
      <Encabezado titulo={producto.nombre} descripcion={`Código ${producto.codigo}`}>
        <button type="button" className="btn btn-secundario" onClick={recargar} disabled={cargando}>
          {cargando ? 'Actualizando…' : 'Actualizar'}
        </button>
        {tieneRol(PERMISOS.productosEditar) && (
          <Link to={`/productos/${producto.id}/editar`} className="btn">Editar</Link>
        )}
      </Encabezado>

      <Alerta tipo="exito" onCerrar={cerrarMensaje}>{mensaje}</Alerta>
      {inactivo && (
        <Alerta tipo="aviso">Este producto está <strong>inactivo</strong> y no está disponible para la venta.</Alerta>
      )}
      {!inactivo && stockBajo(producto) && (
        <Alerta tipo="aviso">
          El stock está en o por debajo del mínimo ({formatoNumero(producto.stockMinimo)} unidades). Conviene reabastecer.
        </Alerta>
      )}

      <div className="grid-kpi">
        <div className={`kpi ${stockBajo(producto) ? 'kpi-aviso' : ''}`}>
          <p className="kpi-etiqueta">Cantidad disponible</p>
          <p className="kpi-valor">{formatoNumero(producto.stock)}</p>
          <EstadoStock producto={producto} />
        </div>
        <div className="kpi">
          <p className="kpi-etiqueta">Stock mínimo</p>
          <p className="kpi-valor">{formatoNumero(producto.stockMinimo)}</p>
        </div>
        <div className="kpi">
          <p className="kpi-etiqueta">Precio unitario</p>
          <p className="kpi-valor">{formatoMoneda(producto.precio)}</p>
        </div>
      </div>

      <div className="tarjeta">
        <h2>Información del producto</h2>
        <dl className="datos">
          <div><dt>Código</dt><dd>{producto.codigo}</dd></div>
          <div><dt>Nombre</dt><dd>{producto.nombre}</dd></div>
          <div><dt>Categoría</dt><dd>{producto.categoria}</dd></div>
          <div><dt>Estado</dt><dd>{inactivo ? 'Inactivo' : 'Activo'}</dd></div>
        </dl>
        {actualizado && (
          <p className="texto-suave" style={{ marginBottom: 0, fontSize: '0.8rem' }}>
            Última actualización: {actualizado.toLocaleTimeString('es-CO')}
          </p>
        )}
      </div>
    </>
  );
}
