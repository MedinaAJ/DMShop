# DMShop vs PrestaShop — Gap Analysis

## Fecha: 2026-03-26 (actualizado en sprint 6)

---

## SPRINT 6 — 2026-03-26 (Lex, subagent)

### ✅ Tareas completadas en este sprint

| Tarea | Descripción | Estado |
|-------|-------------|--------|
| T1 | Checkout — confirmación de pedido y error de pago | ✅ |
| T2 | Multi-moneda — CurrencyService + selector header + backend CRUD | ✅ |
| T3 | SEO avanzado — og:price:amount, og:price:currency, twitter:card | ✅ |
| T4 | Import/Export CSV de productos (backend + admin UI) | ✅ |
| T5 | Gestión imágenes mejorada | ✅ (ya estaba completo en sprint anterior) |
| T6 | CMS Editor WYSIWYG con toolbar + preview en tiempo real | ✅ |
| T7 | Tickets soporte — modelos, backend, frontend cliente + admin | ✅ |
| T8 | Módulo presupuestos (Quotes) — modelos, backend, frontend cliente + admin | ✅ |
| T9 | PWA: manifest.webmanifest + Service Worker + meta tags | ✅ |
| T10 | Tests: 194/194 passing, GAP actualizado | ✅ |

### Tests: 194/194 passing ✅

### Archivos nuevos en sprint 6
- `backend/src/models/support-ticket.model.ts`
- `backend/src/models/support-message.model.ts`
- `backend/src/models/quote.model.ts`
- `backend/src/models/quote-item.model.ts`
- `backend/src/modules/currency/routes.ts`
- `backend/src/modules/support/routes.ts`
- `backend/src/modules/quotes/routes.ts`
- `frontend/src/app/core/services/currency.service.ts`
- `frontend/src/app/features/checkout/order-confirmation.component.ts`
- `frontend/src/app/features/checkout/payment-error.component.ts`
- `frontend/src/app/features/account/support/support.component.ts`
- `frontend/src/app/features/account/quotes/quotes.component.ts`
- `frontend/public/manifest.webmanifest`
- `frontend/public/sw.js`
- `admin/src/app/features/support/admin-support.component.ts`
- `admin/src/app/features/quotes/admin-quotes.component.ts`

---

## SPRINT 5 — 2026-03-26 (Lex, subagent)

### ✅ Tareas completadas en este sprint

| Tarea | Descripción | Estado |
|-------|-------------|--------|
| T1 | Homepage con banner dinámico y secciones | ✅ |
| T2 | Traducciones desde BD (API + seed + panel admin) | ✅ |
| T3 | Cuenta completa: dashboard, perfil, afiliados | ✅ |
| T4 | Checkout UX: resumen sticky en desktop | ✅ |
| T5 | Admin Dashboard: KPIs, recent orders, low stock | ✅ |
| T6 | Filtros avanzados catálogo | ✅ (ya existía) |
| T7 | WebSocket notifications en admin | ✅ |
| T8 | Módulo afiliados (tablas, backend, frontend) | ✅ |
| T9 | Newsletter: suscripción, widget footer, admin panel | ✅ |

### Tests: 194/194 passing ✅

---

## SPRINT 4 — (I18n, ThemeService, Email templates, etc.)

### ✅ Tareas completadas

| Tarea | Descripción | Estado |
|-------|-------------|--------|
| T1 | i18n con I18nService, pipe translate, selector idioma | ✅ |
| T2 | ThemeService con CSS custom properties y Google Fonts | ✅ |
| T3 | Panel Apariencia en admin (colores, logo, banner) | ✅ |
| T4 | Email templates: preview, test, config global admin | ✅ |
| T5 | Grupos de clientes y precios específicos | ✅ |
| T6 | Customer groups + historial de precios | ✅ |
| T7 | Multiidioma productos | ✅ |
| T8 | CMS pages multiidioma | ✅ |

---

## SPRINT 3 — 2026-03-20

### ✅ Tareas completadas

| Tarea | Descripción | Estado |
|-------|-------------|--------|
| T1 | Bizum vía Redsys REST API v2 | ✅ |
| T2 | Multiidioma en transportistas (carrier_lang) | ✅ |
| T3 | Multiidioma en estados de pedido (order_state_lang) | ✅ |
| T4 | Restricciones de método de pago por país | ✅ |
| T5 | Restricciones de método de pago por grupo de clientes | ✅ |
| T6 | Recargo por método de pago (surcharge) | ✅ |
| T7 | Reviews — moderación admin, "solo compradores" toggle | ✅ |
| T8 | Módulo de comparación de productos | ✅ |
| T9 | Alertas de stock back-in-stock | ✅ |
| T10 | SEO: JSON-LD breadcrumbs + Product schema | ✅ |
| T11 | Programa de fidelización (dm_loyalty_points) | ✅ |

---

## 1. Transportistas (Carriers)

