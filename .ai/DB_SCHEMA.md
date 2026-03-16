# DMShop — Esquema de Base de Datos

## Convenciones

- PK: `id` INTEGER UNSIGNED AUTO_INCREMENT
- FK: `id_<tabla_singular>` (ej: `id_product`, `id_lang`)
- Timestamps: `created_at` DATETIME, `updated_at` DATETIME
- Soft delete: `deleted_at` DATETIME NULL
- Tablas de traducción: `<tabla>_lang` con PK compuesta (id\_<entidad>, id_lang)
- Booleanos: TINYINT(1) con nombre `is_<adjetivo>` o `active`

## Tablas Principales

### Sistema e i18n

#### langs

| Columna    | Tipo        | Notas                    |
| ---------- | ----------- | ------------------------ |
| id         | INT PK      |                          |
| name       | VARCHAR(64) | "Español", "English"     |
| iso_code   | VARCHAR(2)  | "es", "en"               |
| locale     | VARCHAR(5)  | "es-ES", "en-US"         |
| active     | TINYINT(1)  |                          |
| is_default | TINYINT(1)  | Solo 1 puede ser default |

#### currencies

| Columna         | Tipo          | Notas                         |
| --------------- | ------------- | ----------------------------- |
| id              | INT PK        |                               |
| name            | VARCHAR(64)   | "Euro", "US Dollar"           |
| iso_code        | VARCHAR(3)    | "EUR", "USD"                  |
| symbol          | VARCHAR(8)    | "€", "$"                      |
| conversion_rate | DECIMAL(13,6) | Respecto a moneda por defecto |
| decimals        | TINYINT       | Normalmente 2                 |
| active          | TINYINT(1)    |                               |
| is_default      | TINYINT(1)    |                               |

#### configurations

| Columna    | Tipo                | Notas                     |
| ---------- | ------------------- | ------------------------- |
| id         | INT PK              |                           |
| key        | VARCHAR(255) UNIQUE | "SHOP_NAME", "SHOP_EMAIL" |
| value      | TEXT                | Valor como string         |
| created_at | DATETIME            |                           |
| updated_at | DATETIME            |                           |

### Geografía

#### zones

| Columna | Tipo        | Notas                         |
| ------- | ----------- | ----------------------------- |
| id      | INT PK      |                               |
| name    | VARCHAR(64) | "Europa", "España peninsular" |
| active  | TINYINT(1)  |                               |

#### countries

| Columna         | Tipo         | Notas        |
| --------------- | ------------ | ------------ |
| id              | INT PK       |              |
| id_zone         | INT FK→zones |              |
| name            | VARCHAR(64)  |              |
| iso_code        | VARCHAR(3)   | "ESP", "FRA" |
| call_prefix     | VARCHAR(10)  | "+34"        |
| active          | TINYINT(1)   |              |
| contains_states | TINYINT(1)   |              |

#### states

| Columna    | Tipo             | Notas                 |
| ---------- | ---------------- | --------------------- |
| id         | INT PK           |                       |
| id_country | INT FK→countries |                       |
| name       | VARCHAR(64)      | "Madrid", "Barcelona" |
| iso_code   | VARCHAR(10)      |                       |
| active     | TINYINT(1)       |                       |

### Usuarios

#### users

| Columna          | Tipo                                | Notas       |
| ---------------- | ----------------------------------- | ----------- |
| id               | INT PK                              |             |
| email            | VARCHAR(255) UNIQUE                 |             |
| password         | VARCHAR(255)                        | bcrypt hash |
| first_name       | VARCHAR(100)                        |             |
| last_name        | VARCHAR(100)                        |             |
| role             | ENUM('customer','admin','employee') |             |
| active           | TINYINT(1)                          |             |
| id_default_group | INT FK→customer_groups              |             |
| newsletter       | TINYINT(1)                          |             |
| last_login_at    | DATETIME NULL                       |             |
| created_at       | DATETIME                            |             |
| updated_at       | DATETIME                            |             |
| deleted_at       | DATETIME NULL                       | Soft delete |

#### customer_groups

