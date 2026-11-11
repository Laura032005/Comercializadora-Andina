import { useState } from 'react';
import { useDatos } from '../../hooks/useDatos';
import { useFormulario } from '../../hooks/useFormulario';
import productosService from '../../services/productosService';
import { BODEGAS, stockEn, stockTotal, UNIDADES } from '../../services/catalogos';
import { validarProducto } from '../../utils/validaciones';
import { formatoMoneda, formatoNumero } from '../../utils/formato';
import { Aviso, Campo, EncabezadoPagina, EstadoDatos, Insignia, Modal } from '../../components/UI';
import { InsigniaStock } from '../../components/Insignias';

export default function ProductosPage() {
  const { datos, cargando, error, recargar } = useDatos(() => productosService.listar());
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('');
  const [editando, setEditando] = useState(null);
  const [aviso, setAviso] = useState(null);

  const productos = datos ?? [];
  const categorias = [...new Set(productos.map((p) => p.categoria))].sort();
  const texto = busqueda.trim().toLowerCase();
  const filtrados = productos.filter(
    (p) =>
      (!categoria || p.categoria === categoria) &&
      (!texto || p.codigo.toLowerCase().includes(texto) || p.nombre.toLowerCase().includes(texto))
  );

  async function cambiarEstado(p) {
    try {
      await productosService.cambiarEstado(p.id, !p.activo);
      setAviso({ tipo: 'exito', texto: `${p.nombre} ${p.activo ? 'desactivado: ya no aparece para vender' : 'activado'}.` });
      recargar();
    } catch (e) {
      setAviso({ tipo: 'error', texto: e.message });
    }
  }

  return (
    <>
      <EncabezadoPagina
        titulo="Productos"
        descripcion="Catálogo de ferretería y construcción. Las existencias cambian solo con entradas, traslados y ventas."
        acciones={<button type="button" className="btn" onClick={() => setEditando({})}>Nuevo producto</button>}
      />
      <Aviso aviso={aviso} onCerrar={() => setAviso(null)} />

      <div className="filtros">
        <input type="search" placeholder="Buscar por código o nombre" aria-label="Buscar productos" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        <select aria-label="Filtrar por categoría" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          <option value="">Todas las categorías</option>
          {categorias.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <EstadoDatos cargando={cargando && !datos} error={error} vacio={filtrados.length === 0} onReintentar={recargar}>
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th>Código</th><th>Producto</th><th>Categoría</th><th className="num">Precio (sin IVA)</th>
                {BODEGAS.map((b) => <th key={b.id} className="num">{b.nombre}</th>)}
                <th className="num">Total</th><th>Estado</th><th className="acciones">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p) => (
                <tr key={p.id} className={p.activo ? '' : 'fila-inactiva'}>
                  <td>{p.codigo}</td>
                  <td>{p.nombre} <span className="texto-suave">/ {p.unidad}</span></td>
                  <td>{p.categoria}</td>
                  <td className="num">{formatoMoneda(p.precio)}</td>
                  {BODEGAS.map((b) => <td key={b.id} className="num">{formatoNumero(stockEn(p, b.id))}</td>)}
                  <td className="num"><strong>{formatoNumero(stockTotal(p))}</strong></td>
                  <td>{p.activo ? <InsigniaStock producto={p} /> : <Insignia>Inactivo</Insignia>}</td>
                  <td className="acciones">
                    <button type="button" className="btn-enlace" onClick={() => setEditando(p)}>Editar</button>
                    <button type="button" className="btn-enlace" onClick={() => cambiarEstado(p)}>{p.activo ? 'Desactivar' : 'Activar'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </EstadoDatos>

      <Modal titulo={editando?.id ? `Editar ${editando.codigo}` : 'Nuevo producto'} abierto={Boolean(editando)} onCerrar={() => setEditando(null)}>
        {editando && (
          <ProductoForm
            producto={editando}
            categorias={categorias}
            onCancelar={() => setEditando(null)}
            onGuardado={(p) => {
              setEditando(null);
              setAviso({ tipo: 'exito', texto: `Producto ${p.codigo} guardado.${editando.id ? '' : ' Registra una entrada para cargarle existencias.'}` });
              recargar();
            }}
          />
        )}
      </Modal>
    </>
  );
}

function ProductoForm({ producto, categorias, onGuardado, onCancelar }) {
  const { valores, errores, enviando, errorGeneral, cambiar, enviar } = useFormulario(
    {
      codigo: producto.codigo ?? '',
      nombre: producto.nombre ?? '',
      categoria: producto.categoria ?? '',
      unidad: producto.unidad ?? 'und',
      precio: producto.precio ?? '',
      stockMinimo: producto.stockMinimo ?? '',
    },
    validarProducto
  );

  const guardar = (e) =>
    enviar(e, async (v) => {
      const p = producto.id ? await productosService.actualizar(producto.id, v) : await productosService.crear(v);
      onGuardado(p);
    });

  return (
    <form onSubmit={guardar} noValidate className="formulario">
      {errorGeneral && <div className="alerta-error" role="alert">{errorGeneral}</div>}
      <div className="formulario-fila">
        <Campo id="p-codigo" label="Código" error={errores.codigo}>
          <input id="p-codigo" name="codigo" value={valores.codigo} onChange={cambiar} maxLength={20} />
        </Campo>
        <Campo id="p-unidad" label="Unidad de venta" error={errores.unidad}>
          <select id="p-unidad" name="unidad" value={valores.unidad} onChange={cambiar}>
            {UNIDADES.map((u) => <option key={u}>{u}</option>)}
          </select>
        </Campo>
      </div>
      <Campo id="p-nombre" label="Nombre" error={errores.nombre}>
        <input id="p-nombre" name="nombre" value={valores.nombre} onChange={cambiar} maxLength={120} />
      </Campo>
      <Campo id="p-categoria" label="Categoría" error={errores.categoria}>
        <input id="p-categoria" name="categoria" list="lista-categorias" value={valores.categoria} onChange={cambiar} maxLength={50} />
        <datalist id="lista-categorias">{categorias.map((c) => <option key={c} value={c} />)}</datalist>
      </Campo>
      <div className="formulario-fila">
        <Campo id="p-precio" label="Precio sin IVA (COP)" error={errores.precio}>
          <input id="p-precio" name="precio" type="number" min="1" step="1" value={valores.precio} onChange={cambiar} />
        </Campo>
        <Campo id="p-minimo" label="Stock mínimo (alerta)" error={errores.stockMinimo}>
          <input id="p-minimo" name="stockMinimo" type="number" min="0" step="1" value={valores.stockMinimo} onChange={cambiar} />
        </Campo>
      </div>
      <div className="formulario-acciones">
        <button type="button" className="btn btn-secundario" onClick={onCancelar} disabled={enviando}>Cancelar</button>
        <button type="submit" className="btn" disabled={enviando}>{enviando ? 'Guardando…' : 'Guardar'}</button>
      </div>
    </form>
  );
}
