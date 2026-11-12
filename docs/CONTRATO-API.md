# Contrato de API: front-end ↔ back-end (módulos)

Lo que el front-end ya envía y espera de **Spring Boot** para los módulos del sistema de ventas.
El login, el registro, Google y el refresco de tokens **ya funcionan** y no cambian.

Cómo comprobar el avance: en el `.env` del front pon `VITE_USE_MOCK=false`, levanta el back en el puerto 8081 y
usa la pantalla correspondiente. Con `VITE_USE_MOCK=true` puedes ver cómo debe comportarse cada pantalla
con datos simulados.

## 1. Reglas generales

| Tema | Regla |
|---|---|
| Prefijo | Todas las rutas van bajo `/api/v1` (ej. `GET /api/v1/productos`). |
| Autenticación | `Authorization: Bearer <accessToken>`. Si responde **401**, el front llama a `/api/v1/auth/refrescar_token` y reintenta una vez; si vuelve a fallar, cierra la sesión. |
| Permisos | Si el rol no puede usar el endpoint, responde **403**. La tabla de roles está en la sección 3. |
| Errores | ProblemDetail (RFC 9457), igual que en auth. El front muestra el campo **`detail`** tal cual, así que debe ir en español y ser claro para el usuario. Ej.: `{ "status": 409, "detail": "Ya existe un producto con el código FE-001." }` |
| Listados | Devuelven **un arreglo JSON simple**, sin paginar. El front filtra, ordena y calcula los reportes. |
| Fechas | ISO 8601 con zona horaria (`2026-11-11T15:30:00-05:00` o en UTC con `Z`). |
| Dinero | Pesos colombianos (COP), enteros, sin decimales. Los precios del catálogo van **sin IVA**. |
| IVA | 19 % sobre el subtotal de la venta: `iva = round(subtotal × 0,19)`, `total = subtotal + iva`. |
| Bodegas | Dos, con ids fijos: **1 = Bodega Principal**, **2 = Bodega Secundaria** (el front las tiene fijas). |
| Usuario en sesión | En ventas y movimientos se guarda el **correo** del usuario autenticado (sale del token, no del cuerpo). |
| CORS | Permitir `http://localhost:5173`. |

## 2. Roles

El back hoy tiene `CUSTOMER` y `WORKER`. Hay que **agregar** estos roles internos (el front ya los usa):

| Rol | Quién es |
|---|---|
| `ADMIN` | Administrador: todo. |
| `VENDEDOR` | Vendedor de mostrador o de mayoristas. |
| `BODEGA` | Encargado de bodega: inventario, entradas y despachos. |
| `GERENTE` | Gerente general: consulta, tablero y reportes. |
| `CONTADOR` | Área contable: facturación y reportes. |

El registro público (`registrar_customer`) sigue creando `CUSTOMER`. Los usuarios internos los crea el ADMIN
con `POST /usuarios`. El `usuario` de la respuesta de login debe traer `rol` con uno de estos valores.

Para la presentación, crea en el perfil `dev` un usuario por rol (los del modo de prueba sirven de guía:
`admin@andina.test`, `vendedor@andina.test`, `bodega@andina.test`, `gerente@andina.test`, `contador@andina.test`).

## 3. Endpoints y permisos

| Método y ruta | Roles | Uso en el front |
|---|---|---|
| `GET /usuarios` | ADMIN | Módulo Usuarios |
| `POST /usuarios` | ADMIN | Crear usuario interno |
| `PUT /usuarios/{id}` | ADMIN | Editar nombre, rol y (opcional) contraseña |
| `PATCH /usuarios/{id}/estado` | ADMIN | Activar / desactivar |
| `GET /productos` | todos los internos | Catálogo, nueva venta, inventario, entradas |
| `POST /productos` · `PUT /productos/{id}` · `PATCH /productos/{id}/estado` | ADMIN | Módulo Productos |
| `GET /clientes` · `GET /clientes/{id}` | ADMIN, VENDEDOR, GERENTE | Clientes, historial, nueva venta |
| `POST /clientes` · `PUT /clientes/{id}` | ADMIN, VENDEDOR | Crear / editar cliente |
| `GET /ventas` | todos los internos | Ventas, despachos, facturación, reportes, tablero |
| `GET /ventas/{id}` | todos los internos | Detalle y factura |
| `POST /ventas` | ADMIN, VENDEDOR | Nueva venta |
| `POST /ventas/{id}/anular` | ADMIN | Anular venta |
| `POST /ventas/{id}/despacho/avanzar` | ADMIN, BODEGA | Despachos |
| `GET /inventario/movimientos` | ADMIN, BODEGA, GERENTE | Inventario y entradas |
| `POST /inventario/entradas` | ADMIN, BODEGA | Entrada de mercancía |
| `POST /inventario/traslados` | ADMIN, BODEGA | Traslado entre bodegas |
| `GET /indicadores/meta` | ADMIN, GERENTE | Tablero gerencial |
| `PUT /indicadores/meta` | ADMIN, GERENTE | Cambiar meta del mes |

