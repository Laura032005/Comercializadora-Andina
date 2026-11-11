import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import MenuPage from './pages/MenuPage';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import { useAuth } from './context/AuthContext';
import { rolesDe } from './config/modulos';
import UsuariosPage from './pages/usuarios/UsuariosPage';
import ProductosPage from './pages/productos/ProductosPage';
import ClientesPage from './pages/clientes/ClientesPage';
import ClienteDetallePage from './pages/clientes/ClienteDetallePage';
import NuevaVentaPage from './pages/ventas/NuevaVentaPage';
import VentasPage from './pages/ventas/VentasPage';
import VentaDetallePage from './pages/ventas/VentaDetallePage';
import FacturaPage from './pages/ventas/FacturaPage';
import FacturacionPage from './pages/ventas/FacturacionPage';
import InventarioPage from './pages/inventario/InventarioPage';
import EntradasPage from './pages/inventario/EntradasPage';
import DespachosPage from './pages/despachos/DespachosPage';
import ReportesPage from './pages/reportes/ReportesPage';
import IndicadoresPage from './pages/reportes/IndicadoresPage';

// Detalle de venta y factura: cualquier rol que vea ventas, despachos o facturación.
const ROLES_DETALLE_VENTA = ['ADMIN', 'VENDEDOR', 'GERENTE', 'BODEGA', 'CONTADOR'];

const conRol = (ruta, elemento) => <ProtectedRoute roles={rolesDe(ruta)}>{elemento}</ProtectedRoute>;

export default function App() {
  const { autenticado } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={autenticado ? <Navigate to="/menu" replace /> : <LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/ventas/nueva" element={conRol('/ventas/nueva', <NuevaVentaPage />)} />
        <Route path="/ventas" element={conRol('/ventas', <VentasPage />)} />
        <Route
          path="/ventas/:id"
          element={<ProtectedRoute roles={ROLES_DETALLE_VENTA}><VentaDetallePage /></ProtectedRoute>}
        />
        <Route path="/clientes" element={conRol('/clientes', <ClientesPage />)} />
        <Route path="/clientes/:id" element={conRol('/clientes', <ClienteDetallePage />)} />
        <Route path="/despachos" element={conRol('/despachos', <DespachosPage />)} />
        <Route path="/inventario" element={conRol('/inventario', <InventarioPage />)} />
        <Route path="/entradas" element={conRol('/entradas', <EntradasPage />)} />
        <Route path="/productos" element={conRol('/productos', <ProductosPage />)} />
        <Route path="/facturacion" element={conRol('/facturacion', <FacturacionPage />)} />
        <Route path="/indicadores" element={conRol('/indicadores', <IndicadoresPage />)} />
        <Route path="/reportes" element={conRol('/reportes', <ReportesPage />)} />
        <Route path="/usuarios" element={conRol('/usuarios', <UsuariosPage />)} />
      </Route>

      {/* La factura se imprime sin el menú lateral. */}
      <Route
        path="/ventas/:id/factura"
        element={<ProtectedRoute roles={ROLES_DETALLE_VENTA}><FacturaPage /></ProtectedRoute>}
      />

      <Route path="*" element={<Navigate to={autenticado ? '/menu' : '/login'} replace />} />
    </Routes>
  );
}
