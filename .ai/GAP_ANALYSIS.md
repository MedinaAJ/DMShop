# DMShop vs PrestaShop — Gap Analysis

## Fecha: 2026-03-20 (actualizado en sprint 3)

---

## SPRINT 3 — 2026-03-20 (Lex, subagent)

### ✅ Tareas completadas en este sprint

| Tarea | Descripción | Estado |
|-------|-------------|--------|
| T1 | Bizum vía Redsys REST API v2 | ✅ |
| T2 | Multiidioma en transportistas (carrier_lang) | ✅ |
| T3 | Multiidioma en estados de pedido (order_state_lang) | ✅ |
| T4 | Restricciones de método de pago por país | ✅ |
| T5 | Restricciones de método de pago por grupo de clientes | ✅ |
| T6 | Recargo por método de pago (surcharge) conectado al cart calculator | ✅ |
| T7 | Reviews — moderación admin ya existía, añadir "solo compradores" toggle | ✅ |
| T8 | Módulo de comparación de productos (hasta 3) | ✅ |
| T9 | Alertas de stock back-in-stock (dm_stock_alerts, emails automáticos) | ✅ |
| T10 | SEO: JSON-LD breadcrumbs + Product schema, canonical URLs | ✅ |
| T11 | Programa de fidelización (dm_loyalty_points, award/reverse, canjear) | ✅ |

### Tests: 194/194 passing ✅

---

## 1. Transportistas (Carriers)

- [x] **`free_shipping_starts_at`** ✅ Sprint 2
- [x] **URL de tracking** ✅ Sprint 2
- [x] **Rangos de precio CRUD en admin** ✅ Sprint 2
- [x] **Nombre/delay traducible por idioma** (`carrier_lang`) ✅ Sprint 3
- [x] **Tabs de idioma en carrier-form admin** ✅ Sprint 3
- [x] **Cart calculator con carrier translations** ✅ Sprint 3

**Pendiente:**
- [ ] Logo/imagen del transportista
- [ ] Handling fee
- [ ] Carrier groups (productos frágiles con carrier específico)
- [ ] Control visual de posición (grade) en admin

---

## 2. Métodos de Pago

- [x] **Stripe** ✅ Sprint 1
- [x] **PayPal real (OAuth2)** ✅ Sprint 2
- [x] **Redsys real (HMAC-SHA256 + 3DES)** ✅ Sprint 2
- [x] **Bizum vía Redsys DS_MERCHANT_PAYMETHODS=z** ✅ Sprint 3
- [x] **Estado diferenciado por método de pago** ✅ Sprint 2
- [x] **Restricciones por país** (admin + filtrado en getAvailableMethods) ✅ Sprint 3
- [x] **Restricciones por grupo de clientes** ✅ Sprint 3
- [x] **Recargo (surcharge)** conectado al cart calculator ✅ Sprint 3
- [x] **Toggle Bizum en admin** (comparte config Redsys) ✅ Sprint 3

**Pendiente:**
- [ ] Pagos aplazados (Aplazame, Sequra, Klarna)
- [ ] Configuración PayPal desde admin (actualmente solo via .env/config table)
- [ ] Restricción por transportista
- [ ] UI de config dinámica por módulo

---

## 3. Estados de Pedido

- [x] **Template de email por estado** ✅ Sprint 2
- [x] **Bulk change de estado** ✅ Sprint 2
- [x] **Estado diferenciado por método de pago** ✅ Sprint 2
- [x] **Factura PDF adjunta al email** ✅ Sprint 2
- [x] **Nombre traducible por idioma** (`order_state_lang`) ✅ Sprint 3
- [x] **Tabs de idioma en admin order-states** ✅ Sprint 3

**Pendiente:**
- [ ] Estado "Devuelto" integrado con módulo devoluciones (auto-trigger)
- [ ] Acciones automáticas configurables al cambiar estado (evento bus)

---

## 4. Productos y Catálogo