## 4. Objetos

### Usuario (respuesta; **nunca** incluir la contraseña)
```json
{ "id": 2, "correo": "vendedor@andina.test", "nombre": "Vendedor de mostrador", "rol": "VENDEDOR", "activo": true }
```
- `POST /usuarios` recibe `{ "correo", "nombre", "rol", "password" }`. El correo es único (409 si existe). La contraseña sigue la misma política del registro.
- `PUT /usuarios/{id}` recibe `{ "nombre", "rol" }` y `password` solo si se cambia. El correo no se modifica.
- `PATCH .../estado` recibe `{ "activo": false }`. Un usuario inactivo no puede iniciar sesión.

### Producto
```json
{
  "id": 1, "codigo": "FE-001", "nombre": "Cemento gris 50 kg", "categoria": "Obra negra",
  "unidad": "bulto", "precio": 32000, "stockMinimo": 40,
  "existencias": { "1": 120, "2": 200 }, "activo": true
}
```
- `POST` / `PUT` reciben `{ "codigo", "nombre", "categoria", "unidad", "precio", "stockMinimo" }`. **No reciben existencias**: un producto nuevo arranca en 0 en ambas bodegas.
- `codigo` es único y se guarda en mayúsculas (409 si existe).
- `unidad` ∈ `und, bulto, galón, caja, libra, rollo, metro, kg`.
- `existencias` es un objeto `{ "idBodega": cantidad }` con **las dos bodegas siempre presentes**.

### Cliente
```json
{
  "id": 3, "tipo": "MAYORISTA", "documento": "900000001", "nombre": "Constructora Horizonte S.A.S.",
  "telefono": "3000000001", "email": "compras@horizonte.ejemplo.com", "direccion": "Calle 80 # 20-10, Bogotá"
}
```
- `tipo` ∈ `FINAL`, `MAYORISTA`. `documento` (cédula o NIT) es único (409).
- `direccion` es obligatoria para `MAYORISTA` (se usa en los despachos). `telefono` y `email` son opcionales.

### Venta
Es el objeto central: el mismo alimenta ventas, despachos, factura, facturación, reportes y tablero.
```json
{
  "id": 61, "numero": "V-00061", "fecha": "2026-11-11T15:30:00-05:00", "canal": "WHATSAPP",
  "clienteId": 3, "clienteNombre": "Constructora Horizonte S.A.S.", "clienteDocumento": "900000001",
  "clienteTipo": "MAYORISTA", "direccionEntrega": "Calle 80 # 20-10, Bogotá",
  "vendedor": "mayoristas@andina.test", "vendedorNombre": "Vendedor de mayoristas",
  "bodegaId": 1, "observaciones": "Entregar en portería",
  "items": [
    { "productoId": 1, "codigo": "FE-001", "nombre": "Cemento gris 50 kg", "unidad": "bulto",
      "cantidad": 10, "precioUnitario": 32000, "subtotal": 320000 }
  ],
  "subtotal": 320000, "iva": 60800, "total": 380800,
  "estado": "REGISTRADA", "estadoDespacho": "PENDIENTE",
  "factura": { "numero": "FE-00061", "fecha": "2026-11-11T15:30:00-05:00" },
  "historialDespacho": [ { "estado": "PREPARADO", "fecha": "..." } ],
  "anulacion": null
}
```
- Los datos del cliente, el producto y el precio son **copia al momento de la venta**: si después cambia el precio o el nombre, la venta no cambia.
- `canal` ∈ `MOSTRADOR`, `WHATSAPP`, `TELEFONO`. `estado` ∈ `REGISTRADA`, `ANULADA`.
- `estadoDespacho` ∈ `PENDIENTE`, `PREPARADO`, `DESPACHADO`, `ENTREGADO`.
- `anulacion`, cuando existe: `{ "fecha", "motivo", "usuario" }`.
- `GET /ventas` acepta los filtros opcionales `?vendedor=<correo>` y `?clienteId=<id>`, y devuelve las ventas **más recientes primero, con sus `items`**.

