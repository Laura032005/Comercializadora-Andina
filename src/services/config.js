// Configuración compartida por todos los servicios (se lee de .env).
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '');
export const IVA = 0.19; // 19 % sobre el subtotal de la venta
