// "Base de datos" del modo mock: colecciones guardadas en localStorage.
import { generarDatosIniciales } from './semillas';

const PREFIJO = 'msv_db_';
const VERSION_KEY = `${PREFIJO}version`;
const VERSION = '1';
const memoria = {}; // respaldo si localStorage no está disponible

function leerCrudo(clave) {
  try {
    const raw = localStorage.getItem(PREFIJO + clave);
    return raw ? JSON.parse(raw) : memoria[clave];
  } catch {
    return memoria[clave];
  }
}

function escribirCrudo(clave, valor) {
  memoria[clave] = valor;
  try {
    localStorage.setItem(PREFIJO + clave, JSON.stringify(valor));
  } catch {
    /* solo en memoria */
  }
}

function asegurarDatos() {
  let version;
  try {
    version = localStorage.getItem(VERSION_KEY);
  } catch {
    version = memoria.__version;
  }
  if (version === VERSION) return;
  const datos = generarDatosIniciales();
  Object.entries(datos).forEach(([k, v]) => escribirCrudo(k, v));
  memoria.__version = VERSION;
  try {
    localStorage.setItem(VERSION_KEY, VERSION);
  } catch {
    /* nada */
  }
}

export function leer(coleccion) {
  asegurarDatos();
  // Copia profunda: quien lee puede modificar sin tocar lo guardado.
  return structuredClone(leerCrudo(coleccion));
}

export function guardar(coleccion, datos) {
  asegurarDatos();
  escribirCrudo(coleccion, datos);
}

export function siguienteId(lista) {
  return lista.reduce((max, x) => Math.max(max, x.id), 0) + 1;
}

// Simula la latencia de la red.
export const esperar = (ms = 250) => new Promise((r) => setTimeout(r, ms));

// Borra todo y vuelve a los datos de prueba.
export function restablecerDatos() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIJO))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    /* nada */
  }
  Object.keys(memoria).forEach((k) => delete memoria[k]);
  asegurarDatos();
}
