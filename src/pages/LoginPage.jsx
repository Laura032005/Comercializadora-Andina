import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useFormulario from '../hooks/useFormulario';
import CampoTexto from '../components/CampoTexto';
import BotonGoogle from '../components/BotonGoogle';
import { validadoresLogin } from '../utils/validaciones';
import { MENSAJES, RUTAS } from '../utils/constantes';
import './LoginPage.css';

export default function LoginPage() {
  const { login, loginConGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [cargando, setCargando] = useState(false);

  const form = useFormulario({ correo: '', contrasena: '' }, validadoresLogin);
  // Si volvimos de Google con un error, el callback nos manda el mensaje en el state.
  const errorGeneral = form.errorGeneral || location.state?.errorOAuth || '';

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.validarTodo()) return;

    setCargando(true);
    form.setErrorGeneral('');
    try {
      await login(form.valores.correo, form.valores.contrasena);
      navigate(location.state?.from?.pathname || RUTAS.MENU, { replace: true });
    } catch (err) {
      form.setErrorGeneral(err.message || MENSAJES.CREDENCIALES);
      form.aplicarErroresServidor(err.errores);
      form.limpiarCampo('contrasena');
      setCargando(false);
    }
  }

  function handleGoogle() {
    setCargando(true);
    loginConGoogle();
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
            <div className="alerta-error" role="alert">{errorGeneral}</div>
          )}

          <CampoTexto
            id="correo"
            etiqueta="Correo"
            type="email"
            autoComplete="email"
            autoFocus
            value={form.valores.correo}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            error={form.errores.correo}
            disabled={cargando}
            maxLength={254}
          />

          <CampoTexto
            id="contrasena"
            etiqueta="Contraseña"
            esPassword
            autoComplete="current-password"
            value={form.valores.contrasena}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            error={form.errores.contrasena}
            disabled={cargando}
          />

          <button type="submit" className="btn" disabled={cargando}>
            {cargando ? 'Ingresando…' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="separador"><span>o</span></div>

        <BotonGoogle onClick={handleGoogle} disabled={cargando} />

        <p className="login-nota">
          ¿No tienes cuenta? <Link to={RUTAS.REGISTRO}>Regístrate</Link>
        </p>
      </section>
    </main>
  );
}
