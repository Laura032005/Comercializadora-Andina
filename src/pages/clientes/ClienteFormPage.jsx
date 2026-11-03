import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { actualizarCliente, crearCliente, obtenerCliente } from '../../services/clientesService';
import { validarCliente, validarCorreo, validarTelefono } from '../../utils/validaciones';
import { Alerta, Campo, Cargando, Encabezado, propsCampo } from '../../components/ui';

const VACIO = { identificacion: '', nombre: '', tipo: '', telefono: '', correo: '', direccion: '' };

// HU01 - Registrar cliente / HU03 - Actualizar cliente
export default function ClienteFormPage() {
  const { id } = useParams();
  const esEdicion = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [cargando, setCargando] = useState(esEdicion);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!esEdicion) return;
    let activo = true;
    obtenerCliente(id)
      .then((c) => {
        if (!activo) return;
        setForm({
          identificacion: c.identificacion ?? '',
          nombre: c.nombre ?? '',
          tipo: c.tipo ?? '',
          telefono: c.telefono ?? '',
          correo: c.correo ?? '',
          direccion: c.direccion ?? '',
        });
      })
      .catch((e) => activo && setErrorGeneral(e.message))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, [id, esEdicion]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errores[name]) setErrores((er) => ({ ...er, [name]: '' }));
  }

  function handleBlur(e) {
    const { name, value } = e.target;
    if (name === 'correo') setErrores((er) => ({ ...er, correo: validarCorreo(value) }));
    if (name === 'telefono') setErrores((er) => ({ ...er, telefono: validarTelefono(value) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const nuevos = validarCliente(form, { esEdicion });
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    const datos = {
      ...form,
      identificacion: form.identificacion.trim(),
      nombre: form.nombre.trim(),
      telefono: form.telefono.replace(/[\s-]/g, ''),
      correo: form.correo.trim().toLowerCase(),
      direccion: form.direccion.trim(),
    };

    setGuardando(true);
    setErrorGeneral('');
    try {
      const guardado = esEdicion ? await actualizarCliente(id, datos) : await crearCliente(datos);
      const destinoId = guardado?.id ?? id;
      const mensaje = esEdicion ? 'Cliente actualizado correctamente.' : 'Cliente registrado correctamente.';
      navigate(destinoId ? `/clientes/${destinoId}` : '/clientes', { replace: true, state: { mensaje } });
    } catch (err) {
      if (err.status === 409) {
        setErrores((er) => ({ ...er, identificacion: 'Ya existe un cliente con esta identificación.' }));
        setErrorGeneral('Ya existe un cliente con esta identificación.');
      } else {
        if (err.errores) setErrores((er) => ({ ...er, ...err.errores }));
        setErrorGeneral(err.message);
      }
      setGuardando(false);
    }
  }

  if (cargando) return <Cargando />;

  return (
    <>
      <Link to={esEdicion ? `/clientes/${id}` : '/clientes'} className="volver">← Volver</Link>
      <Encabezado
        titulo={esEdicion ? 'Actualizar cliente' : 'Nuevo cliente'}
        descripcion={
          esEdicion
            ? 'Puedes modificar el tipo, teléfono, correo y dirección. La identificación no se puede cambiar.'
            : 'Los campos marcados con * son obligatorios.'
        }
      />

      <Alerta onCerrar={() => setErrorGeneral('')}>{errorGeneral}</Alerta>

      <form className="tarjeta" onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          <Campo id="identificacion" etiqueta="Identificación (NIT / CC)" error={errores.identificacion} obligatorio={!esEdicion}>
            <input
              {...propsCampo('identificacion', errores.identificacion)}
              value={form.identificacion}
              onChange={handleChange}
              disabled={esEdicion || guardando}
              maxLength={20}
              autoFocus={!esEdicion}
            />
          </Campo>

          <Campo id="nombre" etiqueta="Nombre o razón social" error={errores.nombre} obligatorio={!esEdicion}>
            <input
              {...propsCampo('nombre', errores.nombre)}
              value={form.nombre}
              onChange={handleChange}
              disabled={esEdicion || guardando}
              maxLength={120}
            />
          </Campo>

          <Campo id="tipo" etiqueta="Tipo de cliente" error={errores.tipo} obligatorio>
            <select {...propsCampo('tipo', errores.tipo)} value={form.tipo} onChange={handleChange} disabled={guardando}>
              <option value="">Selecciona…</option>
              <option value="DETAL">Detal</option>
              <option value="MAYORISTA">Mayorista</option>
            </select>
          </Campo>

          <Campo id="telefono" etiqueta="Teléfono" error={errores.telefono} obligatorio>
            <input
              {...propsCampo('telefono', errores.telefono)}
              type="tel"
              inputMode="tel"
              value={form.telefono}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={guardando}
              maxLength={20}
              placeholder="Ej. 3101234567"
            />
          </Campo>

          <Campo id="correo" etiqueta="Correo electrónico" error={errores.correo} obligatorio>
            <input
              {...propsCampo('correo', errores.correo)}
              type="email"
              value={form.correo}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={guardando}
              maxLength={120}
              placeholder="nombre@dominio.com"
            />
          </Campo>

          <Campo id="direccion" etiqueta="Dirección" error={errores.direccion}>
            <input
              {...propsCampo('direccion', errores.direccion)}
              value={form.direccion}
              onChange={handleChange}
              disabled={guardando}
              maxLength={200}
            />
          </Campo>
        </div>

        <div className="form-acciones">
          <Link to={esEdicion ? `/clientes/${id}` : '/clientes'} className="btn btn-secundario">Cancelar</Link>
          <button type="submit" className="btn" disabled={guardando}>
            {guardando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Registrar cliente'}
          </button>
        </div>
      </form>
    </>
  );
}
