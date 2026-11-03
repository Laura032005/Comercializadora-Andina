// Componentes de interfaz reutilizables.
import { useEffect, useRef } from 'react';
import { NOMBRE_ESTADO_PEDIDO } from '../utils/formato';

export function Encabezado({ titulo, descripcion, children }) {
  return (
    <div className="encabezado">
      <div>
        <h1>{titulo}</h1>
        {descripcion && <p>{descripcion}</p>}
      </div>
      {children && <div className="encabezado-acciones">{children}</div>}
    </div>
  );
}

export function Alerta({ tipo = 'error', children, onCerrar }) {
  if (!children) return null;
  return (
    <div className={`alerta alerta-${tipo}`} role={tipo === 'error' ? 'alert' : 'status'}>
      <div className="alerta-texto">{children}</div>
      {onCerrar && (
        <button type="button" className="alerta-cerrar" onClick={onCerrar} aria-label="Cerrar mensaje">
          ×
        </button>
      )}
    </div>
  );
}

export function Cargando({ texto = 'Cargando…' }) {
  return (
    <div className="cargando" role="status">
      <span className="spinner" aria-hidden="true" />
      {texto}
    </div>
  );
}

export function Vacio({ titulo, children }) {
  return (
    <div className="vacio">
      <p className="vacio-titulo">{titulo}</p>
      {children && <p>{children}</p>}
    </div>
  );
}

export function Campo({ id, etiqueta, error, ayuda, obligatorio, children }) {
  return (
    <div className="campo">
      <label htmlFor={id}>
        {etiqueta}
        {obligatorio && <span className="obligatorio" aria-hidden="true"> *</span>}
      </label>
      {children}
      {ayuda && !error && <p className="ayuda-campo">{ayuda}</p>}
      {error && (
        <p id={`error-${id}`} className="error-campo">
          {error}
        </p>
      )}
    </div>
  );
}

// Props comunes para un input con validación accesible.
export function propsCampo(id, error) {
  return {
    id,
    name: id,
    'aria-invalid': Boolean(error),
    'aria-describedby': error ? `error-${id}` : undefined,
  };
}

export function EstadoPedido({ estado }) {
  const clave = String(estado || '').toUpperCase();
  return (
    <span className={`badge badge-estado-${clave.toLowerCase()}`}>
      {NOMBRE_ESTADO_PEDIDO[clave] || estado}
    </span>
  );
}

export function Paginacion({ pagina, totalPaginas, totalElementos, onCambiar }) {
  if (!totalPaginas || totalPaginas <= 1) {
    return totalElementos ? <p className="paginacion-info">{totalElementos} registro(s)</p> : null;
  }
  return (
    <nav className="paginacion" aria-label="Paginación">
      <button type="button" className="btn btn-secundario btn-sm" disabled={pagina <= 0} onClick={() => onCambiar(pagina - 1)}>
        ← Anterior
      </button>
      <span className="paginacion-info">
        Página {pagina + 1} de {totalPaginas} · {totalElementos} registro(s)
      </span>
      <button
        type="button"
        className="btn btn-secundario btn-sm"
        disabled={pagina >= totalPaginas - 1}
        onClick={() => onCambiar(pagina + 1)}
      >
        Siguiente →
      </button>
    </nav>
  );
}

// Ventana de confirmación propia (no usa window.confirm).
export function Confirmacion({ abierta, titulo, children, textoConfirmar = 'Confirmar', peligro, ocupado, onConfirmar, onCancelar }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!abierta) return undefined;
    ref.current?.querySelector('button')?.focus();
    const alPresionar = (e) => {
      if (e.key === 'Escape' && !ocupado) onCancelar();
    };
    document.addEventListener('keydown', alPresionar);
    return () => document.removeEventListener('keydown', alPresionar);
  }, [abierta, ocupado, onCancelar]);

  if (!abierta) return null;
  return (
    <div className="modal-fondo" onClick={() => !ocupado && onCancelar()}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modal-titulo">{titulo}</h2>
        <div className="modal-cuerpo">{children}</div>
        <div className="modal-acciones" ref={ref}>
          <button type="button" className="btn btn-secundario" onClick={onCancelar} disabled={ocupado}>
            Cancelar
          </button>
          <button type="button" className={`btn ${peligro ? 'btn-peligro' : ''}`} onClick={onConfirmar} disabled={ocupado}>
            {ocupado ? 'Procesando…' : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
