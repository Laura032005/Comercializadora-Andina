// Constantes de la aplicación: URLs del back-end, rutas del front, roles y mensajes.

// ---- Back-end ----
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8081').replace(/\/$/, '');

export const ENDPOINTS = {
  REGISTRAR_CUSTOMER: '/api/v1/auth/registrar_customer',
  INICIAR_SESION: '/api/v1/auth/iniciar_sesion',
  CERRAR_SESION: '/api/v1/auth/cerrar_sesion',
  REFRESCAR_TOKEN: '/api/v1/auth/refrescar_token',
  INTERCAMBIAR_CODIGO: '/api/v1/auth/oauth2/intercambiar_codigo',
  // No es un fetch: el navegador navega a esta URL y el back redirige a Google.
  GOOGLE_AUTORIZACION: '/oauth2/authorization/google',
};

// ---- Rutas del front ----
export const RUTAS = {
  LOGIN: '/login',
  REGISTRO: '/registro',
  MENU: '/menu',
  OAUTH_CALLBACK: '/oauth2/callback',
};

// ---- Sesión ----
export const STORAGE_KEY = 'msv_sesion';
export const REFRESCAR_ANTES_MS = 30 * 1000; // renueva el access 30 s antes de que venza
export const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000; // el refresh token dura 7 días

// ---- Roles y estados (los define el back-end) ----
export const ROLES = { CUSTOMER: 'CUSTOMER', WORKER: 'WORKER' };
export const ESTADOS = { ACTIVO: 'ACTIVO', PERFIL_INCOMPLETO: 'PERFIL_INCOMPLETO' };

// ---- Reglas de validación (espejo de las del back-end) ----
export const REGLAS = {
  NOMBRE_MAX: 150,
  DIRECCION_MAX: 255,
  CORREO_MAX: 254,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 72,
  REGEX_CORREO: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  REGEX_TELEFONO_E164: /^\+[1-9]\d{1,14}$/,
};

// ---- Mensajes ----
export const MENSAJES = {
  CREDENCIALES: 'Correo o contraseña incorrectos.',
  SIN_CONEXION: 'No se pudo conectar con el servidor. Verifica que esté encendido e intenta de nuevo.',
  ERROR_SERVIDOR: 'Ocurrió un error en el servidor. Intenta más tarde.',
  CORREO_EXISTENTE: 'Ya existe una cuenta con ese correo.',
  SESION_EXPIRADA: 'Tu sesión expiró. Inicia sesión de nuevo.',
  CODIGO_INVALIDO: 'El código de acceso es inválido o ya venció. Intenta iniciar sesión con Google otra vez.',
};

// Errores que el back-end manda en ?error=... al volver de Google.
export const ERRORES_OAUTH = {
  correo_no_disponible: 'Google no entregó un correo para tu cuenta.',
  correo_no_verificado: 'Tu correo de Google no está verificado, o ya existe una cuenta con ese correo.',
  login_fallido: 'No se pudo iniciar sesión con Google. Intenta de nuevo.',
};
