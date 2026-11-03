# MSV Front-End

Front-end del Sistema de Ventas de Comercial Andina S.A.S., hecho con **React + Vite**.

## Requisitos
- Node.js 20 o superior
- El back-end del proyecto en ejecución (por defecto en `http://localhost:8080`)

## Instalación y ejecución
```bash
npm install
copy .env.example .env     # en macOS/Linux: cp .env.example .env
npm run dev
```
Luego abre http://localhost:5173.

| Script | Uso |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compila para producción en `dist/` |
| `npm run preview` | Sirve la versión compilada |

## Configuración
| Variable | Descripción | Valor por defecto |
|---|---|---|
| `VITE_API_URL` | URL base del API | `http://localhost:8080` |

Los endpoints, formatos y permisos que consume el front están en [docs/CONTRATO_API.md](docs/CONTRATO_API.md).

## Módulos
| Módulo | Historias | Rutas |
|---|---|---|
| Inicio de sesión | HU17 | `/login` |
| Inicio (panel por rol) | HU18, HU19, HU21 | `/inicio` |
| Clientes | HU01–HU04 | `/clientes`, `/clientes/nuevo`, `/clientes/:id`, `/clientes/:id/editar` |
| Productos | HU05–HU09 | `/productos`, `/productos/nuevo`, `/productos/:id`, `/productos/:id/editar` |
| Pedidos | HU10–HU16 | `/pedidos`, `/pedidos/nuevo`, `/pedidos/:id`, `/pedidos/:id/editar` |
| Reportes | HU19–HU21 | `/reportes/ventas-dia`, `/reportes/mas-vendidos`, `/reportes/bajo-stock` |

El menú y las rutas se filtran por rol (ADMIN, VENDEDOR, BODEGA, GERENTE) según `src/config/roles.js`.

## Estructura
```
src/
├── main.jsx               # punto de entrada (router + sesión)
├── App.jsx                # rutas y permisos por rol
├── index.css              # estilos globales
├── config/roles.js        # roles, permisos y menú
├── context/AuthContext.jsx
├── hooks/                 # useCarga, useDebounce
├── components/            # Layout, ProtectedRoute, componentes de UI
├── services/              # api.js (cliente HTTP) y un servicio por módulo
├── utils/                 # validaciones, formato, cálculos (IVA), CSV
└── pages/
    ├── LoginPage.jsx, InicioPage.jsx, AccesoDenegadoPage.jsx, NoEncontradaPage.jsx
    ├── clientes/
    ├── productos/
    ├── pedidos/
    └── reportes/
```

## Convenciones Git
- Ramas: `feature/EL-<n>-descripcion`, a partir de `develop`.
- Commits y PR con la clave de Jira (por ejemplo `EL-77 ...`) para que se enlacen a la tarea.
