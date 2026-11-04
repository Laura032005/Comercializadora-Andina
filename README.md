# MSV Front-End · Comercial Andina

React + Vite. Se conecta al back-end Spring Boot (`electivaLamilla`) para registro, inicio de sesión
con correo/contraseña e inicio de sesión con Google.

## Ejecutar todo en local

1. **Back-end** (carpeta `electivaLamilla`): PostgreSQL local encendido y `.env` completo, luego
   `.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev"` → http://localhost:8081
2. **Front-end** (esta carpeta):
   ```bash
   npm install
   copy .env.example .env     # Windows (en Linux/macOS: cp)
   npm run dev                # http://localhost:5173 (puerto fijo)
   ```
3. En el `.env` del back, `FRONTEND_URL=http://localhost:5173`.
4. En Google Cloud Console, URI de redirección autorizada: `http://localhost:8081/login/oauth2/code/google`.

## Qué se puede hacer en el navegador

- `/registro`: crear cuenta (CUSTOMER). Entra directo a `/menu`.
- `/login`: correo + contraseña, o **Continuar con Google**.
- `/menu`: datos del usuario, opciones según rol y aviso si el perfil está incompleto (cuentas nuevas de Google).
- Cerrar sesión revoca los tokens en el back. La sesión se renueva sola con el refresh token.
- Usuario de prueba del back (perfil `dev`): `worker@dev.local` / `Worker#2026` (rol WORKER).

## Estructura de `src/`

```
utils/constantes.js        URLs, endpoints, rutas, roles, reglas y mensajes
utils/validaciones.js      validadores de los formularios
services/apiClient.js      fetch + errores del back (ProblemDetail) -> ApiError
services/authService.js    login, registro, Google, refresco, logout, sesión en localStorage
hooks/useSesion.js         estado de sesión + renovación automática de tokens
hooks/useFormulario.js     estado/validación de formularios
context/AuthContext.jsx    expone useAuth()
components/                CampoTexto, BotonGoogle, ProtectedRoute
pages/                     LoginPage, RegistroPage, OAuthCallbackPage, MenuPage
```

## Flujo de Google

`/login` → botón → el navegador va a `http://localhost:8081/oauth2/authorization/google` → Google →
back → `http://localhost:5173/oauth2/callback?codigo=...` → el front canjea el código por tokens → `/menu`.
Si algo falla vuelve a `/login` con el mensaje de error.
