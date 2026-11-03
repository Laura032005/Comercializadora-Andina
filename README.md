# MSV Front-End · Login (HU17 / EL-73)

Front-end del Sistema de Ventas de Comercial Andina S.A.S. Hecho con **React + Vite**.
Este primer módulo trae la pantalla de login con validaciones y un servicio de autenticación
que funciona con usuarios de prueba (mock) hasta que el back-end tenga `POST /api/auth/login`.

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
| Usuario  | Contraseña   | Rol      |
|----------|--------------|----------|
| admin    | admin123     | ADMIN    |
| vendedor | vendedor123  | VENDEDOR |
| bodega   | bodega123    | BODEGA   |
| gerente  | gerente123   | GERENTE  |

Qué debe pasar (criterios de aceptación de HU17):
- Campos vacíos o muy cortos → mensaje debajo de cada campo.
- Credenciales malas → mensaje genérico "Usuario o contraseña incorrectos." (no dice cuál falló).
- Credenciales buenas → entra a `/menu` y muestra nombre, rol y opciones de ese rol.
- La sesión dura 1 hora; "Cerrar sesión" vuelve al login.

### 5. Estructura
```
src/
├── main.jsx                  # punto de entrada (router + proveedor de sesión)
├── App.jsx                   # rutas: /login y /menu (protegida)
├── index.css                 # estilos globales
├── pages/
│   ├── LoginPage.jsx         # pantalla de login
│   ├── LoginPage.css
│   └── MenuPage.jsx          # pantalla temporal después de entrar
├── components/
│   └── ProtectedRoute.jsx    # si no hay sesión, manda al login
├── context/
│   └── AuthContext.jsx       # guarda la sesión y expone login/logout
├── services/
│   └── authService.js        # mock o API real (según .env)
└── utils/
    └── validaciones.js       # reglas del formulario
```

### 6. Conectar con el back-end (cuando esté listo)
En `.env` pon `VITE_USE_MOCK=false` y `VITE_API_URL` con la URL del back (por defecto `http://localhost:8080`).
El servicio espera esta respuesta de `POST /api/auth/login` (acordarlo con Juan Esteban/Samuel):
```json
{ "token": "eyJ...", "expiresIn": 3600, "usuario": { "username": "vendedor", "nombre": "…", "rol": "VENDEDOR" } }
```
El back debe permitir CORS desde `http://localhost:5173`. Para las demás peticiones usa `authHeader()` de `authService.js`.

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
