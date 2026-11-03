import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useCarga } from '../../hooks/useCarga';
import { actualizarProducto, crearProducto, listarCategorias, obtenerProducto } from '../../services/productosService';
import { validarProducto } from '../../utils/validaciones';
import { Alerta, Campo, Cargando, Encabezado, propsCampo } from '../../components/ui';

const VACIO = { codigo: '', nombre: '', categoria: '', precio: '', stock: '', stockMinimo: '' };

// HU05 - Registrar producto / HU07 - Actualizar producto
export default function ProductoFormPage() {
  const { id } = useParams();
  const esEdicion = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [cargando, setCargando] = useState(esEdicion);
  const [guardando, setGuardando] = useState(false);
  const { datos: categorias } = useCarga(listarCategorias, []);

  useEffect(() => {
    if (!esEdicion) return;
    let activo = true;
    obtenerProducto(id)
      .then((p) => {
        if (!activo) return;
        setForm({
          codigo: p.codigo ?? '',
          nombre: p.nombre ?? '',
          categoria: p.categoria ?? '',
          precio: p.precio ?? '',
          stock: p.stock ?? '',
          stockMinimo: p.stockMinimo ?? '',
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

  async function handleSubmit(e) {
    e.preventDefault();
    const nuevos = validarProducto(form, { esEdicion });
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    const datos = {
      codigo: form.codigo.trim().toUpperCase(),
      nombre: form.nombre.trim(),
      categoria: form.categoria.trim(),
      precio: Number(form.precio),
      stock: Number(form.stock),
      stockMinimo: Number(form.stockMinimo),
    };

    setGuardando(true);
    setErrorGeneral('');
    try {
      const guardado = esEdicion ? await actualizarProducto(id, datos) : await crearProducto(datos);
      const destinoId = guardado?.id ?? id;
      const mensaje = esEdicion ? 'Producto actualizado correctamente.' : 'Producto registrado correctamente.';
      navigate(destinoId ? `/productos/${destinoId}` : '/productos', { replace: true, state: { mensaje } });
    } catch (err) {
      if (err.status === 409) {
        setErrores((er) => ({ ...er, codigo: 'Ya existe un producto con este código.' }));
        setErrorGeneral('Ya existe un producto con este código.');
      } else {
        if (err.errores) setErrores((er) => ({ ...er, ...err.errores }));
        setErrorGeneral(err.message);
      }
      setGuardando(false);
    }
  }

  if (cargando) return <Cargando />;

  const volverA = esEdicion ? `/productos/${id}` : '/productos';

  return (
    <>
      <Link to={volverA} className="volver">← Volver</Link>
      <Encabezado
        titulo={esEdicion ? 'Actualizar producto' : 'Nuevo producto'}
        descripcion={
          esEdicion
            ? 'Puedes modificar el nombre, categoría, precio y stock mínimo. El código no se puede cambiar.'
            : 'El producto quedará activo en el catálogo al registrarlo.'
        }
      />

      <Alerta onCerrar={() => setErrorGeneral('')}>{errorGeneral}</Alerta>

      <form className="tarjeta" onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          <Campo id="codigo" etiqueta="Código" error={errores.codigo} obligatorio={!esEdicion} ayuda={!esEdicion ? 'Único. Ej. PRD-001' : undefined}>
            <input
              {...propsCampo('codigo', errores.codigo)}
              value={form.codigo}
              onChange={handleChange}
              disabled={esEdicion || guardando}
              maxLength={30}
              autoFocus={!esEdicion}
            />
          </Campo>

          <Campo id="nombre" etiqueta="Nombre" error={errores.nombre} obligatorio>
            <input {...propsCampo('nombre', errores.nombre)} value={form.nombre} onChange={handleChange} disabled={guardando} maxLength={120} />
          </Campo>

          <Campo id="categoria" etiqueta="Categoría" error={errores.categoria} obligatorio>
            <input
              {...propsCampo('categoria', errores.categoria)}
              value={form.categoria}
              onChange={handleChange}
              disabled={guardando}
              list="lista-categorias"
              maxLength={60}
              autoComplete="off"
            />
            <datalist id="lista-categorias">
              {(categorias ?? []).map((c) => {
                const valor = typeof c === 'string' ? c : c.nombre;
                return <option key={valor} value={valor} />;
              })}
            </datalist>
          </Campo>

          <Campo id="precio" etiqueta="Precio unitario (COP)" error={errores.precio} obligatorio>
            <input
              {...propsCampo('precio', errores.precio)}
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={form.precio}
              onChange={handleChange}
              disabled={guardando}
            />
          </Campo>

          <Campo
            id="stock"
            etiqueta={esEdicion ? 'Stock actual' : 'Stock inicial'}
            error={errores.stock}
            obligatorio={!esEdicion}
            ayuda={esEdicion ? 'El stock cambia con los pedidos confirmados.' : undefined}
          >
            <input
              {...propsCampo('stock', errores.stock)}
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={form.stock}
              onChange={handleChange}
              disabled={esEdicion || guardando}
            />
          </Campo>

          <Campo id="stockMinimo" etiqueta="Stock mínimo" error={errores.stockMinimo} obligatorio ayuda="Al llegar a este valor se genera una alerta de bajo stock.">
            <input
              {...propsCampo('stockMinimo', errores.stockMinimo)}
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={form.stockMinimo}
              onChange={handleChange}
              disabled={guardando}
            />
          </Campo>
        </div>

        <div className="form-acciones">
          <Link to={volverA} className="btn btn-secundario">Cancelar</Link>
          <button type="submit" className="btn" disabled={guardando}>
            {guardando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Registrar producto'}
          </button>
        </div>
      </form>
    </>
  );
}
