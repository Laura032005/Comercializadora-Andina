import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { validarLogin, validarPassword, validarUsuario } from '../utils/validaciones';
import { MENSAJE_CREDENCIALES } from '../services/authService';
import './LoginPage.css';

const validadores = { usuario: validarUsuario, password: validarPassword };

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ usuario: '', password: '' });
  const [errores, setErrores] = useState({});
  const [tocados, setTocados] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [cargando, setCargando] = useState(false);
  const [verPassword, setVerPassword] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrorGeneral('');
    if (tocados[name]) {
      setErrores((er) => ({ ...er, [name]: validadores[name](value) }));
    }
  }

  function handleBlur(e) {
    const { name, value } = e.target;
    setTocados((t) => ({ ...t, [name]: true }));
    setErrores((er) => ({ ...er, [name]: validadores[name](value) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const nuevosErrores = validarLogin(form);
    setErrores(nuevosErrores);
    setTocados({ usuario: true, password: true });
    if (Object.keys(nuevosErrores).length > 0) return;

    setCargando(true);
    setErrorGeneral('');
    try {
      await login(form.usuario, form.password);
      const destino = location.state?.from?.pathname || '/inicio';
      navigate(destino, { replace: true });
    } catch (err) {
      setErrorGeneral(err.message || MENSAJE_CREDENCIALES);
      setForm((f) => ({ ...f, password: '' }));
      setCargando(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-marca">
          <div className="login-logo" aria-hidden="true">CA</div>
          <h1>Sistema de Ventas</h1>
          <p>Comercial Andina S.A.S.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {errorGeneral && (
            <div className="alerta-error" role="alert">
              {errorGeneral}
            </div>
          )}

          <div className="campo">
            <label htmlFor="usuario">Usuario</label>
            <input
              id="usuario"
              name="usuario"
              type="text"
              autoComplete="username"
              autoFocus
              value={form.usuario}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={Boolean(errores.usuario)}
              aria-describedby={errores.usuario ? 'error-usuario' : undefined}
              disabled={cargando}
              maxLength={50}
            />
            {errores.usuario && (
              <p id="error-usuario" className="error-campo">{errores.usuario}</p>
            )}
          </div>

          <div className="campo">
            <label htmlFor="password">Contraseña</label>
            <div className="campo-password">
              <input
                id="password"
                name="password"
                type={verPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={Boolean(errores.password)}
                aria-describedby={errores.password ? 'error-password' : undefined}
                disabled={cargando}
              />
              <button
                type="button"
                className="btn-ver"
                onClick={() => setVerPassword((v) => !v)}
                aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {verPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            {errores.password && (
              <p id="error-password" className="error-campo">{errores.password}</p>
            )}
          </div>

          <button type="submit" className="btn" disabled={cargando}>
            {cargando ? 'Ingresando…' : 'Iniciar sesión'}
          </button>
        </form>
      </section>
    </main>
  );
}
