import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MENU, NOMBRE_ROL, PERMISOS } from '../config/roles';
import { useCarga } from '../hooks/useCarga';
import { ventasDelDia } from '../services/reportesService';
import { productosBajoStock } from '../services/productosService';
import { Alerta, Cargando, Encabezado } from '../components/ui';
import { fechaISO, formatoMoneda, formatoNumero } from '../utils/formato';

const DESCRIPCIONES = {
  '/clientes': 'Registrar, consultar y actualizar clientes.',
  '/productos': 'Catálogo, precios y disponibilidad.',
  '/pedidos': 'Crear pedidos y consultar su estado.',
  '/reportes/ventas-dia': 'Total vendido y pedidos del día.',
  '/reportes/mas-vendidos': 'Top 10 de productos por rango de fechas.',
  '/reportes/bajo-stock': 'Productos que necesitan reabastecerse.',
};

function ResumenVentas() {
  const { datos, cargando, error } = useCarga(() => ventasDelDia(fechaISO()), []);
  if (cargando) return <Cargando texto="Cargando ventas del día…" />;
  if (error) return <Alerta>{error}</Alerta>;
  return (
    <div className="grid-kpi">
      <div className="kpi">
        <p className="kpi-etiqueta">Vendido hoy</p>
        <p className="kpi-valor">{formatoMoneda(datos?.totalVendido)}</p>
      </div>
      <div className="kpi">
        <p className="kpi-etiqueta">Pedidos confirmados hoy</p>
        <p className="kpi-valor">{formatoNumero(datos?.numeroPedidos)}</p>
      </div>
    </div>
  );
}

function AlertaBajoStock() {
  const { datos, cargando, error } = useCarga(productosBajoStock, []);
  if (cargando) return <Cargando texto="Revisando inventario…" />;
  if (error) return <Alerta>{error}</Alerta>;
  const cantidad = datos?.length ?? 0;
  if (cantidad === 0) {
    return <Alerta tipo="exito">Todos los productos están por encima del stock mínimo.</Alerta>;
  }
  return (
    <Alerta tipo="aviso">
      <strong>{cantidad} producto(s) con stock bajo.</strong>{' '}
      <Link to="/reportes/bajo-stock">Ver detalle</Link>
    </Alerta>
  );
}

export default function InicioPage() {
  const { usuario, tieneRol } = useAuth();
  const accesos = MENU.filter((op) => op.ruta !== '/inicio' && tieneRol(op.roles));

  return (
    <>
      <Encabezado
        titulo={`Hola, ${usuario?.nombre || usuario?.username}`}
        descripcion={`Rol: ${NOMBRE_ROL[usuario?.rol] || usuario?.rol}`}
      />

      {tieneRol(PERMISOS.reportesVentas) && <ResumenVentas />}
      {tieneRol(PERMISOS.reportesStock) && <AlertaBajoStock />}

      <div className="grid-accesos">
        {accesos.map((op) => (
          <Link key={op.ruta} to={op.ruta} className="acceso">
            <span className="acceso-icono" aria-hidden="true">{op.icono}</span>
            <strong>{op.texto}</strong>
            <span>{DESCRIPCIONES[op.ruta]}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
