// Roles del sistema y permisos de cada módulo (HU18).
export const ROLES = {
  ADMIN: 'ADMIN',
  VENDEDOR: 'VENDEDOR',
  BODEGA: 'BODEGA',
  GERENTE: 'GERENTE',
};

export const NOMBRE_ROL = {
  ADMIN: 'Administrador',
  VENDEDOR: 'Vendedor',
  BODEGA: 'Bodega',
  GERENTE: 'Gerente',
};

const { ADMIN, VENDEDOR, BODEGA, GERENTE } = ROLES;

export const PERMISOS = {
  clientesVer: [ADMIN, VENDEDOR, GERENTE],
  clientesEditar: [ADMIN, VENDEDOR],
  productosVer: [ADMIN, VENDEDOR, BODEGA, GERENTE],
  productosEditar: [ADMIN],
  pedidosVer: [ADMIN, VENDEDOR, BODEGA, GERENTE],
  pedidosCrear: [ADMIN, VENDEDOR],
  pedidosDespachar: [ADMIN, BODEGA],
  reportesVentas: [ADMIN, GERENTE],
  reportesStock: [ADMIN, BODEGA, GERENTE],
};

// Opciones del menú lateral: solo se muestran las del rol del usuario.
export const MENU = [
  { ruta: '/inicio', texto: 'Inicio', icono: '⌂', roles: null },
  { ruta: '/clientes', texto: 'Clientes', icono: '☺', roles: PERMISOS.clientesVer },
  { ruta: '/productos', texto: 'Productos', icono: '▦', roles: PERMISOS.productosVer },
  { ruta: '/pedidos', texto: 'Pedidos', icono: '☰', roles: PERMISOS.pedidosVer },
  { ruta: '/reportes/ventas-dia', texto: 'Ventas del día', icono: '$', roles: PERMISOS.reportesVentas },
  { ruta: '/reportes/mas-vendidos', texto: 'Más vendidos', icono: '★', roles: PERMISOS.reportesVentas },
  { ruta: '/reportes/bajo-stock', texto: 'Bajo stock', icono: '!', roles: PERMISOS.reportesStock },
];