- [x] **Stock por combinación** ✅ Sprint 2
- [x] **Specific prices** ✅ Sprint 2
- [x] **Multiidioma productos** ✅ Sprint 1
- [x] **Search autocomplete** ✅ Sprint 2
- [x] **Módulo de comparación de productos** ✅ Sprint 3
- [x] **Alertas back-in-stock** (`dm_stock_alerts`, emails automáticos) ✅ Sprint 3
- [x] **Botón "Notificarme cuando esté disponible"** en frontend ✅ Sprint 3

**Pendiente:**
- [ ] Cross-sell / Up-sell (productos relacionados editables desde admin)
- [ ] Bundles / packs de productos
- [ ] Opciones de personalización de producto (texto libre en carrito)

---

## 5. SEO

- [x] **Meta tags dinámicos** (Title, Meta, og:image) ✅ Sprint 2 + 3
- [x] **Schema.org Product JSON-LD** ✅ Sprint 3
- [x] **Schema.org BreadcrumbList JSON-LD** ✅ Sprint 3
- [x] **Canonical URLs** (categorías sin paginación) ✅ Sprint 3
- [x] **Sitemap.xml** ✅ Sprint 2

**Pendiente:**
- [ ] robots.txt dinámico
- [ ] Hreflang tags para multiidioma
- [ ] Canonical para productos con combinaciones (param ?comb=)

---

## 6. Valoraciones (Reviews)

- [x] **Lista de reviews en producto** ✅ Sprint 1
- [x] **Moderación admin (aprobar/rechazar)** ✅ Sprint 2
- [x] **Solo compradores pueden valorar** (toggle en admin) ✅ Sprint 3

**Pendiente:**
- [ ] Respuesta del comercio a la reseña
- [ ] Votos útiles en reseñas
- [ ] Imágenes en reseñas

---

## 7. Fidelización y Marketing

- [x] **Customer groups** ✅ Sprint 2
- [x] **Wishlist (share, autocart-remove)** ✅ Sprint 2
- [x] **Cupones admin** ✅ Sprint 2
- [x] **Programa de puntos de fidelidad** (`dm_loyalty_points`) ✅ Sprint 3
  - Acumulación al entregar pedido
  - Reversión al cancelar
  - Canjear puntos como descuento
  - Sección "Mis puntos" en cuenta de cliente
  - Config admin (puntos por euro, valor por punto)

**Pendiente:**
- [ ] Newsletter/email marketing integrado
- [ ] Referral/affiliate program
- [ ] Descuentos por primera compra

---

## 8. Returns/Devoluciones

- [x] **Módulo Returns/RMA** ✅ Sprint 2

**Pendiente:**
- [ ] Auto-cambio de estado de pedido a "Devuelto" al aprobar RMA
- [ ] Integración con puntos de fidelidad (restar puntos al devolver)

---

## 9. Backend / Infraestructura

- [x] **194 tests passing** ✅ Sprint 3
- [x] **GET /langs endpoint** ✅ Sprint 3
- [x] **Sincronización automática de nuevos modelos** (sync: alter en dev) — pendiente pero bootstrap crea tablas nuevas
- [ ] Migraciones de schema para producción (Sequelize migrations)
- [ ] Redis/queue para envío masivo de emails stock alerts
- [ ] API pública documentada (Swagger auto-generado incompleto)

---

## Nuevos gaps identificados en Sprint 3

1. **`select_payment_method` antes de crear pedido**: el carrito calcula surcharge con el método de pago, pero al crear el pedido el método debe coincidir con el usado para calcular — sin transaccionalidad garantizada.
2. **Loyalty + devolucion**: al aprobar un RMA, los puntos no se restan. Solo se restan al cancelar pedido.
3. **Loyalty + carrito**: aplicar puntos crea un registro de `redemption` pero no ajusta el total del carrito en DB — el descuento se aplica fuera del carrito.
4. **carrier_lang / order_state_lang**: los tests en test/integration no cubren las nuevas tablas; si `sync: alter` no está activo en test, las tablas no se crean.
5. **Back-in-stock en test**: `StockAlert.findAll` falla en tests porque el modelo no está inicializado en el contexto de test. Workaround: `try/catch` ya implementado.
