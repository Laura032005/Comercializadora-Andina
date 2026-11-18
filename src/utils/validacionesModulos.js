// Reglas de los formularios de los módulos (las de login y registro están en validaciones.js).
import { validarCorreo, validarNombre, validarPasswordNueva } from './validaciones';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const vacio = (v) => !String(v ?? '').trim();

function limpiarErrores(errores) {
  return Object.fromEntries(Object.entries(errores).filter(([, v]) => v));
}

export function validarUsuarioForm(u, esNuevo) {
  return limpiarErrores({
    correo: esNuevo ? validarCorreo(u.correo) : '',
    nombre: validarNombre(u.nombre),
    rol: vacio(u.rol) ? 'Selecciona un rol.' : '',
    password: esNuevo || u.password ? validarPasswordNueva(u.password) : '',
  });
}
export function validarProducto(p) {
  const precio = Number(p.precio);
  const minimo = Number(p.stockMinimo);
  return limpiarErrores({
    codigo: vacio(p.codigo) ? 'El código es obligatorio.' : !/^[A-Za-z0-9-]{2,20}$/.test(p.codigo.trim()) ? 'Usa de 2 a 20 letras, números o guiones.' : '',
    nombre: vacio(p.nombre) ? 'El nombre es obligatorio.' : '',
    categoria: vacio(p.categoria) ? 'La categoría es obligatoria.' : '',
    unidad: vacio(p.unidad) ? 'Selecciona la unidad.' : '',
    precio: vacio(p.precio) || !(precio > 0) ? 'El precio debe ser mayor que 0.' : '',
    stockMinimo: vacio(p.stockMinimo) || !Number.isInteger(minimo) || minimo < 0 ? 'Debe ser un entero mayor o igual a 0.' : '',
  });
}

export function validarCliente(c) {
  return limpiarErrores({
    tipo: vacio(c.tipo) ? 'Selecciona el tipo de cliente.' : '',
    documento: vacio(c.documento) ? 'El documento o NIT es obligatorio.' : !/^[0-9-]{5,15}$/.test(c.documento.trim()) ? 'Solo números y guion (5 a 15 caracteres).' : '',
    nombre: vacio(c.nombre) ? 'El nombre o razón social es obligatorio.' : '',
    telefono: c.telefono && !/^[0-9 +-]{7,15}$/.test(c.telefono.trim()) ? 'Teléfono inválido.' : '',
    email: c.email && !EMAIL.test(c.email.trim()) ? 'Correo inválido.' : '',
    direccion: c.tipo === 'MAYORISTA' && vacio(c.direccion) ? 'La dirección es obligatoria para mayoristas (se usa en los despachos).' : '',
  });
}

export function validarMovimiento(m, esTraslado) {
  const cantidad = Number(m.cantidad);
  return limpiarErrores({
    productoId: vacio(m.productoId) ? 'Selecciona un producto.' : '',
    cantidad: !Number.isInteger(cantidad) || cantidad < 1 ? 'Debe ser un entero mayor que 0.' : '',
    bodegaOrigenId: esTraslado && String(m.bodegaOrigenId) === String(m.bodegaId) ? 'Debe ser distinta a la bodega destino.' : '',
    proveedor: !esTraslado && vacio(m.proveedor) ? 'El proveedor es obligatorio.' : '',
    referencia: !esTraslado && vacio(m.referencia) ? 'Indica la factura o remisión del proveedor.' : '',
  });
}
