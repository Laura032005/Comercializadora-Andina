# MSV Front-End · Comercial Andina

React + Vite. Sistema de ventas de Comercial Andina S.A.S. (ferretería y construcción): integra ventas,
inventario en dos bodegas, despachos, facturación y reportes en una sola plataforma.

- **Autenticación** (registro, correo/contraseña, Google, renovación de tokens): conectada al back-end
  Spring Boot (`electivaLamilla`).
- **Módulos** (ventas, inventario, despachos, facturación, reportes…): funcionan con datos simulados
  (`VITE_USE_MOCK=true`) mientras el back-end expone sus endpoints.

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

## Modo de prueba (sin back-end)

En `.env` pon `VITE_USE_MOCK=true`. El login, el registro y todos los módulos usan datos simulados
guardados en el `localStorage` del navegador (para reiniciarlos, borra las claves `msv_db_*` en
*DevTools → Application → Local Storage*). Usuarios de prueba:

| Correo | Contraseña | Rol |
|---|---|---|
| admin@andina.test | Admin#2026 | ADMIN |
| vendedor@andina.test | Vendedor#2026 | VENDEDOR (mostrador) |
| mayoristas@andina.test | Mayorista#2026 | VENDEDOR (pedidos mayoristas) |
| bodega@andina.test | Bodega#2026 | BODEGA |
| gerente@andina.test | Gerente#2026 | GERENTE |
| contador@andina.test | Contador#2026 | CONTADOR (área contable) |

Con `VITE_USE_MOCK=false` (o sin la variable) todo va contra el back-end real.

## Módulos y quién los ve

| Módulo | Ruta | Roles | Qué resuelve del caso |
|---|---|---|---|
| Nueva venta | `/ventas/nueva` | ADMIN, VENDEDOR | Reemplaza el cuaderno: valida stock por bodega, descuenta inventario y genera la factura en un paso. Canal mostrador o pedido (WhatsApp / teléfono). |
| Ventas y pedidos | `/ventas`, `/ventas/:id` | ADMIN, VENDEDOR, GERENTE | El vendedor ve el estado del pedido sin llamar a bodega. ADMIN anula con motivo (devuelve el stock). |
| Clientes | `/clientes`, `/clientes/:id` | ADMIN, VENDEDOR, GERENTE | Clientes finales y mayoristas con historial de compras y mejores clientes. |
| Despachos | `/despachos` | ADMIN, BODEGA | Pedido pendiente → preparado → despachado → entregado. |
| Inventario | `/inventario` | ADMIN, BODEGA, GERENTE | Existencias por bodega en tiempo real, alertas de stock bajo, movimientos, CSV. |
| Entradas y traslados | `/entradas` | ADMIN, BODEGA | Ingreso de mercancía de proveedores y traslados entre bodegas. |
| Productos | `/productos` | ADMIN | Catálogo, precios y stock mínimo. |
| Facturación | `/facturacion`, `/ventas/:id/factura` | ADMIN, CONTADOR | Facturas del mes con IVA, factura imprimible y CSV para contabilidad. |
| Tablero gerencial | `/indicadores` | ADMIN, GERENTE | Ventas de hoy y del mes, meta, productos que más rotan, alertas de inventario. |
| Reportes | `/reportes` | ADMIN, GERENTE, CONTADOR | Ventas por periodo, vendedor, canal, tipo de cliente, producto y cliente. |
| Usuarios | `/usuarios` | ADMIN | Usuarios internos y su rol. |

Los permisos están en `src/config/modulos.js`. Los roles CUSTOMER y WORKER del back-end todavía no
tienen módulos: el back debe agregar ADMIN, VENDEDOR, BODEGA, GERENTE y CONTADOR.

## Back-end de los módulos

Todo lo que el back debe exponer (endpoints, JSON, roles, permisos y reglas de negocio) está en
**[docs/CONTRATO-API.md](docs/CONTRATO-API.md)**. Para probar contra el back real: `VITE_USE_MOCK=false`.

## Estructura de `src/`

```
utils/constantes.js        URLs, endpoints, rutas, roles del back, reglas y mensajes
utils/validaciones.js      validadores de login y registro
utils/validacionesModulos.js validadores de los formularios de los módulos
utils/formato.js, estadisticas.js  pesos, fechas, CSV y cálculos de reportes
services/apiClient.js      fetch de autenticación + errores del back (ProblemDetail) -> ApiError
services/authService.js    login, registro, Google, refresco, logout (authMock.js en modo prueba)
services/http.js           fetch de los módulos con token y renovación automática
services/*Service.js       ventas, productos, clientes, inventario, usuarios (versión mock y API)
services/mockDb.js, semillas.js  datos simulados en localStorage
config/modulos.js          módulos y roles que los ven
hooks/                     useSesion, useFormulario (login/registro), useFormularioCrud, useDatos
context/AuthContext.jsx    expone useAuth()
components/                Layout (menú lateral), ProtectedRoute (por rol), UI, Insignias, CampoTexto, BotonGoogle
pages/                     Login, Registro, OAuthCallback, Menu y una carpeta por módulo
```

## Flujo de Google

`/login` → botón → el navegador va a `http://localhost:8081/oauth2/authorization/google` → Google →
back → `http://localhost:5173/oauth2/callback?codigo=...` → el front canjea el código por tokens → `/menu`.
Si algo falla vuelve a `/login` con el mensaje de error.
