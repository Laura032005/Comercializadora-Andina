// Listas fijas del dominio de Comercial Andina S.A.S.

export const ROLES = {
  ADMIN: 'Administrador',
  VENDEDOR: 'Vendedor',
  BODEGA: 'Bodega',
  GERENTE: 'Gerente',
  CONTADOR: 'Contabilidad',
};

// La tienda de Bogotá se surte de dos bodegas.
export const BODEGAS = [
  { id: 1, nombre: 'Bodega Principal' },
  { id: 2, nombre: 'Bodega Secundaria' },
];
export const nombreBodega = (id) => BODEGAS.find((b) => b.id === Number(id))?.nombre ?? '—';

export const TIPOS_CLIENTE = {
  FINAL: 'Cliente final',
  MAYORISTA: 'Mayorista',
};

// MOSTRADOR = se entrega en el acto. Los demás son pedidos que pasan por bodega.
export const CANALES = {
  MOSTRADOR: 'Mostrador',
  WHATSAPP: 'Pedido por WhatsApp',
  TELEFONO: 'Pedido telefónico',
};
export const esPedido = (canal) => canal !== 'MOSTRADOR';

export const ESTADOS_DESPACHO = {
  PENDIENTE: 'Pendiente',
  PREPARADO: 'Preparado',
  DESPACHADO: 'Despachado',
  ENTREGADO: 'Entregado',
};
// Siguiente paso de un pedido en bodega.
export const SIGUIENTE_ESTADO = { PENDIENTE: 'PREPARADO', PREPARADO: 'DESPACHADO', DESPACHADO: 'ENTREGADO' };

export const TIPOS_MOVIMIENTO = {
  ENTRADA: 'Entrada',
  SALIDA: 'Salida por venta',
  ANULACION: 'Devolución por anulación',
  TRASLADO: 'Traslado entre bodegas',
};

export const UNIDADES = ['und', 'bulto', 'galón', 'caja', 'libra', 'rollo', 'metro', 'kg'];

export const stockTotal = (p) => Object.values(p.existencias ?? {}).reduce((s, n) => s + n, 0);
export const stockEn = (p, bodegaId) => p.existencias?.[bodegaId] ?? 0;
