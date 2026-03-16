# DMShop — Convenciones de Código

## Idioma

- **Código**: inglés (variables, funciones, clases, comentarios técnicos)
- **Documentación .ai/**: español
- **Commits**: español o inglés, consistente dentro de un PR

## TypeScript / General

- Variables y funciones: `camelCase`
- Clases, interfaces, types, enums: `PascalCase`
- Constantes globales: `UPPER_SNAKE_CASE`
- Archivos: `kebab-case` (ej: `cart-item.model.ts`, `auth.guard.ts`)
- Interfaces: NO prefijo `I` (usar `Product`, no `IProduct`)
- Enums: PascalCase con valores UPPER_SNAKE_CASE

## Base de Datos

- Tablas: `snake_case` plural (ej: `products`, `cart_items`, `order_histories`)
- Columnas: `snake_case` (ej: `created_at`, `unit_price`, `id_product`)
- Claves foráneas: `id_<tabla_singular>` (ej: `id_product`, `id_category`)
- Tablas de traducción: `<tabla>_lang` (ej: `product_lang`, `category_lang`)
- Primary key: `id` (autoincrement)
- Timestamps: `created_at`, `updated_at` en todas las tablas
- Soft delete: `deleted_at` donde aplique (productos, categorías, usuarios)

## Backend (Express)

- Estructura modular por dominio: `backend/src/modules/<dominio>/`
- Cada módulo tiene: `controller.ts`, `service.ts`, `routes.ts`, `validators.ts`
- Controllers: solo reciben request, llaman al service, devuelven response
- Services: toda la lógica de negocio
- Validators: schemas Zod para validar input
- Respuesta API estándar: `{ success: boolean, data?: T, meta?: PaginationMeta, errors?: ApiError[] }`
- Errores: lanzar `AppError` (clase custom), el middleware centralizado los captura
- Rutas: `/api/v1/<recurso>` (plural, kebab-case)

## Frontend Angular

- Standalone components (NO NgModules)
- Signals para estado reactivo local
- NgRx SignalStore para estado global (cart, auth, ui)
- Lazy loading por feature route
- Componentes: `<nombre>.component.ts` con selector `app-<nombre>`
- Servicios: `<nombre>.service.ts`, inyectados con `providedIn: 'root'` si son singleton
- Interceptors funcionales (no basados en clases)
- Guards funcionales
- Pipes y directivas: en `shared/`
- Angular Material para componentes UI complejos
- TailwindCSS para layout, spacing, tipografía, colores custom
- NO mezclar estilos inline de Material con clases Tailwind en el mismo elemento cuando sea confuso

## Shared

- Solo tipos, DTOs, constantes y utilidades puras (sin dependencias de runtime)
- NO importar nada de Angular ni Express en shared
- Enums compartidos como `const enum` o `enum` según necesidad de runtime

## Testing

- Backend: tests unitarios en `*.spec.ts` junto al archivo
- Frontend: tests unitarios con `.spec.ts` (generados por Angular CLI, mantener)
- Nombrar tests descriptivamente: `should create order when cart is valid`

## Git

- Ramas: `feature/<nombre>`, `fix/<nombre>`, `refactor/<nombre>`
- Commits: verbos en infinitivo, breves (ej: "Añadir sistema de cupones", "Corregir cálculo de impuestos")
