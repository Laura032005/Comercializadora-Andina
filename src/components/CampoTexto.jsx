// Campo de formulario con etiqueta, mensaje de error y (opcional) botón mostrar/ocultar contraseña.
import { useState } from 'react';

export default function CampoTexto({ id, etiqueta, error, esPassword = false, ...props }) {
  const [ver, setVer] = useState(false);
  const input = (
    <input
      id={id}
      name={id}
      type={esPassword ? (ver ? 'text' : 'password') : props.type || 'text'}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `error-${id}` : undefined}
      {...props}
    />
  );
  return (
    <div className="campo">
      <label htmlFor={id}>{etiqueta}</label>
      {esPassword ? (
        <div className="campo-password">
          {input}
          <button
            type="button"
            className="btn-ver"
            onClick={() => setVer((v) => !v)}
            aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {ver ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
      ) : (
        input
      )}
      {error && (
        <p id={`error-${id}`} className="error-campo">
          {error}
        </p>
      )}
    </div>
  );
}
