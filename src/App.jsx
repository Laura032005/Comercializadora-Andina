import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { PERMISOS } from './config/roles';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import InicioPage from './pages/InicioPage';
import NoEncontradaPage from './pages/NoEncontradaPage';
import ClientesPage from './pages/clientes/ClientesPage';
import ClienteFormPage from './pages/clientes/ClienteFormPage';
import ClienteDetallePage from './pages/clientes/ClienteDetallePage';
import ProductosPage from './pages/productos/ProductosPage';
import ProductoFormPage from './pages/productos/ProductoFormPage';
import ProductoDetallePage from './pages/productos/ProductoDetallePage';
import PedidosPage from './pages/pedidos/PedidosPage';
import PedidoFormPage from './pages/pedidos/PedidoFormPage';
import PedidoDetallePage from './pages/pedidos/PedidoDetallePage';
import VentasDiaPage from './pages/reportes/VentasDiaPage';
import MasVendidosPage from './pages/reportes/MasVendidosPage';
import BajoStockPage from './pages/reportes/BajoStockPage';

function conRol(roles, elemento) {
  return <ProtectedRoute roles={roles}>{elemento}</ProtectedRoute>;
}

export default function App() {
  const { autenticado } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={autenticado ? <Navigate to="/inicio" replace /> : <LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/inicio" element={<InicioPage />} />

        <Route path="/clientes" element={conRol(PERMISOS.clientesVer, <ClientesPage />)} />
        <Route path="/clientes/nuevo" element={conRol(PERMISOS.clientesEditar, <ClienteFormPage />)} />
        <Route path="/clientes/:id" element={conRol(PERMISOS.clientesVer, <ClienteDetallePage />)} />
        <Route path="/clientes/:id/editar" element={conRol(PERMISOS.clientesEditar, <ClienteFormPage />)} />

        <Route path="/productos" element={conRol(PERMISOS.productosVer, <ProductosPage />)} />
        <Route path="/productos/nuevo" element={conRol(PERMISOS.productosEditar, <ProductoFormPage />)} />
        <Route path="/productos/:id" element={conRol(PERMISOS.productosVer, <ProductoDetallePage />)} />
        <Route path="/productos/:id/editar" element={conRol(PERMISOS.productosEditar, <ProductoFormPage />)} />

        <Route path="/pedidos" element={conRol(PERMISOS.pedidosVer, <PedidosPage />)} />
        <Route path="/pedidos/nuevo" element={conRol(PERMISOS.pedidosCrear, <PedidoFormPage />)} />
        <Route path="/pedidos/:id" element={conRol(PERMISOS.pedidosVer, <PedidoDetallePage />)} />
        <Route path="/pedidos/:id/editar" element={conRol(PERMISOS.pedidosCrear, <PedidoFormPage />)} />

        <Route path="/reportes/ventas-dia" element={conRol(PERMISOS.reportesVentas, <VentasDiaPage />)} />
        <Route path="/reportes/mas-vendidos" element={conRol(PERMISOS.reportesVentas, <MasVendidosPage />)} />
        <Route path="/reportes/bajo-stock" element={conRol(PERMISOS.reportesStock, <BajoStockPage />)} />

        <Route path="*" element={<NoEncontradaPage />} />
      </Route>

      <Route path="/" element={<Navigate to={autenticado ? '/inicio' : '/login'} replace />} />
    </Routes>
  );
}