| Columna     | Tipo         | Notas                         |
| ----------- | ------------ | ----------------------------- |
| id          | INT PK       |                               |
| name        | VARCHAR(64)  | "Default", "VIP", "Mayorista" |
| reduction   | DECIMAL(5,2) | % descuento global            |
| show_prices | TINYINT(1)   |                               |
| created_at  | DATETIME     |                               |
| updated_at  | DATETIME     |                               |

#### user_groups (N:M)

| Columna  | Tipo                   | Notas        |
| -------- | ---------------------- | ------------ |
| id_user  | INT FK→users           | PK compuesta |
| id_group | INT FK→customer_groups | PK compuesta |

#### addresses

| Columna      | Tipo               | Notas             |
| ------------ | ------------------ | ----------------- |
| id           | INT PK             |                   |
| id_user      | INT FK→users       |                   |
| id_country   | INT FK→countries   |                   |
| id_state     | INT FK→states NULL |                   |
| alias        | VARCHAR(64)        | "Casa", "Trabajo" |
| first_name   | VARCHAR(100)       |                   |
| last_name    | VARCHAR(100)       |                   |
| company      | VARCHAR(100) NULL  |                   |
| address1     | VARCHAR(255)       |                   |
| address2     | VARCHAR(255) NULL  |                   |
| city         | VARCHAR(100)       |                   |
| postcode     | VARCHAR(20)        |                   |
| phone        | VARCHAR(20) NULL   |                   |
| phone_mobile | VARCHAR(20) NULL   |                   |
| vat_number   | VARCHAR(32) NULL   |                   |
| active       | TINYINT(1)         |                   |
| deleted_at   | DATETIME NULL      |                   |
| created_at   | DATETIME           |                   |
| updated_at   | DATETIME           |                   |

#### refresh_tokens

| Columna    | Tipo         | Notas                  |
| ---------- | ------------ | ---------------------- |
| id         | INT PK       |                        |
| id_user    | INT FK→users |                        |
| token      | VARCHAR(500) | JWT refresh token hash |
| expires_at | DATETIME     |                        |
| created_at | DATETIME     |                        |

### Catálogo

#### categories

| Columna    | Tipo                   | Notas                  |
| ---------- | ---------------------- | ---------------------- |
| id         | INT PK                 |                        |
| id_parent  | INT FK→categories NULL | NULL = raíz            |
| position   | INT                    | Orden dentro del padre |
| active     | TINYINT(1)             |                        |
| created_at | DATETIME               |                        |
| updated_at | DATETIME               |                        |
| deleted_at | DATETIME NULL          |                        |

#### category_lang

| Columna          | Tipo              | Notas        |
| ---------------- | ----------------- | ------------ |
| id_category      | INT FK→categories | PK compuesta |
| id_lang          | INT FK→langs      | PK compuesta |
| name             | VARCHAR(128)      |              |
| description      | TEXT NULL         |              |
| slug             | VARCHAR(128)      | URL amigable |
| meta_title       | VARCHAR(128) NULL |              |
| meta_description | VARCHAR(255) NULL |              |

#### manufacturers

| Columna    | Tipo         | Notas |
| ---------- | ------------ | ----- |
| id         | INT PK       |       |
| name       | VARCHAR(128) |       |
| active     | TINYINT(1)   |       |
| created_at | DATETIME     |       |
| updated_at | DATETIME     |       |

#### suppliers

| Columna    | Tipo         | Notas |
| ---------- | ------------ | ----- |
| id         | INT PK       |       |
| name       | VARCHAR(128) |       |
| active     | TINYINT(1)   |       |
| created_at | DATETIME     |       |
| updated_at | DATETIME     |       |

#### products

