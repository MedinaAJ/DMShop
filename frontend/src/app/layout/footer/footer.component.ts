import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="bg-gray-900 text-gray-300 mt-auto">
      <div class="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 class="text-white text-lg font-semibold mb-3">DMShop</h3>
          <p class="text-sm">E-commerce open source desarrollado con Angular y Node.js.</p>
        </div>
        <div>
          <h4 class="text-white font-semibold mb-3">Enlaces</h4>
          <nav class="flex flex-col gap-1 text-sm">
            <a routerLink="/" class="hover:text-white transition-colors">Inicio</a>
            <a routerLink="/catalog" class="hover:text-white transition-colors">Catálogo</a>
            <a routerLink="/cart" class="hover:text-white transition-colors">Carrito</a>
          </nav>
        </div>
        <div>
          <h4 class="text-white font-semibold mb-3">Mi cuenta</h4>
          <nav class="flex flex-col gap-1 text-sm">
            <a routerLink="/auth/login" class="hover:text-white transition-colors"
              >Iniciar sesión</a
            >
            <a routerLink="/auth/register" class="hover:text-white transition-colors"
              >Registrarse</a
            >
            <a routerLink="/account/orders" class="hover:text-white transition-colors"
              >Mis pedidos</a
            >
          </nav>
        </div>
      </div>
      <div class="border-t border-gray-700 py-4 text-center text-sm text-gray-500">
        &copy; {{ currentYear }} DMShop. Todos los derechos reservados.
      </div>
    </footer>
  `,
})
export class FooterComponent {
  readonly currentYear = new Date().getFullYear();
}
