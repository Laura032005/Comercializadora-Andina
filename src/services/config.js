// Configuración compartida por los servicios de los módulos.
// VITE_USE_MOCK=true → login y módulos con datos simulados en localStorage.
// Sin la variable (o en false) → todo contra el back-end Spring Boot.
export { API_URL } from '../utils/constantes';
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
export const IVA = 0.19; // 19 % sobre el subtotal de la venta
