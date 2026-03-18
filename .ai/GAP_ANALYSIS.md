# DMShop vs PrestaShop — Gap Analysis

## Fecha: 2026-03-18

---

## 1. Transportistas (Carriers)

### Lo que tiene DMShop
- Modelo `Carrier` con: nombre, URL de tracking, activo/inactivo, `is_free` (booleano global), `shipping_method` (weight|price), dimensiones máximas (max_width, max_height, max_depth, max_weight), `grade` (posición/orden), `delay` (número de días), grupo de reglas fiscales, asociación con zonas (`carrier_zones`), rangos de precio por zona (`carrier_ranges` + `carrier_range_prices`)
- Admin: formulario completo de creación/edición con zonas, dimensiones, método de envío, URL de tracking
- Cart calculator: `getShippingCost()` busca el rango coincidente por precio/peso y zona; `getAvailableCarriers()` filtra por zona de la dirección de entrega
- Validación básica de zona en `getShippingCost()` (si el carrier no sirve la zona, devuelve 0)
- Gestión CRUD en admin (listar, crear, editar, eliminar)

### Lo que falta vs PrestaShop

- [ ] **Nombre traducible por idioma** (tabla `carrier_lang` en PS) — DMShop usa un solo campo `name` no traducible
  - **Prioridad: Media** (tiendas multiidioma lo necesitan)

- [ ] **Logo/imagen del transportista** — PS permite subir un logo que se muestra en checkout
  - **Prioridad: Media** (mejora UX del checkout considerablemente)

- [ ] **Handling fee (cargo por gestión)** — PS tiene un campo de coste adicional fijo por gestión, independiente del rango
  - **Prioridad: Baja** (poco común en tiendas españolas)

- [ ] **Envío gratuito por zona** — `is_free` es global; PS permite configurar envío gratuito por zona específica
  - **Prioridad: Alta** — implementada en MEJORA A como `free_shipping_starts_at`

- [x] **`free_shipping_starts_at`** — umbral de importe a partir del cual el envío es gratuito (MEJORA A implementada)
  - **Prioridad: Alta** ✅ implementado en esta sesión

- [ ] **Delay como texto traducible** — `delay` en DMShop es un entero (días); PS tiene texto por idioma ("Entrega en 24h", "3-5 días laborables")
  - **Prioridad: Media** (el checkout muestra "Entrega en N días" de forma rígida)

- [ ] **URL de tracking con `@` o `{tracking_number}`** — el campo `url` existe en el modelo y admin, pero no se usa en ningún lado: no se construye el enlace de tracking real. PS sustituye `@` por el número de seguimiento.
  - **Prioridad: Alta** (funcionalidad de tracking completamente inoperativa)

- [x] **Restricciones por dimensiones (max_width, max_height, max_depth, max_weight)** — los campos existen en el modelo y admin, pero en `getAvailableCarriers()` y `getShippingCost()` **nunca se validan**. Un carrier con max_weight=5 aparecería disponible para un pedido de 20kg.
  - **Prioridad: Alta** — parcialmente implementada en MEJORA A (filtro por max_weight en getAvailableCarriers)

- [ ] **Carrier groups** — PS permite asociar transportistas a grupos de productos (ej: productos frágiles solo con ciertos carriers)
  - **Prioridad: Baja** (complejo y raramente usado en tiendas pequeñas)

- [ ] **Posición/orden en checkout** — `grade` existe en el modelo y se usa en ORDER BY, pero en el admin no hay ningún control visual para reordenar
  - **Prioridad: Media** (la ordenación en checkout es relevante para UX)

- [ ] **Admin: visualización de rangos en tabla editable** — el formulario del admin envía `ranges: []` vacío siempre (ver `onSubmit()` en carrier-form: `ranges: []`). Los rangos no se pueden gestionar desde el admin.
  - **Prioridad: Alta** (sin esto los rangos de precio son inaccesibles desde el panel)

- [ ] **Admin: campo `grade`/posición** — no aparece en el formulario del admin
  - **Prioridad: Media**

---

## 2. Métodos de Pago

### Lo que tiene DMShop
- **Stripe** — tarjeta vía Stripe Checkout (redirect), webhook handler con verificación de firma
- **Transferencia bancaria** — método offline, queda en estado "En espera de pago"
- **Contra reembolso** — método offline
- Sistema modular (`PaymentModule` interface + `PaymentRegistry`) muy extensible
- Webhooks: ruta `/payment/webhook/:method` con body raw para verificación de firma
- Configuración en admin: toggle activo/inactivo, claves de Stripe
- Estado diferente según resultado: `PAYMENT_ACCEPTED` si el pago es completo, `PAYMENT_ERROR` si falla

