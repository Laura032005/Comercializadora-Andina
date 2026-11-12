import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useFormulario from '../hooks/useFormulario';
import CampoTexto from '../components/CampoTexto';
import BotonGoogle from '../components/BotonGoogle';
import { validadoresRegistro } from '../utils/validaciones';
import { MENSAJES, RUTAS } from '../utils/constantes';
import './LoginPage.css';

const INICIAL = {
  nombreCompleto: '',
  telefono: '',
  direccion: '',
  fechaNacimiento: '',
  correo: '',
  contrasena: '',
  confirmacion: '',
};

export default function RegistroPage() {
  const { registrar, loginConGoogle } = useAuth();
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(false);
  const form = useFormulario(INICIAL, validadoresRegistro);
  const { valores, errores } = form;

  const props = (id) => ({
    id,
    value: valores[id],
    onChange: form.handleChange,
    onBlur: form.handleBlur,
    error: errores[id],
    disabled: cargando,
  });

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.validarTodo()) return;

    setCargando(true);
    form.setErrorGeneral('');
    try {
      await registrar(valores);
      navigate(RUTAS.MENU, { replace: true });
    } catch (err) {
      form.setErrorGeneral(
        err.codigo === 'correo_existente' ? MENSAJES.CORREO_EXISTENTE : err.message,
      );
      form.aplicarErroresServidor(err.errores);
      setCargando(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card login-card-ancha">
        <div className="login-marca">
          <div className="login-logo" aria-hidden="true">CA</div>
          <h1>Crear cuenta</h1>
          <p>Comercial Andina S.A.S.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {form.errorGeneral && (
            <div className="alerta-error" role="alert">{form.errorGeneral}</div>
          )}

          <CampoTexto {...props('nombreCompleto')} etiqueta="Nombre completo" autoComplete="name" autoFocus maxLength={150} />
          <CampoTexto {...props('correo')} etiqueta="Correo" type="email" autoComplete="email" maxLength={254} />
          <CampoTexto {...props('telefono')} etiqueta="Teléfono (opcional)" type="tel" autoComplete="tel" placeholder="+573001234567" />
          <CampoTexto {...props('direccion')} etiqueta="Dirección" autoComplete="street-address" maxLength={255} />
          <CampoTexto {...props('fechaNacimiento')} etiqueta="Fecha de nacimiento" type="date" autoComplete="bday" />
          <CampoTexto {...props('contrasena')} etiqueta="Contraseña" esPassword autoComplete="new-password" />
          <p className="ayuda-campo">Mínimo 8 caracteres, con una mayúscula, un número y un símbolo.</p>
          <CampoTexto {...props('confirmacion')} etiqueta="Confirmar contraseña" esPassword autoComplete="new-password" />

          <button type="submit" className="btn" disabled={cargando}>
            {cargando ? 'Creando cuenta…' : 'Registrarme'}
          </button>
        </form>

        <div className="separador"><span>o</span></div>

        <BotonGoogle onClick={() => { setCargando(true); loginConGoogle(); }} disabled={cargando} texto="Registrarme con Google" />

        <p className="login-nota">
          ¿Ya tienes cuenta? <Link to={RUTAS.LOGIN}>Inicia sesión</Link>
        </p>
      </section>
    </main>
  );
}
