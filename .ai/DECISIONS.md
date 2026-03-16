# DMShop — Registro de Decisiones

Cada decisión se documenta con contexto, alternativas y justificación.
Formato: `### [FECHA] Título` → Contexto, Decisión, Alternativas, Consecuencias.

---

### [2026-03-16] Monorepo simple con npm workspaces

**Contexto**: Necesitamos gestionar backend, frontend (tienda), admin (backoffice) y tipos compartidos.
**Decisión**: Monorepo con npm workspaces nativo.
**Alternativas descartadas**:

- Nx: demasiada complejidad y configuración para un proyecto mantenido por IA
- Turborepo: añade capa de build innecesaria inicialmente
- Repos separados: dificulta compartir tipos y mantener consistencia
  **Consecuencias**: Configuración simple, un solo `npm install`, tipos compartidos via workspace. Angular apps se gestionan fuera de workspaces (tienen su propio node_modules via Angular CLI).

---

### [2026-03-16] JWT access + refresh token httpOnly

**Contexto**: Necesitamos autenticación segura para SPA.
**Decisión**: Access token JWT (15min) en memoria/header + Refresh token (7d) en cookie httpOnly Secure SameSite=Strict.
**Alternativas descartadas**:

- Sesiones con cookies: no escala bien con múltiples frontends
- JWT en localStorage: vulnerable a XSS
- OAuth2 completo: sobredimensionado para autenticación propia
  **Consecuencias**: Protección contra XSS (refresh token inaccesible por JS), protección contra CSRF (SameSite), rotación de tokens.

---

### [2026-03-16] REST sobre GraphQL

**Contexto**: Elegir paradigma de API.
**Decisión**: REST con OpenAPI/Swagger.
**Alternativas descartadas**:

- GraphQL: curva de aprendizaje, más difícil de documentar automáticamente, over-engineering para un e-commerce estándar
- tRPC: acoplamiento fuerte, no apto para API pública futura
  **Consecuencias**: Swagger genera documentación automática, IAs entienden REST nativamente, cacheo HTTP estándar.

---

### [2026-03-16] Sequelize con sequelize-typescript

**Contexto**: Elegir ORM para MariaDB.
**Decisión**: Sequelize 6+ con sequelize-typescript para decoradores.
**Alternativas descartadas**:

- TypeORM: API inestable históricamente, cambios breaking frecuentes
- Prisma: no soporta MariaDB oficialmente como target separado de MySQL
- Knex: query builder puro, demasiado bajo nivel
  **Consecuencias**: Decoradores type-safe, migraciones con Umzug, buena compatibilidad con MariaDB.

---

### [2026-03-16] Angular 19+ standalone + Signals + NgRx SignalStore

**Contexto**: Elegir stack frontend y gestión de estado.
**Decisión**: Standalone components (sin NgModules) + Angular Signals + NgRx SignalStore para estado global.
**Alternativas descartadas**:

- NgModules: deprecated en filosofía Angular moderna
- NgRx clásico (Store + Effects + Reducers): demasiado boilerplate
- RxJS solo: Signals son el futuro de Angular
  **Consecuencias**: Menos boilerplate, mejor performance con Signals, código más simple para IA.

---

### [2026-03-16] Zod para validación compartida

**Contexto**: Necesitamos validar input en backend y frontend.
**Decisión**: Zod en `shared/` para definir schemas de validación reutilizables.
**Alternativas descartadas**:

- Joi: no infiere tipos TypeScript
- class-validator: requiere clases, no funcional
- Yup: menos type-safe que Zod
  **Consecuencias**: Un schema define validación + tipo TypeScript, compartido entre front y back.

---

### [2026-03-16] Patrón \*\_lang para i18n en BD

**Contexto**: Entidades como Product, Category necesitan traducciones multi-idioma.
**Decisión**: Tabla hija `<entidad>_lang` con FK compuesta (id_entidad, id_lang).
**Alternativas descartadas**:

- JSON column: no indexable, consultas complejas
- Una columna por idioma: no escalable
- Tabla genérica de traducciones: consultas complejas, sin tipado
  **Consecuencias**: Patrón probado (PrestaShop lo usa), consultas JOIN simples, indexación normal.

---

### [2026-03-16] Despliegue en Plesk Ubuntu 22 con PM2

**Contexto**: El servidor de producción usa Plesk en Ubuntu 22.
**Decisión**: PM2 como process manager, Nginx (gestionado por Plesk) como reverse proxy. Frontend servido como static files.
**Alternativas descartadas**:

- Docker: Plesk tiene soporte limitado de Docker, añade complejidad
- Systemd services: PM2 ofrece mejor DX (logs, restart, cluster mode)
  **Consecuencias**: Compatible nativo con Plesk, zero-downtime deploys con PM2 reload, cluster mode para aprovechar CPUs.

---

### [2026-03-16] Single store (sin multi-tienda)

**Contexto**: PrestaShop soporta multi-tienda pero añade complejidad enorme.
**Decisión**: Una tienda por instalación.
**Alternativas descartadas**:

- Multi-store nativo: duplica complejidad en cada query (filtrar por id_shop)
  **Consecuencias**: Modelos más simples, queries más rápidas. Si se necesita multi-tienda en el futuro, se puede añadir id_shop a los modelos principales.
