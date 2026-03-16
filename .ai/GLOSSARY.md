# DMShop — Glosario de Dominio

Términos del dominio e-commerce usados en el código y la base de datos.

## Catálogo

- **Product**: Producto base. Tiene un precio base, impuesto, marca, proveedor. Las traducciones están en `product_lang`.
- **Combination / Variant**: Una variante de un producto definida por atributos (ej: "Camiseta Roja Talla M"). Cada combinación tiene su propio stock, precio extra, referencia y EAN.
- **Attribute**: Tipo de variación (ej: "Color", "Talla"). NO confundir con Feature.
- **AttributeValue**: Valor concreto de un atributo (ej: "Rojo", "M", "42").
- **Feature**: Característica descriptiva de un producto que NO genera variantes (ej: "Material: Algodón", "Peso: 200g"). Solo informativa.
- **FeatureValue**: Valor de una Feature.
- **Category**: Organización jerárquica del catálogo. Árbol con categoría raíz. Cada producto tiene una categoría principal (`id_category_default`) y puede pertenecer a varias.
- **Manufacturer / Brand**: Fabricante o marca del producto.
- **Supplier**: Proveedor que suministra el producto (puede ser diferente de la marca).

## Precios

- **SpecificPrice**: Precio especial para un producto en determinadas condiciones (grupo de cliente, cantidad mínima, fechas). Precedencia sobre precio base.
- **CartRule**: Regla de descuento aplicada al carrito. Puede ser un cupón (con código) o automática. Tipos: porcentaje, importe fijo, envío gratis, producto regalo.
- **CatalogPriceRule**: Descuento automático aplicado a un grupo de productos (por categoría, marca, atributo) sin código.
- **TaxRule**: Regla que asocia un tipo impositivo a un país/zona.
- **TaxRuleGroup**: Grupo de reglas impositivas asignado a un producto (ej: "IVA estándar 21%").

## Ventas

- **Cart**: Carrito de compra. Puede pertenecer a un usuario registrado o ser anónimo.
- **CartItem**: Línea del carrito (producto + combinación + cantidad).
- **Order**: Pedido confirmado, generado desde un Cart tras el checkout.
- **OrderItem**: Línea del pedido (snapshot del producto al momento de la compra).
- **OrderState**: Estado del pedido (ej: "Pendiente de pago", "Pago aceptado", "En preparación", "Enviado", "Entregado", "Cancelado").
- **OrderHistory**: Log de cambios de estado del pedido.
- **Invoice**: Factura generada para un pedido.

## Envío

- **Carrier**: Transportista (ej: "SEUR", "MRW", "Recogida en tienda").
- **Zone**: Zona geográfica para cálculo de envío (ej: "España peninsular", "Canarias", "Europa").
- **CarrierZone**: Asociación entre un transportista y las zonas donde opera.

## Usuarios

- **User**: Cualquier usuario del sistema (customer o admin/employee).
- **CustomerGroup**: Grupo de clientes con precios o descuentos especiales (ej: "Mayorista", "VIP").
- **Address**: Dirección de envío o facturación.

## Contenido

- **CmsPage**: Página de contenido estático (ej: "Quiénes somos", "Política de privacidad").
- **CmsCategory**: Categoría de páginas CMS.

## i18n

- **Lang**: Idioma disponible en la tienda. Cada entidad traducible tiene una tabla `*_lang` con registros por cada Lang activo.
- **Currency**: Moneda (ej: EUR, USD). Con tasa de conversión respecto a la moneda por defecto.

## Sistema

- **Configuration**: Tabla key-value para almacenar configuraciones globales de la tienda.
- **Hook**: Punto de extensión donde los plugins pueden registrar listeners.
- **Plugin / Module**: Extensión que añade funcionalidad enganchándose a Hooks.
