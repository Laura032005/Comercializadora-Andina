import { useFormulario } from '../../hooks/useFormulario';
import clientesService from '../../services/clientesService';
import { TIPOS_CLIENTE } from '../../services/catalogos';
import { validarCliente } from '../../utils/validaciones';
import { Campo } from '../../components/UI';

// Se usa en Clientes y en Nueva venta (para registrar un cliente sin salir de la venta).
export default function ClienteForm({ cliente = {}, onGuardado, onCancelar }) {
  const { valores, errores, enviando, errorGeneral, cambiar, enviar } = useFormulario(
    {
      tipo: cliente.tipo ?? 'FINAL',
      documento: cliente.documento ?? '',
      nombre: cliente.nombre ?? '',
      telefono: cliente.telefono ?? '',
      email: cliente.email ?? '',
      direccion: cliente.direccion ?? '',
    },
    validarCliente
  );

  const guardar = (e) =>
    enviar(e, async (v) => {
      const c = cliente.id ? await clientesService.actualizar(cliente.id, v) : await clientesService.crear(v);
      onGuardado(c);
    });

  return (
    <form onSubmit={guardar} noValidate className="formulario">
      {errorGeneral && <div className="alerta-error" role="alert">{errorGeneral}</div>}
      <div className="formulario-fila">
        <Campo id="c-tipo" label="Tipo de cliente" error={errores.tipo}>
          <select id="c-tipo" name="tipo" value={valores.tipo} onChange={cambiar}>
            {Object.entries(TIPOS_CLIENTE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Campo>
        <Campo id="c-documento" label="Cédula o NIT" error={errores.documento}>
          <input id="c-documento" name="documento" value={valores.documento} onChange={cambiar} maxLength={15} inputMode="numeric" />
        </Campo>
      </div>
      <Campo id="c-nombre" label={valores.tipo === 'MAYORISTA' ? 'Razón social' : 'Nombre completo'} error={errores.nombre}>
        <input id="c-nombre" name="nombre" value={valores.nombre} onChange={cambiar} maxLength={120} />
      </Campo>
      <div className="formulario-fila">
        <Campo id="c-telefono" label="Teléfono / WhatsApp" error={errores.telefono}>
          <input id="c-telefono" name="telefono" type="tel" value={valores.telefono} onChange={cambiar} maxLength={15} />
        </Campo>
        <Campo id="c-email" label="Correo (para la factura)" error={errores.email}>
          <input id="c-email" name="email" type="email" value={valores.email} onChange={cambiar} maxLength={100} />
        </Campo>
      </div>
      <Campo id="c-direccion" label="Dirección de entrega" error={errores.direccion}>
        <input id="c-direccion" name="direccion" value={valores.direccion} onChange={cambiar} maxLength={150} />
      </Campo>
      <div className="formulario-acciones">
        <button type="button" className="btn btn-secundario" onClick={onCancelar} disabled={enviando}>Cancelar</button>
        <button type="submit" className="btn" disabled={enviando}>{enviando ? 'Guardando…' : 'Guardar cliente'}</button>
      </div>
    </form>
  );
}