| Columna             | Tipo                      | Notas                             |
| ------------------- | ------------------------- | --------------------------------- |
| id                  | INT PK                    |                                   |
| id_category_default | INT FK→categories         | Categoría principal               |
| id_manufacturer     | INT FK→manufacturers NULL |                                   |
| id_supplier         | INT FK→suppliers NULL     |                                   |
| id_tax_rule_group   | INT FK→tax_rule_groups    |                                   |
| reference           | VARCHAR(64) NULL          | SKU                               |
| ean13               | VARCHAR(13) NULL          |                                   |
| price               | DECIMAL(20,6)             | Precio base SIN impuestos         |
| wholesale_price     | DECIMAL(20,6)             | Precio de coste                   |
| weight              | DECIMAL(10,3)             | En kg                             |
| quantity            | INT                       | Stock (si no tiene combinaciones) |
| active              | TINYINT(1)                |                                   |
| available_for_order | TINYINT(1)                |                                   |
| show_price          | TINYINT(1)                |                                   |
| is_virtual          | TINYINT(1)                | Producto digital                  |
| created_at          | DATETIME                  |                                   |
| updated_at          | DATETIME                  |                                   |
| deleted_at          | DATETIME NULL             |                                   |

#### product_lang

| Columna           | Tipo              | Notas          |
| ----------------- | ----------------- | -------------- |
| id_product        | INT FK→products   | PK compuesta   |
| id_lang           | INT FK→langs      | PK compuesta   |
| name              | VARCHAR(128)      |                |
| description       | TEXT NULL         | HTML permitido |
| description_short | TEXT NULL         |                |
| slug              | VARCHAR(128)      | URL amigable   |
| meta_title        | VARCHAR(128) NULL |                |
| meta_description  | VARCHAR(255) NULL |                |

#### product_images

| Columna    | Tipo            | Notas                       |
| ---------- | --------------- | --------------------------- |
| id         | INT PK          |                             |
| id_product | INT FK→products |                             |
| position   | INT             | Orden                       |
| cover      | TINYINT(1)      | Es la imagen principal      |
| path       | VARCHAR(255)    | Ruta relativa en filesystem |

#### product_categories (N:M)

| Columna     | Tipo              | Notas                        |
| ----------- | ----------------- | ---------------------------- |
| id_product  | INT FK→products   | PK compuesta                 |
| id_category | INT FK→categories | PK compuesta                 |
| position    | INT               | Orden dentro de la categoría |

#### attributes

| Columna    | Tipo     | Notas |
| ---------- | -------- | ----- |
| id         | INT PK   |       |
| position   | INT      |       |
| created_at | DATETIME |       |
| updated_at | DATETIME |       |

#### attribute_lang

| Columna      | Tipo              | Notas            |
| ------------ | ----------------- | ---------------- |
| id_attribute | INT FK→attributes | PK compuesta     |
| id_lang      | INT FK→langs      | PK compuesta     |
| name         | VARCHAR(64)       | "Color", "Talla" |

#### attribute_values

| Columna      | Tipo              | Notas               |
| ------------ | ----------------- | ------------------- |
| id           | INT PK            |                     |
| id_attribute | INT FK→attributes |                     |
| color        | VARCHAR(7) NULL   | Hex color si aplica |
| position     | INT               |                     |

#### attribute_value_lang

| Columna            | Tipo                    | Notas        |
| ------------------ | ----------------------- | ------------ |
| id_attribute_value | INT FK→attribute_values | PK compuesta |
| id_lang            | INT FK→langs            | PK compuesta |
| name               | VARCHAR(64)             | "Rojo", "XL" |

#### product_attribute_combinations

| Columna       | Tipo             | Notas                         |
| ------------- | ---------------- | ----------------------------- |
| id            | INT PK           |                               |
| id_product    | INT FK→products  |                               |
| reference     | VARCHAR(64) NULL |                               |
| ean13         | VARCHAR(13) NULL |                               |
| price_impact  | DECIMAL(20,6)    | + o - respecto al precio base |
| weight_impact | DECIMAL(10,3)    |                               |
| quantity      | INT              | Stock de esta combinación     |
| is_default    | TINYINT(1)       |                               |
| created_at    | DATETIME         |                               |
| updated_at    | DATETIME         |                               |

#### combination_values (N:M)

| Columna            | Tipo                                  | Notas        |
| ------------------ | ------------------------------------- | ------------ |
| id_combination     | INT FK→product_attribute_combinations | PK compuesta |
| id_attribute_value | INT FK→attribute_values               | PK compuesta |

#### features

