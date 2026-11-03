# Contrato del API que consume el front-end

Estos son los endpoints que llama el front, con lo que envía y lo que espera recibir. Si el back usa otra ruta o
nombres de campo distintos, se ajusta en un solo lugar: `src/services/*Service.js`.

## Convenciones generales

- **URL base:** `VITE_API_URL` (por defecto `http://localhost:8080`).
- **Autenticación:** todas las rutas, excepto el login, reciben `Authorization: Bearer <token>`.
- **CORS:** el back debe permitir el origen `http://localhost:5173`.
- **Fechas:** ISO 8601 (`2026-11-03T14:30:00`). Los filtros de fecha se envían como `YYYY-MM-DD`.
- **Paginación:** se envían `page` (desde 0) y `size`. El front acepta el formato `Page` de Spring
  (`content`, `number`, `totalPages`, `totalElements`, `size`) o una lista simple.
- **Errores:** el cuerpo debe tener la forma `{ "message": "texto para el usuario", "errors": { "campo": "mensaje" } }`.
  `errors` es opcional; si viene, cada mensaje se muestra debajo de su campo en el formulario.

| Código | Qué hace el front |
|---|---|
| 400 | Muestra `message` y los errores por campo |
| 401 | Cierra la sesión y vuelve al login |
| 403 | Muestra "No tienes permiso para realizar esta acción." |
| 404 | Muestra "no existe" |
| 409 | Duplicado (identificación o código) o stock insuficiente al confirmar |

## Autenticación (HU17)

### `POST /api/auth/login`
Petición:
```json
{ "username": "vendedor", "password": "••••••" }
```
Respuesta 200:
```json
{ "token": "eyJ...", "expiresIn": 3600, "usuario": { "username": "vendedor", "nombre": "Nombre Apellido", "rol": "VENDEDOR" } }
```
- `rol` debe ser uno de `ADMIN`, `VENDEDOR`, `BODEGA` o `GERENTE`. También se acepta con el prefijo `ROLE_`.
- Si las credenciales son inválidas, responder 401 (el front muestra un mensaje genérico).

## Clientes (HU01–HU04)

Objeto cliente:
```json
{ "id": 1, "identificacion": "900123456", "nombre": "Distribuidora El Sol", "tipo": "MAYORISTA",
  "telefono": "3101234567", "correo": "ventas@elsol.com", "direccion": "Cra 5 # 10-20" }
```
`tipo` puede ser `DETAL` o `MAYORISTA`.

| Método y ruta | Uso | Notas |
|---|---|---|
| `GET /api/clientes?identificacion=&nombre=&page=&size=` | Listar y buscar | `identificacion`: coincidencia exacta. `nombre`: coincidencia parcial, sin distinguir mayúsculas |
| `GET /api/clientes/{id}` | Detalle | 404 si no existe |
| `POST /api/clientes` | Registrar | 409 si la identificación ya existe. Devuelve el cliente creado con su `id` |
| `PUT /api/clientes/{id}` | Actualizar | Solo envía `telefono`, `correo`, `direccion` y `tipo` |
| `GET /api/clientes/{id}/pedidos?desde=&hasta=` | Historial | Lista de pedidos (resumen: `id`, `numero`, `fecha`, `total`, `estado`) |

## Productos (HU05–HU09, HU21)

Objeto producto:
```json
{ "id": 1, "codigo": "ARR-001", "nombre": "Arroz 500 g", "categoria": "Granos",
  "precio": 2500, "stock": 100, "stockMinimo": 20, "activo": true }
```

| Método y ruta | Uso | Notas |
|---|---|---|
| `GET /api/productos?busqueda=&categoria=&activo=&page=&size=20` | Listar | `busqueda` filtra por nombre o código. `activo=true` para vender |
| `GET /api/productos/{id}` | Detalle y stock | |
| `GET /api/productos/categorias` | Lista de categorías | `["Granos", "Aceites"]` o `[{ "nombre": "Granos" }]` |
| `POST /api/productos` | Registrar | 409 si el código ya existe |
| `PUT /api/productos/{id}` | Actualizar | Solo envía `nombre`, `categoria`, `precio` y `stockMinimo` |
| `PATCH /api/productos/{id}/estado` | Activar o desactivar | Cuerpo: `{ "activo": false }` |
| `GET /api/productos/bajo-stock` | Alerta de bajo stock | Productos activos con `stock <= stockMinimo` |

