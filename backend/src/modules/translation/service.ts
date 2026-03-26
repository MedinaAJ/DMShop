import { Translation } from '../../models/translation.model.js';
import { logger } from '../../config/logger.js';

// Default translations seed
const DEFAULT_TRANSLATIONS: Record<string, Record<string, string>> = {
  es: {
    'nav.home': 'Inicio',
    'nav.catalog': 'Catálogo',
    'nav.cart': 'Carrito',
    'nav.account': 'Mi cuenta',
    'nav.login': 'Iniciar sesión',
    'nav.logout': 'Cerrar sesión',
    'nav.register': 'Registrarse',
    'nav.wishlist': 'Lista de deseos',
    'nav.compare': 'Comparar',
    'nav.search': 'Buscar',
    'home.welcome': 'Bienvenido',
    'home.featured': 'Productos destacados',
    'home.newest': 'Novedades',
    'home.bestsellers': 'Más vendidos',
    'home.categories': 'Categorías',
    'home.viewAll': 'Ver todos',
    'product.addToCart': 'Añadir al carrito',
    'product.addToWishlist': 'Añadir a favoritos',
    'product.inStock': 'En stock',
    'product.outOfStock': 'Sin stock',
    'product.price': 'Precio',
    'product.description': 'Descripción',
    'product.compare': 'Comparar',
    'product.reviews': 'Opiniones',
    'cart.title': 'Tu carrito',
    'cart.empty': 'Tu carrito está vacío',
    'cart.total': 'Total',
    'cart.checkout': 'Finalizar compra',
    'cart.continue': 'Seguir comprando',
    'cart.remove': 'Eliminar',
    'cart.quantity': 'Cantidad',
    'checkout.title': 'Finalizar compra',
    'checkout.address': 'Dirección de envío',
    'checkout.shipping': 'Método de envío',
    'checkout.payment': 'Pago',
    'checkout.summary': 'Resumen del pedido',
    'checkout.placeOrder': 'Realizar pedido',
    'checkout.success': 'Pedido confirmado',
    'account.title': 'Mi cuenta',
    'account.orders': 'Mis pedidos',
    'account.addresses': 'Mis direcciones',
    'account.profile': 'Perfil',
    'account.loyalty': 'Puntos de fidelidad',
    'account.wishlist': 'Lista de deseos',
    'auth.login': 'Iniciar sesión',
    'auth.register': 'Crear cuenta',
    'auth.email': 'Email',
    'auth.password': 'Contraseña',
    'auth.forgotPassword': '¿Olvidaste tu contraseña?',
    'auth.noAccount': '¿No tienes cuenta?',
    'auth.hasAccount': '¿Ya tienes cuenta?',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.add': 'Añadir',
    'common.search': 'Buscar',
    'common.filter': 'Filtrar',
    'common.loading': 'Cargando...',
    'common.error': 'Se ha producido un error',
    'common.success': 'Operación completada con éxito',
    'common.confirm': 'Confirmar',
    'common.back': 'Volver',
    'common.next': 'Siguiente',
    'common.previous': 'Anterior',
    'common.close': 'Cerrar',
    'common.yes': 'Sí',
    'common.no': 'No',
    'order.status.pending': 'Pendiente',
    'order.status.processing': 'En proceso',
    'order.status.shipped': 'Enviado',
    'order.status.delivered': 'Entregado',
    'order.status.cancelled': 'Cancelado',
    'footer.newsletter': 'Suscríbete a nuestro newsletter',
    'footer.subscribe': 'Suscribirse',
    'footer.email.placeholder': 'Tu email',
    'footer.rights': 'Todos los derechos reservados',
  },
  en: {
    'nav.home': 'Home',
    'nav.catalog': 'Catalog',
    'nav.cart': 'Cart',
    'nav.account': 'My Account',
    'nav.login': 'Login',
    'nav.logout': 'Logout',
    'nav.register': 'Register',
    'nav.wishlist': 'Wishlist',
    'nav.compare': 'Compare',
    'nav.search': 'Search',
    'home.welcome': 'Welcome',
    'home.featured': 'Featured Products',
    'home.newest': 'New Arrivals',
    'home.bestsellers': 'Best Sellers',
    'home.categories': 'Categories',
    'home.viewAll': 'View all',
    'product.addToCart': 'Add to cart',
    'product.addToWishlist': 'Add to wishlist',
    'product.inStock': 'In stock',
    'product.outOfStock': 'Out of stock',
    'product.price': 'Price',
    'product.description': 'Description',
    'product.compare': 'Compare',
    'product.reviews': 'Reviews',
    'cart.title': 'Your cart',
    'cart.empty': 'Your cart is empty',
    'cart.total': 'Total',
    'cart.checkout': 'Checkout',
    'cart.continue': 'Continue shopping',
    'cart.remove': 'Remove',
    'cart.quantity': 'Quantity',
    'checkout.title': 'Checkout',
    'checkout.address': 'Shipping address',
    'checkout.shipping': 'Shipping method',
    'checkout.payment': 'Payment',
    'checkout.summary': 'Order summary',
    'checkout.placeOrder': 'Place order',
    'checkout.success': 'Order confirmed',
    'account.title': 'My Account',
    'account.orders': 'My Orders',
    'account.addresses': 'My Addresses',
    'account.profile': 'Profile',
    'account.loyalty': 'Loyalty Points',
    'account.wishlist': 'Wishlist',
    'auth.login': 'Login',
    'auth.register': 'Create account',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.forgotPassword': 'Forgot your password?',
    'auth.noAccount': "Don't have an account?",
    'auth.hasAccount': 'Already have an account?',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.loading': 'Loading...',
    'common.error': 'An error occurred',
    'common.success': 'Operation completed successfully',
    'common.confirm': 'Confirm',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.close': 'Close',
    'common.yes': 'Yes',
    'common.no': 'No',
    'order.status.pending': 'Pending',
    'order.status.processing': 'Processing',
    'order.status.shipped': 'Shipped',
    'order.status.delivered': 'Delivered',
    'order.status.cancelled': 'Cancelled',
    'footer.newsletter': 'Subscribe to our newsletter',
    'footer.subscribe': 'Subscribe',
    'footer.email.placeholder': 'Your email',
    'footer.rights': 'All rights reserved',
  },
};

export const translationService = {
  /** Get translations for a language as a flat key-value object */
  async getByLang(lang: string): Promise<Record<string, string>> {
    const rows = await Translation.findAll({
      where: { lang_iso: lang },
      order: [['key', 'ASC']],
    });

    const result: Record<string, string> = {};
    for (const row of rows) {
      result[row.key] = row.value;
    }
    return result;
  },

  /** Bulk update translations for a language */
  async bulkUpdate(lang: string, translations: Record<string, string>): Promise<void> {
    for (const [key, value] of Object.entries(translations)) {
      await Translation.upsert({ lang_iso: lang, key, value });
    }
  },

  /** Seed translations from defaults if the table is empty */
  async seedDefaults(): Promise<void> {
    const count = await Translation.count();
    if (count > 0) return;

    logger.info('Seeding default translations...');
    const rows: Array<{ lang_iso: string; key: string; value: string }> = [];

    for (const [lang, entries] of Object.entries(DEFAULT_TRANSLATIONS)) {
      for (const [key, value] of Object.entries(entries)) {
        rows.push({ lang_iso: lang, key, value });
      }
    }

    await Translation.bulkCreate(rows);
    logger.info(`Seeded ${rows.length} translation entries`);
  },
};