### Movimiento de inventario
```json
{
  "id": 140, "fecha": "...", "tipo": "SALIDA", "productoId": 1, "productoNombre": "Cemento gris 50 kg",
  "bodegaId": 1, "bodegaOrigenId": null, "cantidad": 10,
  "referencia": "Venta V-00061", "proveedor": "", "usuario": "mayoristas@andina.test"
}
```
- `tipo` ∈ `ENTRADA` (+), `SALIDA` (−, por venta), `ANULACION` (+, devolución por anulación), `TRASLADO`.
- En `TRASLADO`, `bodegaOrigenId` es de donde sale y `bodegaId` a donde llega. En los demás, `bodegaOrigenId` es `null`.
- `cantidad` siempre va en positivo; el signo lo da el tipo. Más recientes primero.

## 5. Operaciones con reglas de negocio

Cada una debe ser **una sola transacción**: o se hace todo, o no se hace nada.

### `POST /ventas` (registrar venta y facturar)
Recibe:
```json
{ "clienteId": 3, "canal": "WHATSAPP", "bodegaId": 1, "direccionEntrega": "Calle 80 # 20-10",
  "observaciones": "", "items": [ { "productoId": 1, "cantidad": 10 } ] }
```
1. El cliente existe y hay al menos un ítem. Cada `cantidad` es un entero ≥ 1 y el producto está activo.
2. **Stock por bodega**: para cada ítem, `cantidad ≤ existencias[bodegaId]`. Si no alcanza → **409** con
   `detail: "Stock insuficiente de Cemento gris 50 kg en Bodega Principal (disponible: 4)."`
3. Precio unitario = precio actual del producto. Se calculan subtotal, IVA y total (sección 1).
4. Descontar de `existencias[bodegaId]` y crear un movimiento `SALIDA` por ítem (`referencia: "Venta V-xxxxx"`).
5. `numero` = `V-` + id con 5 dígitos; `factura.numero` = `FE-` + consecutivo con 5 dígitos.
6. `vendedor` / `vendedorNombre` salen del usuario autenticado.
7. `estadoDespacho` = `ENTREGADO` si el canal es `MOSTRADOR`; si no, `PENDIENTE`.
8. Si `direccionEntrega` viene vacía, usar la del cliente.
9. Responder **201** con la venta completa.

### `POST /ventas/{id}/anular`
Recibe `{ "motivo": "Cliente canceló el pedido" }` (mínimo 5 caracteres).
- **409** si ya está anulada, o si es un pedido (canal distinto de `MOSTRADOR`) en estado `DESPACHADO` o `ENTREGADO`.
- Devuelve las unidades a `existencias[bodegaId]` con un movimiento `ANULACION` por ítem.
- Marca `estado = ANULADA`, llena `anulacion` y la factura queda sin efecto (los reportes ignoran las anuladas).
- Responde la venta actualizada.

### `POST /ventas/{id}/despacho/avanzar`
Avanza un paso: `PENDIENTE → PREPARADO → DESPACHADO → ENTREGADO`.
- Agrega `{ estado, fecha }` a `historialDespacho`.
- **409** si la venta está anulada o ya está `ENTREGADO`.
- Responde la venta actualizada.

### `POST /inventario/entradas`
Recibe `{ "productoId": 3, "bodegaId": 2, "cantidad": 10, "proveedor": "Proveedor X", "referencia": "Factura 123" }`.
`cantidad` entera ≥ 1; `proveedor` y `referencia` obligatorios. Suma a la bodega y crea un movimiento `ENTRADA`.
Responde el movimiento.

### `POST /inventario/traslados`
Recibe `{ "productoId": 3, "bodegaOrigenId": 1, "bodegaId": 2, "cantidad": 4, "referencia": "" }`.
Las bodegas deben ser distintas y el origen debe tener stock suficiente (409 si no). Resta en el origen, suma en el
destino y crea un movimiento `TRASLADO`. Responde el movimiento.

### `GET` / `PUT /indicadores/meta`
`{ "metaMensual": 22000000 }`: meta de ventas del mes (con IVA) que se muestra en el tablero. El `PUT` la reemplaza y responde lo mismo.

## 6. Orden sugerido para construir el back

1. Roles nuevos y `usuarios` (sin esto nadie ve los módulos).
2. `productos` (con `existencias` por bodega) y `clientes`.
3. `POST /ventas` + `GET /ventas` (lo más importante para la presentación).
4. `despacho/avanzar` y `anular`.
5. `inventario` (movimientos, entradas, traslados).
6. `indicadores/meta`.

La forma exacta de todos los objetos, con datos de ejemplo reales, está en `src/services/semillas.js`, y la lógica de
referencia de cada operación (lo que hace el modo de prueba) en `src/services/*Service.js`, en el objeto `mock`.
