// Destino del redirect del back tras el login con Google: /oauth2/callback?codigo=... o ?error=...
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ERRORES_OAUTH, MENSAJES, RUTAS } from '../utils/constantes';
import './LoginPage.css';

// El código es de un solo uso: en desarrollo React StrictMode ejecuta el efecto dos veces,
// así que recordamos los códigos ya procesados para no canjearlos dos veces.
const codigosProcesados = new Set();

export default function OAuthCallbackPage() {
  const [params] = useSearchParams();
  const { intercambiarCodigo } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const error = params.get('error');
    const codigo = params.get('codigo');

    const volverAlLogin = (mensaje) =>
      navigate(RUTAS.LOGIN, { replace: true, state: { errorOAuth: mensaje } });

    if (error) {
      volverAlLogin(ERRORES_OAUTH[error] ?? ERRORES_OAUTH.login_fallido);
      return;
    }
    if (!codigo) {
      volverAlLogin(ERRORES_OAUTH.login_fallido);
      return;
    }
    if (codigosProcesados.has(codigo)) return;
    codigosProcesados.add(codigo);

    intercambiarCodigo(codigo)
      .then(() => navigate(RUTAS.MENU, { replace: true }))
      .catch((err) => volverAlLogin(err.status === 400 ? MENSAJES.CODIGO_INVALIDO : err.message));
  }, [params, intercambiarCodigo, navigate]);

  return (
    <main className="login-page">
      <section className="login-card">
        <p className="login-nota">Completando el inicio de sesión con Google…</p>
      </section>
    </main>
  );
}