## Pedidos (HU10–HU16)

Objeto pedido:
```json
{
  "id": 1, "numero": "PED-00001", "fecha": "2026-11-03T12:14:00", "estado": "CONFIRMADO",
  "cliente": { "id": 1, "identificacion": "900123456", "nombre": "Distribuidora El Sol" },
  "vendedor": { "nombre": "Nombre Apellido" },
  "items": [
    { "productoId": 2, "codigo": "ACE-001", "nombre": "Aceite 1 L", "cantidad": 3, "precioUnitario": 12000, "subtotal": 36000 }
  ],
  "subtotal": 36000, "iva": 6840, "total": 42840,
  "fechaConfirmacion": "2026-11-03T12:14:00", "fechaDespacho": null
}
```
`estado` puede ser `BORRADOR`, `CONFIRMADO`, `DESPACHADO` o `ENTREGADO`.

| Método y ruta | Uso | Notas |
|---|---|---|
| `GET /api/pedidos?numero=&cliente=&estado=&page=&size=` | Listar y buscar | `cliente` filtra por nombre o identificación |
| `GET /api/pedidos/{id}` | Detalle | |
| `POST /api/pedidos` | Crear borrador | Cuerpo: `{ "clienteId": 1, "items": [{ "productoId": 2, "cantidad": 3 }] }` |
| `PUT /api/pedidos/{id}` | Editar borrador | Mismo cuerpo que el POST. Solo para pedidos en `BORRADOR` |
| `POST /api/pedidos/{id}/confirmar` | Confirmar | Valida stock, registra fecha y vendedor, y descuenta inventario en una transacción |
| `PATCH /api/pedidos/{id}/estado` | Despachar o entregar | Cuerpo: `{ "estado": "DESPACHADO" }` |

**Stock insuficiente al confirmar (HU12).** Responder 409 con la lista de faltantes. El front la muestra producto por producto:
```json
{ "message": "Stock insuficiente",
  "faltantes": [ { "productoId": 2, "nombre": "Aceite 1 L", "solicitado": 8, "disponible": 5 } ] }
```

**Totales (HU13).** El front calcula `subtotal`, IVA (19 %) y `total` mientras se arma el pedido. En el detalle
muestra los valores que envíe el back, y si no vienen, los calcula.

## Reportes (HU19, HU20)

| Método y ruta | Respuesta |
|---|---|
| `GET /api/reportes/ventas-dia?fecha=YYYY-MM-DD` | `{ "fecha": "2026-11-03", "totalVendido": 42840, "numeroPedidos": 1 }` (solo pedidos confirmados o posteriores) |
| `GET /api/reportes/mas-vendidos?desde=&hasta=&limite=10` | `[{ "productoId": 2, "codigo": "ACE-001", "nombre": "Aceite 1 L", "cantidadVendida": 3, "totalVendido": 36000 }]`, ordenado por cantidad de mayor a menor |

## Permisos por rol (HU18)

El front oculta las opciones y bloquea las rutas según el rol. El back también debe validarlo y responder 403.

| Módulo | ADMIN | VENDEDOR | BODEGA | GERENTE |
|---|---|---|---|---|
| Clientes: consultar | ✔ | ✔ | | ✔ |
| Clientes: registrar y editar | ✔ | ✔ | | |
| Productos: consultar | ✔ | ✔ | ✔ | ✔ |
| Productos: registrar, editar, activar y desactivar | ✔ | | | |
| Pedidos: consultar | ✔ | ✔ | ✔ | ✔ |
| Pedidos: crear y confirmar | ✔ | ✔ | | |
| Pedidos: despachar y entregar | ✔ | | ✔ | |
| Ventas del día y más vendidos | ✔ | | | ✔ |
| Bajo stock | ✔ | | ✔ | ✔ |
