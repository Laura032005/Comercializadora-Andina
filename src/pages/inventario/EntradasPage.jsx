import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDatos } from '../../hooks/useDatos';
import { useFormularioCrud as useFormulario } from '../../hooks/useFormularioCrud';
import productosService from '../../services/productosService';
import inventarioService from '../../services/inventarioService';
import { BODEGAS, nombreBodega, stockEn } from '../../services/catalogos';
import { validarMovimiento } from '../../utils/validacionesModulos';
import { formatoFecha, formatoNumero } from '../../utils/formato';
import { Aviso, Campo, EncabezadoPagina, EstadoDatos } from '../../components/UI';

// Entradas de mercancía (proveedores) y traslados entre las dos bodegas.
export default function EntradasPage() {
  const { usuario } = useAuth();
  const { datos, cargando, error, recargar } = useDatos(() =>
    Promise.all([productosService.listar(), inventarioService.listarMovimientos()])
  );
  const [productos, movimientos] = datos ?? [[], []];
  const [pestana, setPestana] = useState('ENTRADA');
  const [aviso, setAviso] = useState(null);

  const recientes = movimientos.filter((m) => m.tipo === pestana).slice(0, 15);

  return (
    <>
      <EncabezadoPagina titulo="Entradas y traslados" descripcion="Todo ingreso o movimiento entre bodegas queda registrado con usuario y fecha." />
      <div className="pestanas" role="tablist">
        <button type="button" role="tab" aria-selected={pestana === 'ENTRADA'} onClick={() => { setPestana('ENTRADA'); setAviso(null); }}>Entrada de mercancía</button>
        <button type="button" role="tab" aria-selected={pestana === 'TRASLADO'} onClick={() => { setPestana('TRASLADO'); setAviso(null); }}>Traslado entre bodegas</button>
      </div>
      <Aviso aviso={aviso} onCerrar={() => setAviso(null)} />

      <EstadoDatos cargando={cargando && !datos} error={error} onReintentar={recargar}>
        <div className="dos-columnas">
          <section className="panel">
            <h2>{pestana === 'ENTRADA' ? 'Registrar entrada' : 'Registrar traslado'}</h2>
            <MovimientoForm
              key={pestana}
              esTraslado={pestana === 'TRASLADO'}
              productos={productos.filter((p) => p.activo)}
              onGuardar={async (v) => {
                const mov = pestana === 'TRASLADO'
                  ? await inventarioService.registrarTraslado(v, usuario)
                  : await inventarioService.registrarEntrada(v, usuario);
                setAviso({
                  tipo: 'exito',
                  texto: pestana === 'TRASLADO'
                    ? `Trasladadas ${formatoNumero(mov.cantidad)} unidades de ${mov.productoNombre} a ${nombreBodega(mov.bodegaId)}.`
                    : `Ingresadas ${formatoNumero(mov.cantidad)} unidades de ${mov.productoNombre} a ${nombreBodega(mov.bodegaId)}.`,
                });
                recargar();
              }}
            />
          </section>

          <section className="panel">
            <h2>Últimos registros</h2>
            <EstadoDatos vacio={recientes.length === 0} textoVacio="Aún no hay registros.">
              <ul className="lista-simple">
                {recientes.map((m) => (
                  <li key={m.id}>
                    <span>
                      <strong>+{formatoNumero(m.cantidad)}</strong> {m.productoNombre}
                      <br />
                      <span className="texto-suave">
                        {m.tipo === 'TRASLADO' ? `${nombreBodega(m.bodegaOrigenId)} → ${nombreBodega(m.bodegaId)}` : `${nombreBodega(m.bodegaId)} · ${m.proveedor || '—'}`}
                        {m.referencia ? ` · ${m.referencia}` : ''}
                      </span>
                    </span>
                    <span className="texto-suave">{formatoFecha(m.fecha)}<br />{m.usuario}</span>
                  </li>
                ))}
              </ul>
            </EstadoDatos>
          </section>
        </div>
      </EstadoDatos>
    </>
  );
}

function MovimientoForm({ esTraslado, productos, onGuardar }) {
  const inicial = { productoId: '', bodegaOrigenId: '1', bodegaId: esTraslado ? '2' : '1', cantidad: '', proveedor: '', referencia: '' };
  const { valores, setValores, errores, enviando, errorGeneral, cambiar, enviar } = useFormulario(inicial, (v) =>
    validarMovimiento(v, esTraslado)
  );
  const producto = productos.find((p) => p.id === Number(valores.productoId));

  const guardar = async (e) => {
    const ok = await enviar(e, onGuardar);
    if (ok) setValores(inicial);
  };

  return (
    <form onSubmit={guardar} noValidate className="formulario">
      {errorGeneral && <div className="alerta-error" role="alert">{errorGeneral}</div>}
      <Campo id="m-producto" label="Producto" error={errores.productoId}>
        <select id="m-producto" name="productoId" value={valores.productoId} onChange={cambiar}>
          <option value="">Selecciona…</option>
          {productos.map((p) => <option key={p.id} value={p.id}>{p.codigo} · {p.nombre}</option>)}
        </select>
      </Campo>
      {producto && (
        <p className="ayuda-campo">
          Existencias actuales: {BODEGAS.map((b) => `${b.nombre}: ${formatoNumero(stockEn(producto, b.id))} ${producto.unidad}`).join(' · ')}
        </p>
      )}
      <div className="formulario-fila">
        {esTraslado && (
          <Campo id="m-origen" label="Desde" error={errores.bodegaOrigenId}>
            <select id="m-origen" name="bodegaOrigenId" value={valores.bodegaOrigenId} onChange={cambiar}>
              {BODEGAS.map((b) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
            </select>
          </Campo>
        )}
        <Campo id="m-bodega" label={esTraslado ? 'Hacia' : 'Bodega que recibe'}>
          <select id="m-bodega" name="bodegaId" value={valores.bodegaId} onChange={cambiar}>
            {BODEGAS.map((b) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
          </select>
        </Campo>
        <Campo id="m-cantidad" label={`Cantidad${producto ? ` (${producto.unidad})` : ''}`} error={errores.cantidad}>
          <input id="m-cantidad" name="cantidad" type="number" min="1" step="1" value={valores.cantidad} onChange={cambiar} />
        </Campo>
      </div>
      {!esTraslado && (
        <Campo id="m-proveedor" label="Proveedor" error={errores.proveedor}>
          <input id="m-proveedor" name="proveedor" value={valores.proveedor} onChange={cambiar} maxLength={100} />
        </Campo>
      )}
      <Campo id="m-referencia" label={esTraslado ? 'Motivo / nota (opcional)' : 'Factura o remisión del proveedor'} error={errores.referencia}>
        <input id="m-referencia" name="referencia" value={valores.referencia} onChange={cambiar} maxLength={100} />
      </Campo>
      <div className="formulario-acciones">
        <button type="submit" className="btn" disabled={enviando}>
          {enviando ? 'Guardando…' : esTraslado ? 'Registrar traslado' : 'Registrar entrada'}
        </button>
      </div>
    </form>
  );
}