| Columna  | Tipo   | Notas |
| -------- | ------ | ----- |
| id       | INT PK |       |
| position | INT    |       |

#### feature_lang

| Columna    | Tipo            | Notas              |
| ---------- | --------------- | ------------------ |
| id_feature | INT FK→features | PK compuesta       |
| id_lang    | INT FK→langs    | PK compuesta       |
| name       | VARCHAR(128)    | "Material", "Peso" |

#### feature_values

| Columna    | Tipo            | Notas |
| ---------- | --------------- | ----- |
| id         | INT PK          |       |
| id_feature | INT FK→features |       |

#### feature_value_lang

| Columna          | Tipo                  | Notas             |
| ---------------- | --------------------- | ----------------- |
| id_feature_value | INT FK→feature_values | PK compuesta      |
| id_lang          | INT FK→langs          | PK compuesta      |
| value            | VARCHAR(255)          | "Algodón", "200g" |

#### product_features (N:M)

| Columna          | Tipo                  | Notas        |
| ---------------- | --------------------- | ------------ |
| id_product       | INT FK→products       | PK compuesta |
| id_feature       | INT FK→features       | PK compuesta |
| id_feature_value | INT FK→feature_values |              |

### Impuestos

#### taxes

| Columna | Tipo         | Notas                  |
| ------- | ------------ | ---------------------- |
| id      | INT PK       |                        |
| rate    | DECIMAL(5,2) | Porcentaje (ej: 21.00) |
| active  | TINYINT(1)   |                        |

#### tax_lang

| Columna | Tipo         | Notas        |
| ------- | ------------ | ------------ |
| id_tax  | INT FK→taxes | PK compuesta |
| id_lang | INT FK→langs | PK compuesta |
| name    | VARCHAR(64)  | "IVA 21%"    |

#### tax_rule_groups

| Columna | Tipo        | Notas          |
| ------- | ----------- | -------------- |
| id      | INT PK      |                |
| name    | VARCHAR(64) | "IVA estándar" |
| active  | TINYINT(1)  |                |

#### tax_rules

| Columna           | Tipo                   | Notas               |
| ----------------- | ---------------------- | ------------------- |
| id                | INT PK                 |                     |
| id_tax_rule_group | INT FK→tax_rule_groups |                     |
| id_tax            | INT FK→taxes           |                     |
| id_country        | INT FK→countries       |                     |
| id_state          | INT FK→states NULL     | NULL = todo el país |

### Carrito

#### carts

| Columna             | Tipo                  | Notas           |
| ------------------- | --------------------- | --------------- |
| id                  | INT PK                |                 |
| id_user             | INT FK→users NULL     | NULL para guest |
| id_currency         | INT FK→currencies     |                 |
| id_lang             | INT FK→langs          |                 |
| id_address_delivery | INT FK→addresses NULL |                 |
| id_address_invoice  | INT FK→addresses NULL |                 |
| id_carrier          | INT FK→carriers NULL  |                 |
| created_at          | DATETIME              |                 |
| updated_at          | DATETIME              |                 |

#### cart_items

| Columna        | Tipo                                       | Notas |
| -------------- | ------------------------------------------ | ----- |
| id             | INT PK                                     |       |
| id_cart        | INT FK→carts                               |       |
| id_product     | INT FK→products                            |       |
| id_combination | INT FK→product_attribute_combinations NULL |       |
| quantity       | INT                                        |       |
| created_at     | DATETIME                                   |       |
| updated_at     | DATETIME                                   |       |

### Pedidos

#### order_states

| Columna  | Tipo       | Notas                                          |
| -------- | ---------- | ---------------------------------------------- |
| id       | INT PK     |                                                |
| color    | VARCHAR(7) | Hex color para UI                              |
| paid     | TINYINT(1) | Indica si el pedido está pagado en este estado |
| shipped  | TINYINT(1) |                                                |
| delivery | TINYINT(1) |                                                |

#### order_state_lang

| Columna        | Tipo                | Notas               |
| -------------- | ------------------- | ------------------- |
| id_order_state | INT FK→order_states | PK compuesta        |
| id_lang        | INT FK→langs        | PK compuesta        |
| name           | VARCHAR(64)         | "Pendiente de pago" |