### Lo que falta vs PrestaShop

- [ ] **Redsys (TPV Virtual bancario español)** — pasarela #1 en España, requerida por la mayoría de bancos españoles. PS tiene módulo oficial.
  - **Prioridad: Alta** ✅ estructura base implementada en MEJORA E

- [ ] **PayPal** — segundo método más usado en España, PS tiene módulo oficial
  - **Prioridad: Alta** (impacto directo en conversión)

- [ ] **Bizum** — método de pago móvil español, muy demandado. Disponible vía Redsys REST API v2.
  - **Prioridad: Alta** (37% de los pagos online en España)

- [ ] **Pagos aplazados** (Aplazame, Sequra, Klarna) — PS tiene módulos. Aumentan ticket medio.
  - **Prioridad: Media** (más relevante para B2C con ticket alto)

- [ ] **Configuración visual en admin por módulo** — actualmente solo Stripe tiene configuración de claves; transferencia y contra reembolso solo tienen toggle. No hay: logo del método, descripción editable, orden en checkout, restricciones por país en el admin.
  - **Prioridad: Alta** ✅ parcialmente mejorado en MEJORA B (campos allowedCountries y surcharge en la interface)

- [ ] **Recargo por método de pago (surcharge)** — PS permite añadir un % o importe fijo al total cuando se elige cierto método (ej: contra reembolso +3€)
  - **Prioridad: Alta** ✅ estructura base añadida en MEJORA B (surchargePercent, surchargeAmount en interface)

- [ ] **Restricción por país** — `allowedCountries` ahora en la interface, pero no implementado en los módulos ni en el filtrado del checkout
  - **Prioridad: Alta** ✅ interface preparada en MEJORA B

- [ ] **Restricción por grupo de clientes** — PS permite deshabilitar métodos para ciertos grupos (ej: contra reembolso solo para clientes verificados)
  - **Prioridad: Media**

- [ ] **Restricción por transportista** — PS permite ligar métodos de pago a transportistas (ej: contra reembolso solo con MRW, no con Correos Express)
  - **Prioridad: Media** (requerido por algunas tiendas)

- [ ] **Estado de pedido diferenciado por método de pago** — actualmente todos los pedidos empiezan en `AWAITING_PAYMENT` (id=1). PS asigna el estado inicial según el módulo (transferencia → "Pago pendiente confirmación bancaria", contra reembolso → "En espera de contra reembolso")
  - **Prioridad: Alta** (confusión operativa al mezclar métodos en la misma vista)

- [ ] **Webhook handler para PayPal** — no existe ningún módulo PayPal
  - **Prioridad: Alta** (ligado a implementación del módulo)

- [ ] **Pantalla de configuración por módulo con campos dinámicos** — el admin actual tiene una pantalla monolítica de pagos; añadir un nuevo módulo requiere modificar el componente. PS genera la UI de config dinámicamente desde cada módulo.
  - **Prioridad: Media** (arquitectura, no funcionalidad de usuario)

---

## 3. Estados de Pedido

