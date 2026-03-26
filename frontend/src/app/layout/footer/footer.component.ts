import { Component, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule],
  template: `
    <footer class="bg-gray-900 text-gray-300 mt-auto">
      <!-- Newsletter banner -->
      <div class="bg-gradient-to-r from-blue-800 to-indigo-900 py-8">
        <div class="max-w-4xl mx-auto px-4 text-center">
          <h3 class="text-white text-xl font-bold mb-1">📬 Suscríbete a nuestro newsletter</h3>
          <p class="text-blue-200 text-sm mb-4">Recibe las últimas novedades y ofertas exclusivas.</p>

          @if (subscribeSuccess()) {
            <div class="bg-green-600 text-white py-3 px-6 rounded-lg inline-block">
              ✅ ¡Gracias! Ya estás suscrito.
            </div>
          } @else {
            <form (ngSubmit)="subscribe()" class="flex flex-col sm:flex-row gap-2 justify-center max-w-md mx-auto">
              <input
                type="email"
                [(ngModel)]="email"
                name="email"
                required
                placeholder="Tu dirección de email"
                class="flex-1 px-4 py-2 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="submit"
                class="bg-white text-blue-800 font-semibold px-6 py-2 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
                [disabled]="subscribing()"
              >
                {{ subscribing() ? 'Suscribiendo...' : 'Suscribirme' }}
              </button>
            </form>
            @if (subscribeError()) {
              <p class="text-red-400 text-sm mt-2">{{ subscribeError() }}</p>
            }
          }
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 class="text-white text-lg font-semibold mb-3">DMShop</h3>
          <p class="text-sm">E-commerce open source desarrollado con Angular y Node.js.</p>
        </div>
        <div>
          <h4 class="text-white font-semibold mb-3">Tienda</h4>
          <nav class="flex flex-col gap-1 text-sm">
            <a routerLink="/" class="hover:text-white transition-colors">Inicio</a>
            <a routerLink="/catalog" class="hover:text-white transition-colors">Catálogo</a>
            <a routerLink="/cart" class="hover:text-white transition-colors">Carrito</a>
          </nav>
        </div>
        <div>
          <h4 class="text-white font-semibold mb-3">Mi cuenta</h4>
          <nav class="flex flex-col gap-1 text-sm">
            <a routerLink="/auth/login" class="hover:text-white transition-colors">Iniciar sesión</a>
            <a routerLink="/auth/register" class="hover:text-white transition-colors">Registrarse</a>
            <a routerLink="/account/orders" class="hover:text-white transition-colors">Mis pedidos</a>
            <a routerLink="/account/wishlist" class="hover:text-white transition-colors">Lista de deseos</a>
            <a routerLink="/account/affiliate" class="hover:text-white transition-colors">Programa de afiliados</a>
          </nav>
        </div>
        <div>
          <h4 class="text-white font-semibold mb-3">Información</h4>
          <nav class="flex flex-col gap-1 text-sm">
            <a routerLink="/paginas/sobre-nosotros" class="hover:text-white transition-colors">Sobre nosotros</a>
            <a routerLink="/paginas/aviso-legal" class="hover:text-white transition-colors">Aviso legal</a>
            <a routerLink="/paginas/politica-privacidad" class="hover:text-white transition-colors">Política de privacidad</a>
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
  private readonly api = inject(ApiService);

  readonly currentYear = new Date().getFullYear();

  email = '';
  readonly subscribing = signal(false);
  readonly subscribeSuccess = signal(false);
  readonly subscribeError = signal<string | null>(null);

  subscribe(): void {
    if (!this.email || !this.email.includes('@')) return;
    this.subscribing.set(true);
    this.subscribeError.set(null);

    this.api
      .post<{ success: boolean; data: any }>('/newsletter/subscribe', { email: this.email, source: 'footer' })
      .pipe(catchError((err) => of({ success: false, error: err?.error?.message })))
      .subscribe((res: any) => {
        this.subscribing.set(false);
        if (res.success) {
          this.subscribeSuccess.set(true);
        } else {
          this.subscribeError.set(res.error ?? 'No se pudo completar la suscripción. Inténtalo de nuevo.');
        }
      });
  }
}
