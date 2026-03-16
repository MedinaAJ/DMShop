# DMShop — Arquitectura

## Visión General

DMShop es un e-commerce open source con arquitectura de **monorepo** compuesto por:

```
┌─────────────────────────────────────────────────────┐
│                    MONOREPO                          │
│                                                     │
│  ┌─────────┐  ┌──────────┐  ┌───────┐  ┌────────┐ │
│  │ frontend │  │  admin   │  │backend│  │ shared │ │
│  │ (tienda) │  │(backoff.)│  │ (API) │  │(tipos) │ │
│  │ Angular  │  │ Angular  │  │Express│  │  TS    │ │
│  │ SSR+CSR  │  │ CSR only │  │ REST  │  │  puro  │ │
│  └────┬─────┘  └────┬─────┘  └───┬───┘  └───┬────┘ │
│       │              │            │           │      │
│       └──────────────┴─────┬──────┘           │      │
│                            │                  │      │
│                      ┌─────▼─────┐            │      │
│                      │  API REST │◄───────────┘      │
│                      │ /api/v1/* │   (tipos          │
│                      └─────┬─────┘    compartidos)   │
│                            │                         │
│                      ┌─────▼─────┐                   │
│                      │  MariaDB  │                   │
│                      └───────────┘                   │
└─────────────────────────────────────────────────────┘
```

## Capas del Backend

```
Request HTTP
    │
    ▼
┌──────────┐
│  Router  │  Define rutas y aplica middleware de validación
└────┬─────┘
     ▼
┌──────────┐
│Controller│  Recibe req/res, delega al service, formatea respuesta
└────┬─────┘
     ▼
┌──────────┐
│ Service  │  Lógica de negocio, orquesta modelos, emite hooks
└────┬─────┘
     ▼
┌──────────┐
│  Model   │  Sequelize model, acceso a BD, relaciones
└────┬─────┘
     ▼
┌──────────┐
│ MariaDB  │  Base de datos relacional
└──────────┘
```

### Middleware Pipeline

```
Request → CORS → Helmet → RateLimit → BodyParser → I18n → Auth → Validate → Controller
                                                                                  │
Response ← ErrorHandler ◄──────────────────────────────────────────────────────────┘
```

## Capas del Frontend (Tienda)

```
┌───────────────────────────────────────────┐
│              Angular App                   │
│                                           │
│  ┌─────────┐  ┌──────────┐  ┌─────────┐ │
│  │  Layout  │  │ Features │  │  Shared  │ │
│  │(header,  │  │(catalog, │  │(pipes,   │ │
│  │ footer)  │  │ cart,    │  │ comps,   │ │
│  │          │  │ checkout)│  │ directs) │ │
│  └─────────┘  └────┬─────┘  └─────────┘ │
│                     │                     │
│               ┌─────▼─────┐              │
│               │   Store   │              │
│               │(SignalSt.)│              │
│               └─────┬─────┘              │
│                     │                     │
│               ┌─────▼─────┐              │
│               │ Services  │              │
│               │(HTTP API) │              │
│               └─────┬─────┘              │
│                     │                     │
│               ┌─────▼─────┐              │
│               │   Core    │              │
│               │(guards,   │              │
│               │intercept.)│              │
│               └───────────┘              │
└───────────────────────────────────────────┘
```

## Internacionalización (i18n)

### Patrón de tablas traducibles en BD:

```
products (id, price, active, ...)
    │
    └──► product_lang (id_product, id_lang, name, description, slug, meta_title, ...)
```

Cada entidad traducible tiene su tabla `_lang` con FK compuesta `(id_<entidad>, id_lang)`.

### Frontend:

- `@angular/localize` con archivos JSON de traducción
- Selector de idioma en header que cambia locale y recarga traducciones del API

## Sistema de Hooks (Extensibilidad)

```
┌─────────────┐    emits     ┌───────────┐    notifies   ┌──────────┐
│   Service   │──────────────►│ EventBus  │───────────────►│ Plugins  │
│ (order,     │              │ (central) │               │(listeners│
│  cart, etc) │              └───────────┘               │  custom) │
└─────────────┘                                          └──────────┘
```

Hooks predefinidos: `beforeAddToCart`, `afterAddToCart`, `beforeCreateOrder`, `afterCreateOrder`, `beforePayment`, `afterPayment`, `onProductView`, `onSearch`, etc.

## Autenticación

```
┌────────┐  POST /auth/login   ┌─────────┐
│ Client ├────────────────────►│ Backend │
│        │◄────────────────────┤         │
│        │  access_token (body)│         │
│        │  refresh_token      │         │
│        │  (httpOnly cookie)  │         │
│        │                     │         │
│        │  GET /api/v1/...    │         │
│        │  Authorization:     │         │
│        │  Bearer <access>    │         │
│        ├────────────────────►│         │
│        │                     │         │
│        │  POST /auth/refresh │         │
│        │  (cookie auto)      │         │
│        ├────────────────────►│         │
│        │◄────────────────────┤         │
│        │  new access_token   │         │
└────────┘  new refresh cookie └─────────┘
```

## Despliegue (Plesk Ubuntu)

```
┌─────────────────────────────────────┐
│           Plesk Server              │
│                                     │
│  ┌──────────┐                      │
│  │  Nginx   │  (reverse proxy)     │
│  │  :80/443 │                      │
│  └────┬─────┘                      │
│       │                             │
│  ┌────▼─────┐  ┌────────────────┐  │
│  │ PM2      │  │   Frontend     │  │
│  │ Node.js  │  │   (static)     │  │
│  │ :3000    │  │   served by    │  │
│  │ (API)    │  │   Nginx        │  │
│  └────┬─────┘  └────────────────┘  │
│       │                             │
│  ┌────▼─────┐                      │
│  │ MariaDB  │                      │
│  │ :3306    │                      │
│  └──────────┘                      │
└─────────────────────────────────────┘
```