### Lo que tiene DMShop
- Modelo `OrderState` con: nombre, color, flags (paid, shipped, delivery, invoice), `send_email` (envía email al cambiar a este estado), `template` (nombre del template de email, campo existe pero no se usa en `mailService`), `icon`, `deleted` (soft delete)
- 9 estados predefinidos: `AWAITING_PAYMENT`, `PAYMENT_ACCEPTED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `REFUNDED`, `PAYMENT_ERROR`, `ON_HOLD`
- Historial: `OrderHistory` con id_order, id_order_state, id_user (registra quién cambió el estado — usa `id_user`, no `id_employee`)
- Admin: cambio de estado desde el detalle del pedido con comentario
- Admin: filtro de pedidos por estado en la lista
- Búsqueda por referencia en lista admin

### Lo que falta vs PrestaShop

- [ ] **Estados traducibles** (tabla `order_state_lang` en PS) — nombre del estado en múltiples idiomas. DMShop tiene un solo campo `name`.
  - **Prioridad: Media** (necesario para multiidioma)

- [ ] **Template de email por estado operativo** — el campo `template` existe en `OrderState` pero `mailService.sendOrderStatusChange()` no lo usa para seleccionar un template; siempre usa el mismo template genérico.
  - **Prioridad: Alta** (el email de "pedido enviado" debería ser diferente al de "pedido cancelado")

- [ ] **PDF de factura adjunto al cambiar estado** — el flag `invoice` en `OrderState` indica "generar factura", pero no se adjunta al email automáticamente cuando el estado tiene `invoice=true`.
  - **Prioridad: Media** (la descarga manual ya existe en el admin)

- [ ] **Estado diferenciado para cada método de pago** — "En espera de pago por transferencia" vs "En espera de confirmación de contra reembolso" vs "Procesando tarjeta". Actualmente todos comparten `AWAITING_PAYMENT`.
  - **Prioridad: Alta** (confusión operativa)

- [x] **Historial con id_user** — ya existe `id_user` en `OrderHistory`. En `updateState()` se pasa `adminUserId`. Sin embargo, en `registerPayment()` se pasa `id_user: null` al crear el historial, perdiendo la trazabilidad de quién registró el pago manualmente.
  - **Prioridad: Alta** — mejorado en MEJORA D (renombrado/refuerzo de id_employee)

- [ ] **Acción automática al cambiar estado** — PS ejecuta acciones al hacer la transición (generar factura, exportar a ERP, notificar almacén, actualizar stock). DMShop solo tiene la cancelación que restaura stock; no hay sistema de acciones configurables.
  - **Prioridad: Media** (el event bus `HookName` existe pero no se usa en cambios de estado)

- [ ] **Bulk change de estado en lista de pedidos** — no hay selección múltiple ni cambio masivo de estado en la lista admin.
  - **Prioridad: Alta** ✅ implementado en MEJORA C

- [ ] **Estado "Devuelto" integrado con módulo de devoluciones** — el estado `REFUNDED` (id=7) existe, pero el módulo de devoluciones (`order-return`) no cambia automáticamente el pedido a ese estado al aprobar la devolución.
  - **Prioridad: Media**

---

## 4. Otras carencias generales encontradas

### Sistema de tracking de envíos completamente inoperativo
- `OrderCarrier` tiene `tracking_number` y `Carrier` tiene `url`, pero en ningún lugar se construye el enlace `url.replace('@', trackingNumber)`. El usuario no puede hacer clic en un enlace de seguimiento.
- **Prioridad: Alta**

### Checkout: precio del transportista no se muestra
- En `checkout.component.ts` (step de carrier), la línea muestra `'Calculando...'` para todos los carriers no gratuitos. El precio real solo se calcula en el siguiente paso (summary). El usuario no puede comparar precios antes de elegir el carrier.
- **Prioridad: Alta** (UX crítica — PS muestra el precio junto al nombre del carrier)

### Checkout: no hay filtrado de métodos de pago por transportista
- Si el usuario elige "contra reembolso" pero el transportista no lo admite, el pedido se crea igualmente.
- **Prioridad: Media**

### Admin: rangos de precio de transportista no editables
- `carrier-form.component.ts` → `onSubmit()` envía siempre `ranges: []`, lo que borra todos los rangos al editar un transportista. Es un bug crítico para la configuración de precios de envío.
- **Prioridad: Crítica (bug)**

### OrderHistory usa id_user en lugar de id_employee
- El campo es `id_user` y referencia la tabla `users`, que mezcla clientes y admins. PS tiene `id_employee` separado. En DMShop es difícil distinguir si el cambio lo hizo un cliente (en casos automáticos) o un admin.
- **Prioridad: Media** — mejorado en MEJORA D

### Sin migración automática de schema (Sequelize sync)
- El campo `free_shipping_starts_at` añadido en MEJORA A no tiene migration. En producción habría que ejecutar el ALTER TABLE manualmente.
- **Prioridad: Alta** (afecta deployment)

### Shared package: tipos no incluyen freeShippingStartsAt
- `createCarrierSchema` y `updateCarrierSchema` no incluyen el nuevo campo. Debe añadirse y recompilar el shared package.
- **Prioridad: Alta** (bloqueante para que el backend acepte el campo)

---

## Resumen de prioridades

| # | Gap | Área | Prioridad |
|---|-----|------|-----------|
| 1 | Rangos de precio del carrier se borran al editar (BUG) | Carrier | 🔴 Crítico |
| 2 | Redsys / PayPal / Bizum | Pago | 🔴 Alta |
| 3 | URL de tracking inoperativa | Carrier | 🔴 Alta |
| 4 | Precio del carrier no visible antes de seleccionar | Checkout | 🔴 Alta |
| 5 | Template de email por estado no funcional | Estados | 🔴 Alta |
| 6 | Estado diferenciado por método de pago | Pago/Estados | 🔴 Alta |
| 7 | free_shipping_starts_at (implementado ✅) | Carrier | ✅ |
| 8 | Bulk change estado (implementado ✅) | Estados | ✅ |
| 9 | Redsys stub (implementado ✅) | Pago | ✅ |
| 10 | Restricciones de pago por país + surcharge (implementado ✅) | Pago | ✅ |
