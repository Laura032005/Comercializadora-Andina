# MSV Front-End · Sistema de Ventas Comercial Andina S.A.S.

Front-end del Sistema de Ventas de Comercial Andina S.A.S. (ferretería y construcción). Hecho con **React + Vite**.
Integra ventas, inventario (dos bodegas), despachos, facturación y reportes en una sola plataforma.
Mientras el back-end no esté listo, todo funciona en **modo mock**: los datos de prueba se guardan en
`localStorage` del navegador (para volver a los datos iniciales, borra las claves `msv_db_*` en
*DevTools → Application → Local Storage*).

## Guía paso a paso

### 1. Instalar lo necesario (una sola vez)
- **Node.js 20 o superior** (versión LTS): https://nodejs.org. Comprueba en una terminal: `node -v` y `npm -v`.
- **Git**: https://git-scm.com. Comprueba: `git --version`.
- **VS Code** con las extensiones *ES7+ React snippets* y *Prettier* (opcionales pero ayudan).

### 2. Abrir el proyecto
1. Descomprime `msv-frontend.zip` en una carpeta, por ejemplo `Documentos/electiva/msv-frontend`.
2. En VS Code: *Archivo → Abrir carpeta…* y elige `msv-frontend`.
3. Abre la terminal integrada (*Terminal → Nueva terminal*, o `Ctrl + ñ`).

### 3. Instalar dependencias y ejecutar
```bash
npm install
cp .env.example .env      # en Windows PowerShell: copy .env.example .env
npm run dev
```
Abre http://localhost:5173 en el navegador.

### 4. Probar el login (usuarios de prueba)
| Usuario    | Contraseña   | Rol      |
|------------|--------------|----------|
| admin      | admin123     | ADMIN    |
| vendedor   | vendedor123  | VENDEDOR (mostrador) |
| mayoristas | vendedor123  | VENDEDOR (pedidos mayoristas) |
| bodega     | bodega123    | BODEGA   |
| gerente    | gerente123   | GERENTE  |
| contador   | contador123  | CONTADOR (área contable) |

Los usuarios creados en el módulo **Usuarios** también pueden iniciar sesión (en modo mock).

Qué debe pasar (criterios de aceptación de HU17):
- Campos vacíos o muy cortos → mensaje debajo de cada campo.
- Credenciales malas → mensaje genérico "Usuario o contraseña incorrectos." (no dice cuál falló).
- Credenciales buenas → entra a `/menu` y muestra nombre, rol y opciones de ese rol.
- La sesión dura 1 hora; "Cerrar sesión" vuelve al login.

### 4.1 Módulos y quién los ve
| Módulo | Ruta | Roles | Qué resuelve del caso |
|---|---|---|---|
| Nueva venta | `/ventas/nueva` | ADMIN, VENDEDOR | Reemplaza el cuaderno: valida stock por bodega, descuenta inventario y genera la factura en un paso. Canal mostrador o pedido (WhatsApp / teléfono). |
| Ventas y pedidos | `/ventas`, `/ventas/:id` | ADMIN, VENDEDOR (las suyas, o todas), GERENTE | El vendedor ve el estado del pedido sin llamar a bodega. ADMIN puede anular con motivo (devuelve el stock). |
| Clientes | `/clientes`, `/clientes/:id` | ADMIN, VENDEDOR, GERENTE (solo lectura) | Clientes finales y mayoristas con historial de compras y "mejores clientes". |
| Despachos | `/despachos` | ADMIN, BODEGA | Pedido pendiente → preparado → despachado → entregado. |
| Inventario | `/inventario` | ADMIN, BODEGA, GERENTE | Existencias por bodega en tiempo real, alertas de stock bajo, movimientos, CSV. |
| Entradas y traslados | `/entradas` | ADMIN, BODEGA | Ingreso de mercancía de proveedores y traslados entre bodegas. |
| Productos | `/productos` | ADMIN | Catálogo, precios y stock mínimo (el stock no se edita a mano). |
| Facturación | `/facturacion`, `/ventas/:id/factura` | ADMIN, CONTADOR | Facturas por mes con IVA, factura imprimible y exportación CSV para contabilidad. |
| Tablero gerencial | `/indicadores` | ADMIN, GERENTE | Ventas de hoy y del mes, meta, productos que más rotan, alertas de inventario (se refresca cada minuto). |
| Reportes | `/reportes` | ADMIN, GERENTE, CONTADOR | Ventas por periodo, vendedor, canal, tipo de cliente, productos y clientes; CSV. |
| Usuarios | `/usuarios` | ADMIN | Crear, editar, activar/desactivar usuarios. |

Los permisos están en `src/config/modulos.js` (menú, tarjetas de inicio y protección de rutas salen de ahí).

