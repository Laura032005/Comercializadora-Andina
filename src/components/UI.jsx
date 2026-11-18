// Componentes pequeños reutilizados por todos los módulos.
import { useEffect, useRef } from 'react';

export function EncabezadoPagina({ titulo, descripcion, acciones }) {
  return (
    <header className="pagina-encabezado">
      <div>
        <h1>{titulo}</h1>
        {descripcion && <p>{descripcion}</p>}
      </div>
      {acciones && <div className="pagina-acciones">{acciones}</div>}
    </header>
  );
}

// Campo de formulario con etiqueta y mensaje de error. El hijo debe tener id={id}.
export function Campo({ id, label, error, ayuda, children }) {
  return (
    <div className={`campo${error ? ' campo-con-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {ayuda && !error && <p className="ayuda-campo">{ayuda}</p>}
      {error && <p className="error-campo" role="alert">{error}</p>}
    </div>
  );
}

export function Aviso({ aviso, onCerrar }) {
  if (!aviso) return null;
  return (
    <div className={`aviso aviso-${aviso.tipo}`} role={aviso.tipo === 'error' ? 'alert' : 'status'}>
      <span>{aviso.texto}</span>
      {onCerrar && (
        <button type="button" className="aviso-cerrar" onClick={onCerrar} aria-label="Cerrar aviso">×</button>
      )}
    </div>
  );
}

// Muestra carga, error o vacío; si no, los hijos.
export function EstadoDatos({ cargando, error, vacio, textoVacio = 'No hay registros.', onReintentar, children }) {
  if (cargando) return <p className="estado-datos">Cargando…</p>;
  if (error) {
    return (
      <div className="estado-datos estado-error">
        <p>{error}</p>
        {onReintentar && <button type="button" className="btn btn-secundario" onClick={onReintentar}>Reintentar</button>}
      </div>
    );
  }
  if (vacio) return <p className="estado-datos">{textoVacio}</p>;
  return children;
}

export function Insignia({ tono = 'neutro', children }) {
  return <span className={`insignia insignia-${tono}`}>{children}</span>;
}

export function Modal({ titulo, abierto, onCerrar, children, ancho }) {
  const ref = useRef(null);
  const cerrarRef = useRef(onCerrar);
  cerrarRef.current = onCerrar;
  useEffect(() => {
    if (!abierto) return undefined;
    const anterior = document.activeElement;
    const primero =
      ref.current?.querySelector('input:not([disabled]), select:not([disabled]), textarea') ??
      ref.current?.querySelector('button');
    primero?.focus();
    const onKey = (e) => e.key === 'Escape' && cerrarRef.current();
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      anterior?.focus?.();
    };
  }, [abierto]);

  if (!abierto) return null;
  return (
    <div className="modal-fondo" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-titulo" ref={ref} style={ancho ? { maxWidth: ancho } : undefined}>
        <div className="modal-encabezado">
          <h2 id="modal-titulo">{titulo}</h2>
          <button type="button" className="modal-cerrar" onClick={onCerrar} aria-label="Cerrar">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Tarjeta de indicador (cifra principal + detalle).
export function Indicador({ titulo, valor, detalle, tono }) {
  return (
    <div className={`indicador${tono ? ` indicador-${tono}` : ''}`}>
      <p className="indicador-titulo">{titulo}</p>
      <p className="indicador-valor">{valor}</p>
      {detalle && <p className="indicador-detalle">{detalle}</p>}
    </div>
  );
}

// Barra horizontal de una sola serie para tablas de ranking. El valor va como texto aparte.
export function Barra({ valor, maximo, etiqueta }) {
  const ancho = maximo > 0 ? Math.max(2, (valor / maximo) * 100) : 0;
  return (
    <div className="barra" title={etiqueta} aria-hidden="true">
      <div className="barra-relleno" style={{ width: `${ancho}%` }} />
    </div>
  );
}