#### orders

| Columna             | Tipo                | Notas                           |
| ------------------- | ------------------- | ------------------------------- |
| id                  | INT PK              |                                 |
| reference           | VARCHAR(16) UNIQUE  | Código único ej: "DMSHOP-00001" |
| id_user             | INT FK→users        |                                 |
| id_cart             | INT FK→carts        |                                 |
| id_currency         | INT FK→currencies   |                                 |
| id_lang             | INT FK→langs        |                                 |
| id_address_delivery | INT FK→addresses    |                                 |
| id_address_invoice  | INT FK→addresses    |                                 |
| id_carrier          | INT FK→carriers     |                                 |
| id_order_state      | INT FK→order_states | Estado actual                   |
| payment_method      | VARCHAR(64)         |                                 |
| total_products      | DECIMAL(20,6)       | Sin impuestos                   |
| total_products_tax  | DECIMAL(20,6)       |                                 |
| total_shipping      | DECIMAL(20,6)       | Sin impuestos                   |
| total_shipping_tax  | DECIMAL(20,6)       |                                 |
| total_discounts     | DECIMAL(20,6)       |                                 |
| total_discounts_tax | DECIMAL(20,6)       |                                 |
| total_paid          | DECIMAL(20,6)       | Total final con impuestos       |
| conversion_rate     | DECIMAL(13,6)       | Tasa al momento del pedido      |
| created_at          | DATETIME            |                                 |
| updated_at          | DATETIME            |                                 |

#### order_items

| Columna           | Tipo                                       | Notas                         |
| ----------------- | ------------------------------------------ | ----------------------------- |
| id                | INT PK                                     |                               |
| id_order          | INT FK→orders                              |                               |
| id_product        | INT FK→products                            |                               |
| id_combination    | INT FK→product_attribute_combinations NULL |                               |
| product_name      | VARCHAR(255)                               | Snapshot del nombre           |
| product_reference | VARCHAR(64)                                | Snapshot                      |
| product_price     | DECIMAL(20,6)                              | Precio unitario sin impuestos |
| product_price_tax | DECIMAL(20,6)                              |                               |
| quantity          | INT                                        |                               |
| tax_rate          | DECIMAL(5,2)                               | Snapshot del % impuesto       |

#### order_histories

| Columna        | Tipo                | Notas                |
| -------------- | ------------------- | -------------------- |
| id             | INT PK              |                      |
| id_order       | INT FK→orders       |                      |
| id_order_state | INT FK→order_states |                      |
| id_user        | INT FK→users NULL   | Quién hizo el cambio |
| created_at     | DATETIME            |                      |

### Envío

#### carriers

| Columna         | Tipo                   | Notas                               |
| --------------- | ---------------------- | ----------------------------------- |
| id              | INT PK                 |                                     |
| name            | VARCHAR(64)            |                                     |
| url             | VARCHAR(255) NULL      | URL tracking con @ como placeholder |
| active          | TINYINT(1)             |                                     |
| is_free         | TINYINT(1)             |                                     |
| shipping_method | ENUM('price','weight') | Cómo calcula el coste               |
| max_width       | INT NULL               | cm                                  |
| max_height      | INT NULL               |                                     |
| max_depth       | INT NULL               |                                     |
| max_weight      | DECIMAL(10,3) NULL     | kg                                  |
| position        | INT                    |                                     |
| created_at      | DATETIME               |                                     |
| updated_at      | DATETIME               |                                     |

#### carrier_zones

| Columna    | Tipo            | Notas        |
| ---------- | --------------- | ------------ |
| id_carrier | INT FK→carriers | PK compuesta |
| id_zone    | INT FK→zones    | PK compuesta |

#### carrier_ranges

| Columna    | Tipo            | Notas                 |
| ---------- | --------------- | --------------------- |
| id         | INT PK          |                       |
| id_carrier | INT FK→carriers |                       |
| id_zone    | INT FK→zones    |                       |
| range_from | DECIMAL(20,6)   | Desde (precio o peso) |
| range_to   | DECIMAL(20,6)   | Hasta                 |
| price      | DECIMAL(20,6)   | Coste de envío        |

