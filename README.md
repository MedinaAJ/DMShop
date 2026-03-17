# DMShop

E-commerce open source construido con **Node.js** y **Angular**, inspirado en la arquitectura de PrestaShop. Diseñado para ser comprensible y extensible, tanto por desarrolladores como por herramientas de IA.

## Tecnologías

| Capa              | Stack                                                            |
| ----------------- | ---------------------------------------------------------------- |
| **Frontend**      | Angular 19 + SSR, Angular Material, TailwindCSS v4, TypeScript   |
| **Admin**         | Angular 19, Angular Material, TailwindCSS v4, TypeScript         |
| **Backend**       | Node.js, Express 4, Sequelize (sequelize-typescript), TypeScript |
| **Base de datos** | MySQL 5.7+ / MariaDB 10.5+                                       |
| **Validación**    | Zod (schemas compartidos en `shared/`)                           |
| **Auth**          | JWT (access token + refresh token con rotación)                  |

## Estructura del proyecto

```
DMShop/
├── .ai/              # Documentación de arquitectura para IA
├── shared/           # Paquete compartido (tipos, DTOs, schemas, constantes)
├── backend/          # API REST (Express + Sequelize)
│   └── src/
│       ├── config/       # Base de datos, env, logger
│       ├── middleware/   # Auth, validación, errores
│       ├── models/       # Modelos Sequelize (13 tablas)
│       ├── modules/      # Módulos por dominio (auth, product, category, cart, user)
│       └── cli/          # Scripts (seed)
├── frontend/         # Tienda pública (Angular 19 + SSR)
│   └── src/app/
│       ├── core/         # Servicios, interceptors, guards
│       ├── features/     # Páginas (home, catalog, cart, account...)
│       ├── layout/       # Header, footer, main layout
│       └── shared/       # Componentes reutilizables
├── admin/            # Panel de administración (Angular 19)
│   └── src/app/
│       ├── core/         # Servicios, interceptor, guard
│       ├── features/     # Dashboard, productos, categorías, pedidos, clientes
│       └── layout/       # Sidenav layout
├── .env.example      # Variables de entorno (plantilla)
└── package.json      # Workspaces (shared, backend)
```

## Requisitos previos

- **Node.js** >= 20.0.0
- **npm** >= 10.0.0
- **MySQL 5.7+** o **MariaDB 10.5+** (Laragon, XAMPP, Docker, o instalación directa)

## Instalación

### 1. Clonar y configurar variables de entorno

```bash
git clone https://github.com/DesarrollosMedina/DMShop.git
cd DMShop
cp .env.example .env
```

Edita `.env` con tus credenciales de base de datos y secretos JWT.

### 2. Crear la base de datos

```sql
CREATE DATABASE dmshop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Instalar dependencias

```bash
# Raíz (instala backend + shared)
npm install

# Frontend
cd frontend && npm install && cd ..

# Admin
cd admin && npm install && cd ..
```

### 4. Compilar el paquete compartido

```bash
npm run shared:build
```

### 5. Poblar la base de datos (seed)

```bash
npm run backend:dev
# Espera a ver "DMShop API running on http://localhost:3000"
# Luego, en otra terminal:
npx tsx --tsconfig backend/tsconfig.json backend/src/cli/seed.ts
```

Esto crea:

- Idiomas: Español (por defecto), English
- Monedas: EUR (por defecto), USD
- Categorías: Raíz, Inicio
- Configuración inicial de la tienda
- **Usuario admin**: `admin@dmshop.com` / `Admin123!`

## Arrancar en desarrollo

Necesitas **3 terminales**:

### Terminal 1 — Backend (API)

```bash
npm run backend:dev
```

Servidor en: http://localhost:3000  
Swagger docs: http://localhost:3000/api-docs

### Terminal 2 — Frontend (Tienda)

```bash
cd frontend
npm start
```

Tienda en: http://localhost:4200

### Terminal 3 — Admin (Panel)

```bash
cd admin
ng serve --port 4300
```

Panel en: http://localhost:4300

## Scripts disponibles

| Comando                 | Descripción                                  |
| ----------------------- | -------------------------------------------- |
| `npm run shared:build`  | Compila el paquete `shared/`                 |
| `npm run backend:dev`   | Inicia el backend en modo desarrollo (watch) |
| `npm run backend:build` | Compila el backend para producción           |
| `npm run backend:start` | Inicia el backend compilado                  |
| `npm run lint`          | Ejecuta ESLint                               |
| `npm run format`        | Formatea código con Prettier                 |

## Despliegue (Producción)

El proyecto está preparado para despliegue con **PM2** en cluster mode:

```bash
npm run shared:build
npm run backend:build
pm2 start ecosystem.config.js
```

Target: Ubuntu 22 con Plesk.

## Documentación de arquitectura

Consulta la carpeta `.ai/` para documentación detallada:

- **ARCHITECTURE.md** — Visión general de la arquitectura
- **CONVENTIONS.md** — Convenciones de código
- **DECISIONS.md** — Decisiones técnicas y justificaciones
- **DB_SCHEMA.md** — Esquema de base de datos
- **API_PATTERNS.md** — Patrones de la API REST
- **GLOSSARY.md** — Glosario de términos

## Licencia

MIT
