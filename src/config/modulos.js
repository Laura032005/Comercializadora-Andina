// Qué módulos ve cada rol. Se usa para el menú lateral, las tarjetas de inicio y para proteger las rutas.
export const MODULOS = [
  {
    ruta: '/ventas/nueva', titulo: 'Nueva venta', icono: '🛒',
    descripcion: 'Venta de mostrador o pedido mayorista. Descuenta inventario y genera la factura.',
    roles: ['ADMIN', 'VENDEDOR'],
  },
  {
    ruta: '/ventas', titulo: 'Ventas y pedidos', icono: '🧾',
    tituloPorRol: { VENDEDOR: 'Mis ventas y pedidos' },
    descripcion: 'Consulta ventas, estado de los pedidos y anulaciones.',
    roles: ['ADMIN', 'VENDEDOR', 'GERENTE'],
  },
  {
    ruta: '/clientes', titulo: 'Clientes', icono: '👥',
    descripcion: 'Clientes finales y mayoristas con su historial de compras.',
    roles: ['ADMIN', 'VENDEDOR', 'GERENTE'],
  },
  {
    ruta: '/despachos', titulo: 'Despachos', icono: '🚚',
    descripcion: 'Pedidos por preparar, despachar y entregar.',
    roles: ['ADMIN', 'BODEGA'],
  },
  {
    ruta: '/inventario', titulo: 'Inventario', icono: '📦',
    descripcion: 'Existencias por bodega, alertas de stock bajo y movimientos.',
    roles: ['ADMIN', 'BODEGA', 'GERENTE'],
  },
  {
    ruta: '/entradas', titulo: 'Entradas y traslados', icono: '📥',
    descripcion: 'Ingreso de mercancía de proveedores y traslados entre bodegas.',
    roles: ['ADMIN', 'BODEGA'],
  },
  {
    ruta: '/productos', titulo: 'Productos', icono: '🔩',
    descripcion: 'Catálogo de ferretería: códigos, precios y stock mínimo.',
    roles: ['ADMIN'],
  },
  {
    ruta: '/facturacion', titulo: 'Facturación', icono: '💵',
    descripcion: 'Facturas generadas desde las ventas, totales de IVA y exportación contable.',
    roles: ['ADMIN', 'CONTADOR'],
  },
  {
    ruta: '/indicadores', titulo: 'Tablero gerencial', icono: '📊',
    descripcion: 'Ventas del día y del mes, meta, productos que más rotan e inventario.',
    roles: ['ADMIN', 'GERENTE'],
  },
  {
    ruta: '/reportes', titulo: 'Reportes', icono: '📈',
    descripcion: 'Ventas por periodo, vendedor, canal, producto y mejores clientes.',
    roles: ['ADMIN', 'GERENTE', 'CONTADOR'],
  },
  {
    ruta: '/usuarios', titulo: 'Usuarios', icono: '🔐',
    descripcion: 'Crear, editar y desactivar usuarios del sistema.',
    roles: ['ADMIN'],
  },
];

export const modulosDeRol = (rol) => MODULOS.filter((m) => m.roles.includes(rol));
export const rolesDe = (ruta) => MODULOS.find((m) => m.ruta === ruta)?.roles ?? [];
export const tituloModulo = (m, rol) => m.tituloPorRol?.[rol] ?? m.titulo;
