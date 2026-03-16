# DMShop — Patrones de API

## Base URL

```
/api/v1/<recurso>
```

## Formato de Respuesta Estándar

### Éxito (singular)

```json
{
  "success": true,
  "data": { "id": 1, "name": "Producto" }
}
```

### Éxito (listado con paginación)

```json
{
  "success": true,
  "data": [{ "id": 1 }, { "id": 2 }],
  "meta": {
    "page": 1,
    "perPage": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Error

```json
{
  "success": false,
  "errors": [
    {
      "code": "VALIDATION_ERROR",
      "message": "El campo email es obligatorio",
      "field": "email"
    }
  ]
}
```

## Códigos de Error HTTP

| Código | Uso                                                    |
| ------ | ------------------------------------------------------ |
| 200    | OK — GET exitoso, PUT/PATCH exitoso                    |
| 201    | Created — POST exitoso                                 |
| 204    | No Content — DELETE exitoso                            |
| 400    | Bad Request — Validación fallida                       |
| 401    | Unauthorized — Token inválido o ausente                |
| 403    | Forbidden — Sin permisos                               |
| 404    | Not Found — Recurso no existe                          |
| 409    | Conflict — Duplicado (ej: email ya registrado)         |
| 422    | Unprocessable Entity — Datos válidos pero lógica falla |
| 429    | Too Many Requests — Rate limit excedido                |
| 500    | Internal Server Error — Error no controlado            |

## Códigos de Error de Aplicación

Formato: `<DOMINIO>_<DESCRIPCION>` en UPPER_SNAKE_CASE.

```
AUTH_INVALID_CREDENTIALS
AUTH_TOKEN_EXPIRED
AUTH_REFRESH_INVALID
AUTH_EMAIL_EXISTS
VALIDATION_ERROR
PRODUCT_NOT_FOUND
PRODUCT_OUT_OF_STOCK
CATEGORY_NOT_FOUND
CART_EMPTY
CART_RULE_INVALID
CART_RULE_EXPIRED
ORDER_NOT_FOUND
ORDER_INVALID_STATE
PAYMENT_FAILED
CARRIER_NOT_AVAILABLE
FORBIDDEN
INTERNAL_ERROR
```

## Paginación

Parámetros query:

- `page` (default: 1)
- `perPage` (default: 20, max: 100)
- `sort` (ej: `price`, `-price` para desc, `name,-created_at` para múltiples)

## Filtros

Parámetros query con nombre del campo:

- Igualdad: `?active=true`
- Rango: `?price_min=10&price_max=50`
- Búsqueda: `?q=texto`
- Relación: `?id_category=5`
- Múltiples valores: `?id_category=5,12,8`

## Inclusión de relaciones

Parámetro `include` para eager loading:

- `?include=images,categories,combinations`

## Idioma

Header `Accept-Language` o parámetro `?lang=es` para recibir traducciones en un idioma específico. Default: idioma por defecto de la tienda.

## Autenticación

Header `Authorization: Bearer <access_token>` en cada request autenticado.
El refresh token viaja automáticamente en cookie httpOnly.

### Endpoints de Auth

```
POST   /api/v1/auth/register     — Registro
POST   /api/v1/auth/login        — Login (devuelve access_token + set cookie refresh)
POST   /api/v1/auth/refresh      — Refresh (cookie → nuevo access + nueva cookie)
POST   /api/v1/auth/logout       — Logout (invalida refresh token)
POST   /api/v1/auth/forgot       — Solicitar reset de contraseña
POST   /api/v1/auth/reset        — Reset contraseña con token
GET    /api/v1/auth/me           — Perfil del usuario autenticado
```

### Endpoints CRUD estándar

```
GET    /api/v1/products          — Listar (paginado, filtrado)
GET    /api/v1/products/:id      — Detalle
POST   /api/v1/products          — Crear (admin)
PUT    /api/v1/products/:id      — Actualizar completo (admin)
PATCH  /api/v1/products/:id      — Actualizar parcial (admin)
DELETE /api/v1/products/:id      — Eliminar / soft delete (admin)
```

## Convenciones de Nombres de Ruta

- Plural para recursos: `/products`, `/categories`, `/orders`
- Kebab-case para multi-palabra: `/cart-rules`, `/order-states`
- Anidamiento máximo 2 niveles: `/products/:id/images`
- Acciones custom con verbo: `/orders/:id/cancel`, `/cart/checkout`
