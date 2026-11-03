// Reglas de validación de los formularios.
export const MIN_USUARIO = 3;
export const MAX_USUARIO = 50;
export const MIN_PASSWORD = 6;

// ---------- Login (HU17) ----------
export function validarUsuario(valor) {
  const v = (valor ?? '').trim();
  if (!v) return 'El usuario es obligatorio.';
  if (v.length < MIN_USUARIO) return `El usuario debe tener al menos ${MIN_USUARIO} caracteres.`;
  if (v.length > MAX_USUARIO) return `El usuario no puede superar ${MAX_USUARIO} caracteres.`;
  if (!/^[A-Za-z0-9._-]+$/.test(v)) return 'El usuario solo puede tener letras, números, punto, guion y guion bajo.';
  return '';
}

export function validarPassword(valor) {
  const v = valor ?? '';
  if (!v) return 'La contraseña es obligatoria.';
  if (v.length < MIN_PASSWORD) return `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`;
  return '';
}

export function validarLogin({ usuario, password }) {
  return limpiar({ usuario: validarUsuario(usuario), password: validarPassword(password) });
}

// ---------- Clientes (HU01 / HU03) ----------
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const REGEX_TELEFONO = /^\+?[0-9]{7,15}$/;

export function validarCorreo(valor) {
  const v = (valor ?? '').trim();
  if (!v) return 'El correo es obligatorio.';
  if (!REGEX_CORREO.test(v)) return 'Ingresa un correo válido (ej. nombre@dominio.com).';
  return '';
}

export function validarTelefono(valor) {
  const v = (valor ?? '').replace(/[\s-]/g, '');
  if (!v) return 'El teléfono es obligatorio.';
  if (!REGEX_TELEFONO.test(v)) return 'El teléfono debe tener entre 7 y 15 dígitos.';
  return '';
}

export function validarCliente(c, { esEdicion = false } = {}) {
  const errores = {};
  if (!esEdicion) {
    const id = (c.identificacion ?? '').trim();
    if (!id) errores.identificacion = 'La identificación es obligatoria.';
    else if (!/^[0-9A-Za-z-]{5,20}$/.test(id)) {
      errores.identificacion = 'La identificación debe tener entre 5 y 20 caracteres (números, letras o guion).';
    }
    const nombre = (c.nombre ?? '').trim();
    if (!nombre) errores.nombre = 'El nombre es obligatorio.';
    else if (nombre.length < 3) errores.nombre = 'El nombre debe tener al menos 3 caracteres.';
    else if (nombre.length > 120) errores.nombre = 'El nombre no puede superar 120 caracteres.';
  }
  if (!c.tipo) errores.tipo = 'Selecciona el tipo de cliente.';
  errores.telefono = validarTelefono(c.telefono);
  errores.correo = validarCorreo(c.correo);
  if ((c.direccion ?? '').length > 200) errores.direccion = 'La dirección no puede superar 200 caracteres.';
  return limpiar(errores);
}

// ---------- Productos (HU05 / HU07) ----------
export function validarProducto(p, { esEdicion = false } = {}) {
  const errores = {};
  if (!esEdicion) {
    const codigo = (p.codigo ?? '').trim();
    if (!codigo) errores.codigo = 'El código es obligatorio.';
    else if (!/^[A-Za-z0-9-_]{2,30}$/.test(codigo)) {
      errores.codigo = 'El código debe tener entre 2 y 30 caracteres (letras, números, guion).';
    }
  }
  const nombre = (p.nombre ?? '').trim();
  if (!nombre) errores.nombre = 'El nombre es obligatorio.';
  else if (nombre.length > 120) errores.nombre = 'El nombre no puede superar 120 caracteres.';
  if (!(p.categoria ?? '').trim()) errores.categoria = 'La categoría es obligatoria.';

  const precio = Number(p.precio);
  if (p.precio === '' || p.precio === null || Number.isNaN(precio)) errores.precio = 'El precio es obligatorio.';
  else if (precio <= 0) errores.precio = 'El precio debe ser mayor que cero.';

  if (!esEdicion) {
    errores.stock = validarEnteroNoNegativo(p.stock, 'El stock inicial');
  }
  errores.stockMinimo = validarEnteroNoNegativo(p.stockMinimo, 'El stock mínimo');
  return limpiar(errores);
}

function validarEnteroNoNegativo(valor, etiqueta) {
  if (valor === '' || valor === null || valor === undefined) return `${etiqueta} es obligatorio.`;
  const n = Number(valor);
  if (!Number.isInteger(n)) return `${etiqueta} debe ser un número entero.`;
  if (n < 0) return `${etiqueta} no puede ser negativo.`;
  return '';
}

// ---------- Pedidos (HU11) ----------
export function validarCantidad(valor) {
  const n = Number(valor);
  if (!Number.isInteger(n) || n <= 0) return 'La cantidad debe ser un entero mayor que cero.';
  return '';
}

function limpiar(errores) {
  return Object.fromEntries(Object.entries(errores).filter(([, v]) => v));
}