### 5. Estructura
```
src/
├── App.jsx                   # rutas (todas protegidas por rol)
├── config/modulos.js         # módulos y roles que los ven
├── components/               # Layout (menú lateral), ProtectedRoute, UI (Modal, Campo, Aviso…), Insignias
├── context/AuthContext.jsx   # sesión
├── hooks/                    # useDatos (cargar datos), useFormulario
├── pages/                    # LoginPage, MenuPage y una carpeta por módulo
├── services/
│   ├── config.js             # VITE_USE_MOCK, VITE_API_URL, IVA
│   ├── http.js               # fetch al back-end con el token
│   ├── catalogos.js          # bodegas, roles, canales, estados
│   ├── mockDb.js, semillas.js# datos de prueba en localStorage
│   └── *Service.js           # cada servicio tiene versión mock y versión API
├── styles/modulos.css
└── utils/                    # validaciones, formato (COP, fechas, CSV), estadísticas
```

### 6. Conectar con el back-end (cuando esté listo)
En `.env` pon `VITE_USE_MOCK=false` y `VITE_API_URL` con la URL del back (por defecto `http://localhost:8080`).
El servicio espera esta respuesta de `POST /api/auth/login` (acordarlo con Juan Esteban/Samuel):
```json
{ "token": "eyJ...", "expiresIn": 3600, "usuario": { "username": "vendedor", "nombre": "…", "rol": "VENDEDOR" } }
```
El back debe permitir CORS desde `http://localhost:5173`. Para las demás peticiones usa `authHeader()` de `authService.js`.

#### Endpoints que espera el front (acordarlos con back-end)
Todas con cabecera `Authorization: Bearer <token>`. Si responden 401 se cierra la sesión.
Los errores pueden traer `{ "mensaje": "..." }` y se muestran tal cual al usuario.

| Método | Ruta | Cuerpo |
|---|---|---|
| GET / POST | `/api/usuarios` | `{ username, password, nombre, rol }` |
| PUT | `/api/usuarios/{id}` | `{ nombre, rol, password? }` |
| PATCH | `/api/usuarios/{id}/estado` · `/api/productos/{id}/estado` | `{ activo }` |
| GET / POST | `/api/productos` · PUT `/api/productos/{id}` | `{ codigo, nombre, categoria, unidad, precio, stockMinimo }` (respuesta con `existencias: { "1": n, "2": n }`) |
| GET / POST | `/api/clientes` · GET/PUT `/api/clientes/{id}` | `{ tipo: FINAL\|MAYORISTA, documento, nombre, telefono, email, direccion }` |
| GET | `/api/ventas?vendedor=&clienteId=` · `/api/ventas/{id}` | |
| POST | `/api/ventas` | `{ clienteId, canal, bodegaId, direccionEntrega, observaciones, items: [{ productoId, cantidad }] }` → venta con `factura: { numero, fecha }` |
| POST | `/api/ventas/{id}/anular` | `{ motivo }` |
| POST | `/api/ventas/{id}/despacho/avanzar` | |
| GET | `/api/inventario/movimientos` | |
| POST | `/api/inventario/entradas` | `{ productoId, bodegaId, cantidad, proveedor, referencia }` |
| POST | `/api/inventario/traslados` | `{ productoId, bodegaOrigenId, bodegaId, cantidad, referencia }` |
| GET / PUT | `/api/indicadores/meta` | `{ metaMensual }` |

La forma exacta de cada objeto está en `src/services/semillas.js`.

### 7. Subir a GitHub ligado a Jira (EL-73)
Si el equipo ya tiene repositorio, clónalo y copia estos archivos dentro (en una carpeta `frontend/` si el repo es compartido con el back). Luego:
```bash
git checkout develop              # o main, según use el equipo
git pull
git checkout -b feature/EL-73-login-frontend
git add .
git commit -m "EL-73 Pantalla de login con validaciones y servicio de auth mock"
git push -u origin feature/EL-73-login-frontend
```
Después, en GitHub abre un **Pull Request** hacia `develop` con el título `EL-73 Login front-end`.
Poner la clave **EL-73** en la rama, el commit y el PR hace que Jira los muestre dentro de la tarea
(si el equipo instaló la app *GitHub for Jira*; si no, pega el enlace del PR en un comentario de la tarea).

Si todavía no hay repositorio: créalo en github.com (*New repository*, sin README), y en la carpeta del proyecto:
```bash
git init
git add .
git commit -m "EL-73 Proyecto base del front-end con login"
git branch -M main
git remote add origin https://github.com/USUARIO/msv-frontend.git
git push -u origin main
```
y luego crea la rama `feature/EL-73-login-frontend` como arriba para seguir trabajando.

### 8. En Jira
- Mueve **EL-73 "HU17 - Diseñar pantalla/formulario"** a *En curso* y asígnatela.
- Al terminar, enlaza el PR y una captura del login funcionando.
