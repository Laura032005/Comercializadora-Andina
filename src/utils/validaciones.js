// Reglas del formulario de login (HU17).
export const MIN_USUARIO = 3;
export const MAX_USUARIO = 50;
export const MIN_PASSWORD = 6;

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
  const errores = {};
  const eu = validarUsuario(usuario);
  const ep = validarPassword(password);
  if (eu) errores.usuario = eu;
  if (ep) errores.password = ep;
  return errores;
}
