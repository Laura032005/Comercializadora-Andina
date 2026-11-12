// Módulo Clientes (finales y mayoristas). El historial de compras sale de ventasService.listar({ clienteId }).
import { USE_MOCK } from './config';
import { http } from './http';
import { esperar, guardar, leer, siguienteId } from './mockDb';

function limpiar(datos) {
  return {
    tipo: datos.tipo,
    documento: datos.documento.trim(),
    nombre: datos.nombre.trim(),
    telefono: datos.telefono.trim(),
    email: datos.email.trim(),
    direccion: datos.direccion.trim(),
  };
}

const mock = {
  async listar() {
    await esperar();
    return leer('clientes');
  },
  async obtener(id) {
    await esperar();
    const c = leer('clientes').find((x) => x.id === Number(id));
    if (!c) throw new Error('El cliente no existe.');
    return c;
  },
  async crear(datos) {
    await esperar();
    const lista = leer('clientes');
    const c = limpiar(datos);
    if (lista.some((x) => x.documento === c.documento)) {
      throw new Error(`Ya existe un cliente con el documento ${c.documento}.`);
    }
    const nuevo = { id: siguienteId(lista), ...c };
    guardar('clientes', [...lista, nuevo]);
    return nuevo;
  },
  async actualizar(id, datos) {
    await esperar();
    const lista = leer('clientes');
    const c = limpiar(datos);
    if (lista.some((x) => x.documento === c.documento && x.id !== id)) {
      throw new Error(`Ya existe un cliente con el documento ${c.documento}.`);
    }
    const actual = lista.find((x) => x.id === id);
    if (!actual) throw new Error('El cliente no existe.');
    Object.assign(actual, c);
    guardar('clientes', lista);
    return actual;
  },
};

const api = {
  listar: () => http('/clientes'),
  obtener: (id) => http(`/clientes/${id}`),
  crear: (datos) => http('/clientes', { method: 'POST', body: limpiar(datos) }),
  actualizar: (id, datos) => http(`/clientes/${id}`, { method: 'PUT', body: limpiar(datos) }),
};

export default USE_MOCK ? mock : api;
