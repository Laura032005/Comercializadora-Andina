// Módulo Usuarios (solo ADMIN).
import { USE_MOCK } from './config';
import { http } from './http';
import { esperar, guardar, leer, siguienteId } from './mockDb';

const sinPassword = ({ password, ...u }) => u;

const mock = {
  async listar() {
    await esperar();
    return leer('usuarios').map(sinPassword);
  },
  async crear(datos) {
    await esperar();
    const lista = leer('usuarios');
    const correo = datos.correo.trim().toLowerCase();
    if (lista.some((u) => u.correo === correo)) {
      throw new Error(`Ya existe un usuario con el correo ${correo}.`);
    }
    const nuevo = {
      id: siguienteId(lista),
      correo,
      password: datos.password,
      nombre: datos.nombre.trim(),
      rol: datos.rol,
      activo: true,
    };
    guardar('usuarios', [...lista, nuevo]);
    return sinPassword(nuevo);
  },
  async actualizar(id, datos) {
    await esperar();
    const lista = leer('usuarios');
    const u = lista.find((x) => x.id === id);
    if (!u) throw new Error('El usuario no existe.');
    u.nombre = datos.nombre.trim();
    u.rol = datos.rol;
    if (datos.password) u.password = datos.password;
    guardar('usuarios', lista);
    return sinPassword(u);
  },
  async cambiarEstado(id, activo) {
    await esperar();
    const lista = leer('usuarios');
    const u = lista.find((x) => x.id === id);
    if (!u) throw new Error('El usuario no existe.');
    u.activo = activo;
    guardar('usuarios', lista);
    return sinPassword(u);
  },
};

const api = {
  listar: () => http('/usuarios'),
  crear: (datos) => http('/usuarios', { method: 'POST', body: datos }),
  actualizar: (id, datos) => http(`/usuarios/${id}`, { method: 'PUT', body: datos }),
  cambiarEstado: (id, activo) => http(`/usuarios/${id}/estado`, { method: 'PATCH', body: { activo } }),
};

export default USE_MOCK ? mock : api;