- [x] **`free_shipping_starts_at`** ✅ Sprint 2
- [x] **URL de tracking** ✅ Sprint 2
- [x] **Rangos de precio CRUD en admin** ✅ Sprint 2
- [x] **Nombre/delay traducible por idioma** (`carrier_lang`) ✅ Sprint 3
- [x] **Tabs de idioma en carrier-form admin** ✅ Sprint 3

**Pendiente:**
- [ ] Logo/imagen del transportista
- [ ] Handling fee
- [ ] Carrier groups (productos frágiles con carrier específico)

---

## 2. Métodos de Pago

- [x] **PayPal real (OAuth2)** ✅ Sprint 2
- [x] **Redsys real (HMAC-SHA256 + 3DES)** ✅ Sprint 2
- [x] **Bizum vía Redsys DS_MERCHANT_PAYMETHODS=z** ✅ Sprint 3
- [x] **Restricciones por país** ✅ Sprint 3
- [x] **Restricciones por grupo de clientes** ✅ Sprint 3
- [x] **Recargo (surcharge)** ✅ Sprint 3

**Pendiente:**
- [ ] Pagos aplazados (Aplazame, Sequra, Klarna)
- [ ] Configuración PayPal desde admin UI

---

## 3. Estados de Pedido

- [x] **Template de email por estado** ✅ Sprint 2
- [x] **Bulk change de estado** ✅ Sprint 2
- [x] **Factura PDF adjunta al email** ✅ Sprint 2
- [x] **Nombre traducible por idioma** ✅ Sprint 3
- [x] **WebSocket emit al cambiar estado** ✅ Sprint 5

**Pendiente:**
- [ ] Estado "Devuelto" integrado con módulo devoluciones (auto-trigger)

---

## 4. Productos y Catálogo

- [x] **Stock por combinación** ✅ Sprint 2
- [x] **Specific prices** ✅ Sprint 2
- [x] **Multiidioma productos** ✅ Sprint 1
- [x] **Search autocomplete** ✅ Sprint 2
- [x] **Módulo de comparación** ✅ Sprint 3
- [x] **Alertas back-in-stock** ✅ Sprint 3
- [x] **Filtros avanzados catálogo** (precio, fabricante, stock, atributos) ✅ Sprint 4
- [x] **sort=newest / sort=bestseller** en endpoint products ✅ Sprint 5

**Pendiente:**
- [ ] Cross-sell / Up-sell (productos relacionados)
- [ ] Bundles / packs de productos

---

## 5. Homepage y Frontend

- [x] **Homepage básica** ✅ Sprint 1
- [x] **Homepage con banner dinámico** (ThemeService config) ✅ Sprint 5
- [x] **Sección novedades** en homepage ✅ Sprint 5
- [x] **Sección categorías destacadas** en homepage ✅ Sprint 5
- [x] **Banner CTA configurable** ✅ Sprint 5

**Pendiente:**
- [ ] Carrusel/slider en banner principal
- [ ] Sección "productos más vistos" (requiere analytics de vistas)

---

## 6. Internacionalización (i18n)

- [x] **I18nService con setLanguage/t()** ✅ Sprint 4
- [x] **Pipe translate** ✅ Sprint 4
- [x] **Selector idioma en header** ✅ Sprint 4
- [x] **GET /api/v1/translations/:lang** desde BD ✅ Sprint 5
- [x] **Modelo Translation + seed automático** ✅ Sprint 5
- [x] **Panel admin de traducciones** (edición inline, guardar) ✅ Sprint 5
- [x] **I18nService carga desde API con fallback a JSON** ✅ Sprint 5

**Pendiente:**
- [ ] Pipe translate en admin también (actualmente solo frontend)
- [ ] Hreflang tags para SEO multiidioma
- [ ] Traducción de categorías y fabricantes

---

## 7. Cuenta del cliente

- [x] **Dashboard de cuenta** ✅ Sprint 4
- [x] **Dashboard mejorado** (últimos pedidos, puntos, accesos) ✅ Sprint 5
- [x] **Perfil editable** (nombre, email, contraseña) ✅ Sprint 5
- [x] **Direcciones** (crear/editar/eliminar) ✅ Sprint 2
- [x] **Lista de pedidos** ✅ Sprint 2
- [x] **Detalle de pedido** ✅ Sprint 2
- [x] **Loyalty points** en cuenta ✅ Sprint 3
- [x] **Wishlist** ✅ Sprint 2
- [x] **Programa de afiliados** en cuenta ✅ Sprint 5

**Pendiente:**
- [ ] Histórico de devoluciones en cuenta
- [ ] Cambio de idioma persistente guardado en perfil

---

## 8. Checkout

- [x] **Stepper (Dirección → Envío → Pago → Confirmación)** ✅ Sprint 2
- [x] **Resumen sticky en desktop** ✅ Sprint 5
- [x] **Página de confirmación de pago** ✅ Sprint 2

**Pendiente:**
- [ ] Validación en tiempo real en campos de dirección
- [ ] Guest checkout (sin cuenta)
- [ ] Checkout en un paso (one-page checkout opción)

