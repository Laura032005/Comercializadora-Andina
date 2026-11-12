// Reglas de los formularios de login y registro. Cada validador devuelve '' si es válido.
import { REGLAS } from './constantes';

export function validarCorreo(valor) {
  const v = (valor ?? '').trim();
  if (!v) return 'El correo es obligatorio.';
  if (v.length > REGLAS.CORREO_MAX) return `El correo no puede superar ${REGLAS.CORREO_MAX} caracteres.`;
  if (!REGLAS.REGEX_CORREO.test(v)) return 'Ingresa un correo válido.';
  return '';
}

// En el login solo se exige que no esté vacía (la política se aplica al registrarse).
export function validarPasswordLogin(valor) {
  return valor ? '' : 'La contraseña es obligatoria.';
}

export function validarPasswordNueva(valor) {
  const v = valor ?? '';
  if (!v) return 'La contraseña es obligatoria.';
  if (v.length < REGLAS.PASSWORD_MIN) return `Debe tener al menos ${REGLAS.PASSWORD_MIN} caracteres.`;
  if (v.length > REGLAS.PASSWORD_MAX) return `No puede superar ${REGLAS.PASSWORD_MAX} caracteres.`;
  if (!/[A-Z]/.test(v)) return 'Debe incluir al menos una mayúscula.';
  if (!/\d/.test(v)) return 'Debe incluir al menos un número.';
  if (!/[^A-Za-z0-9]/.test(v)) return 'Debe incluir al menos un símbolo.';
  return '';
}

export function validarConfirmacion(valor, valores) {
  if (!valor) return 'Confirma la contraseña.';
  return valor === valores.contrasena ? '' : 'Las contraseñas no coinciden.';
}

export function validarNombre(valor) {
  const v = (valor ?? '').trim();
  if (!v) return 'El nombre completo es obligatorio.';
  if (v.length > REGLAS.NOMBRE_MAX) return `No puede superar ${REGLAS.NOMBRE_MAX} caracteres.`;
  return '';
}

export function validarTelefono(valor) {
  const v = (valor ?? '').trim();
  if (!v) return ''; // opcional
  return REGLAS.REGEX_TELEFONO_E164.test(v) ? '' : 'Usa formato internacional, por ejemplo +573001234567.';
}

export function validarDireccion(valor) {
  const v = (valor ?? '').trim();
  if (!v) return 'La dirección es obligatoria.';
  if (v.length > REGLAS.DIRECCION_MAX) return `No puede superar ${REGLAS.DIRECCION_MAX} caracteres.`;
  return '';
}

export function validarFechaNacimiento(valor) {
  if (!valor) return 'La fecha de nacimiento es obligatoria.';
  const hoy = new Date().toISOString().slice(0, 10);
  return valor < hoy ? '' : 'La fecha de nacimiento debe ser anterior a hoy.';
}

export const validadoresLogin = {
  correo: validarCorreo,
  contrasena: validarPasswordLogin,
};

export const validadoresRegistro = {
  nombreCompleto: validarNombre,
  telefono: validarTelefono,
  direccion: validarDireccion,
  fechaNacimiento: validarFechaNacimiento,
  correo: validarCorreo,
  contrasena: validarPasswordNueva,
  confirmacion: validarConfirmacion,
};