### Marketing

#### cart_rules

| Columna           | Tipo                        | Notas                    |
| ----------------- | --------------------------- | ------------------------ |
| id                | INT PK                      |                          |
| code              | VARCHAR(64) NULL            | NULL = automático        |
| description       | VARCHAR(255)                |                          |
| reduction_type    | ENUM('percentage','amount') |                          |
| reduction_value   | DECIMAL(20,6)               |                          |
| free_shipping     | TINYINT(1)                  |                          |
| minimum_amount    | DECIMAL(20,6)               |                          |
| quantity          | INT                         | Usos totales disponibles |
| quantity_per_user | INT                         | Usos por usuario         |
| active            | TINYINT(1)                  |                          |
| date_from         | DATETIME                    |                          |
| date_to           | DATETIME                    |                          |
| created_at        | DATETIME                    |                          |
| updated_at        | DATETIME                    |                          |

### CMS

#### cms_categories

| Columna   | Tipo        | Notas |
| --------- | ----------- | ----- |
| id        | INT PK      |       |
| id_parent | INT FK NULL |       |
| position  | INT         |       |
| active    | TINYINT(1)  |       |

#### cms_category_lang

| Columna         | Tipo                  | Notas        |
| --------------- | --------------------- | ------------ |
| id_cms_category | INT FK→cms_categories | PK compuesta |
| id_lang         | INT FK→langs          | PK compuesta |
| name            | VARCHAR(128)          |              |
| slug            | VARCHAR(128)          |              |

#### cms_pages

| Columna         | Tipo                  | Notas |
| --------------- | --------------------- | ----- |
| id              | INT PK                |       |
| id_cms_category | INT FK→cms_categories |       |
| position        | INT                   |       |
| active          | TINYINT(1)            |       |
| created_at      | DATETIME              |       |
| updated_at      | DATETIME              |       |

#### cms_page_lang

| Columna          | Tipo              | Notas        |
| ---------------- | ----------------- | ------------ |
| id_cms_page      | INT FK→cms_pages  | PK compuesta |
| id_lang          | INT FK→langs      | PK compuesta |
| title            | VARCHAR(128)      |              |
| content          | TEXT              | HTML         |
| slug             | VARCHAR(128)      |              |
| meta_title       | VARCHAR(128) NULL |              |
| meta_description | VARCHAR(255) NULL |              |

### Wishlist & Reviews

#### wishlists

| Columna    | Tipo         | Notas |
| ---------- | ------------ | ----- |
| id         | INT PK       |       |
| id_user    | INT FK→users |       |
| name       | VARCHAR(64)  |       |
| created_at | DATETIME     |       |

#### wishlist_items

| Columna        | Tipo             | Notas        |
| -------------- | ---------------- | ------------ |
| id_wishlist    | INT FK→wishlists | PK compuesta |
| id_product     | INT FK→products  | PK compuesta |
| id_combination | INT FK NULL      |              |
| created_at     | DATETIME         |              |

#### product_reviews

| Columna    | Tipo            | Notas      |
| ---------- | --------------- | ---------- |
| id         | INT PK          |            |
| id_product | INT FK→products |            |
| id_user    | INT FK→users    |            |
| rating     | TINYINT         | 1-5        |
| title      | VARCHAR(128)    |            |
| content    | TEXT            |            |
| approved   | TINYINT(1)      | Moderación |
| created_at | DATETIME        |            |
| updated_at | DATETIME        |            |

### Plugins/Hooks

#### hooks

| Columna     | Tipo                | Notas             |
| ----------- | ------------------- | ----------------- |
| id          | INT PK              |                   |
| name        | VARCHAR(128) UNIQUE | "beforeAddToCart" |
| description | VARCHAR(255)        |                   |

#### hook_modules

| Columna     | Tipo         | Notas              |
| ----------- | ------------ | ------------------ |
| id_hook     | INT FK→hooks | PK compuesta       |
| module_name | VARCHAR(128) | Nombre del plugin  |
| position    | INT          | Orden de ejecución |
| active      | TINYINT(1)   |                    |