---

## 9. Admin Dashboard

- [x] **Dashboard básico con analytics** ✅ Sprint 2
- [x] **Gráfico de ventas (Chart.js)** ✅ Sprint 4
- [x] **KPIs: ventas hoy/mes, pedidos pendientes, nuevos clientes** ✅ Sprint 5
- [x] **Últimos 10 pedidos** en dashboard ✅ Sprint 5
- [x] **Productos con poco stock** en dashboard ✅ Sprint 5
- [x] **GET /analytics/dashboard/stats** endpoint consolidado ✅ Sprint 5

**Pendiente:**
- [ ] Notificaciones por email para admin cuando llega pedido
- [ ] Resumen de devoluciones en dashboard

---

## 10. WebSocket / Notificaciones en tiempo real

- [x] **WebSocketServer en backend** (`/ws`) ✅ Sprint 5
- [x] **Emit new_order** al crear pedido ✅ Sprint 5
- [x] **Emit order_status_changed** al cambiar estado ✅ Sprint 5
- [x] **NotificationsService en admin** con reconexión automática ✅ Sprint 5
- [x] **Bell de notificaciones en admin header** con badge ✅ Sprint 5

**Pendiente:**
- [ ] Emit out_of_stock al bajar cantidad a 0
- [ ] Persistencia de notificaciones en BD (actualmente solo en memoria)
- [ ] Autenticación del WebSocket (actualmente cualquier cliente puede conectar)

---

## 11. Newsletter

- [x] **Modelo NewsletterSubscriber** ✅ Sprint 5
- [x] **POST /newsletter/subscribe** ✅ Sprint 5
- [x] **GET /newsletter/unsubscribe?token=XXX** ✅ Sprint 5
- [x] **Widget suscripción en footer** ✅ Sprint 5
- [x] **Panel admin de suscriptores** con paginación ✅ Sprint 5
- [x] **Exportar CSV** de suscriptores ✅ Sprint 5

**Pendiente:**
- [ ] Integración con servicio de email marketing (Mailchimp, SendGrid)
- [ ] Envío de newsletters desde admin
- [ ] Double opt-in (email de confirmación antes de suscribir)

---

## 12. Afiliados

- [x] **Modelos Affiliate + AffiliateReferral** ✅ Sprint 5
- [x] **GET /account/affiliate** — datos del afiliado ✅ Sprint 5
- [x] **GET /admin/affiliates** — lista para admin ✅ Sprint 5
- [x] **AffiliatePageComponent** en cuenta del cliente ✅ Sprint 5
- [x] **AffiliatesComponent** panel admin ✅ Sprint 5

**Pendiente:**
- [ ] Registro automático con ?ref=CODE al navegar la tienda
- [ ] Cálculo automático de comisión al completar pedido (hook en order service)
- [ ] Pago de comisiones (transferencia, PayPal)

---

## 13. SEO

- [x] **Meta tags dinámicos** ✅ Sprint 2+3
- [x] **Schema.org Product JSON-LD** ✅ Sprint 3
- [x] **BreadcrumbList JSON-LD** ✅ Sprint 3
- [x] **Sitemap.xml** ✅ Sprint 2

**Pendiente:**
- [ ] robots.txt dinámico
- [ ] Hreflang tags para multiidioma

---

## 14. Returns/Devoluciones

- [x] **Módulo Returns/RMA** ✅ Sprint 2

**Pendiente:**
- [ ] Auto-cambio de estado de pedido al aprobar RMA
- [ ] Integración con puntos de fidelidad (restar puntos al devolver)

---

## 15. Backend / Infraestructura

- [x] **194 tests passing** ✅ Sprint 5
- [x] **PUT /users/me** — actualizar propio perfil ✅ Sprint 5
- [x] **PUT /users/me/password** — cambiar contraseña ✅ Sprint 5
- [x] **GET /analytics/dashboard/stats** ✅ Sprint 5
- [ ] Migraciones de schema para producción (Sequelize migrations)
- [ ] Redis/queue para envío masivo de emails
- [ ] Swagger completamente documentado

---

## Nuevos gaps identificados en Sprint 5

1. **WebSocket autenticación**: el endpoint `/ws` no verifica el token JWT del cliente. Cualquier cliente puede recibir notificaciones de admin.
2. **Afiliados ?ref=CODE**: el modelo y el panel admin están creados, pero el middleware que captura el código de afiliado al navegar y lo guarda en cookie no está implementado.
3. **Comisión automática afiliados**: el servicio `affiliateService.recordReferral()` existe pero no se llama desde `orderService.create()`.
4. **Newsletter double opt-in**: actualmente se suscribe directamente sin confirmación por email.
5. **Checkout validación real-time**: campos de dirección no se validan al perder el foco (blur), solo al submit.
6. **Catalog filter count**: el endpoint de productos no devuelve el número de productos por filtro/faceta.
7. **I18nService en admin**: el admin no usa el I18nService, solo tiene labels hardcodeados en español.
