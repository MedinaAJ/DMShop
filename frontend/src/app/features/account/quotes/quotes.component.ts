import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../../core/services/api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-quotes',
  standalone: true,
  imports: [RouterLink, FormsModule, MatButtonModule, MatIconModule, MatProgressSpinner, DatePipe, CurrencyPipe, MatSnackBarModule],
  template: `
    <div class="space-y-6">
      <h2 class="text-xl font-bold">Mis presupuestos</h2>

      @if (loading()) {
        <div class="flex justify-center py-12"><mat-spinner diameter="36" /></div>
      } @else if (quotes().length === 0) {
        <div class="text-center py-12 text-gray-500">
          <mat-icon class="!text-5xl mb-2">request_quote</mat-icon>
          <p>No tienes presupuestos.</p>
          <a mat-flat-button color="primary" routerLink="/cart" class="mt-4">Ver mi carrito</a>
        </div>
      } @else {
        <div class="space-y-3">
          @for (quote of quotes(); track quote.id) {
            <div class="bg-white border rounded-lg p-4 cursor-pointer hover:shadow-md transition"
                 (click)="openQuote(quote.id)">
              <div class="flex justify-between items-start">
                <div>
                  <p class="font-medium">Presupuesto #{{ quote.id }}</p>
                  <p class="text-sm text-gray-500 mt-1">
                    {{ quote.total | currency: 'EUR' }} · {{ quote.createdAt | date: 'dd/MM/yyyy' }}
                  </p>
                  @if (quote.expires_at) {
                    <p class="text-xs text-gray-400">Válido hasta {{ quote.expires_at | date: 'dd/MM/yyyy' }}</p>
                  }
                </div>
                <span class="text-xs font-semibold px-2 py-1 rounded-full"
                      [class.bg-amber-100]="quote.status === 'pending'"
                      [class.text-amber-700]="quote.status === 'pending'"
                      [class.bg-blue-100]="quote.status === 'sent'"
                      [class.text-blue-700]="quote.status === 'sent'"
                      [class.bg-green-100]="quote.status === 'accepted'"
                      [class.text-green-700]="quote.status === 'accepted'"
                      [class.bg-gray-100]="['rejected','expired'].includes(quote.status)"
                      [class.text-gray-600]="['rejected','expired'].includes(quote.status)">
                  {{ statusLabel(quote.status) }}
                </span>
              </div>
            </div>
          }
        </div>
      }

      <!-- Quote detail modal -->
      @if (selectedQuote()) {
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click.self)="selectedQuote.set(null)">
          <div class="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center p-4 border-b">
              <h3 class="font-bold text-lg">Presupuesto #{{ selectedQuote()!.id }}</h3>
              <button mat-icon-button (click)="selectedQuote.set(null)"><mat-icon>close</mat-icon></button>
            </div>
            <div class="p-4 space-y-4">
              @for (item of selectedQuote()!.items; track item.id) {
                <div class="flex justify-between py-2 border-b">
                  <div>
                    <p class="font-medium">{{ item.product?.translations?.[0]?.name ?? 'Producto' }}</p>
                    <p class="text-sm text-gray-500">Cantidad: {{ item.quantity }} × {{ item.unit_price | currency: 'EUR' }}</p>
                  </div>
                  <span class="font-semibold">{{ item.total | currency: 'EUR' }}</span>
                </div>
              }
              <div class="flex justify-between font-bold text-lg pt-2">
                <span>Total</span>
                <span>{{ selectedQuote()!.total | currency: 'EUR' }}</span>
              </div>
              @if (selectedQuote()!.notes) {
                <div class="bg-gray-50 rounded-lg p-3">
                  <p class="text-sm text-gray-700"><strong>Notas:</strong> {{ selectedQuote()!.notes }}</p>
                </div>
              }
              @if (selectedQuote()!.status === 'sent') {
                <button mat-flat-button color="primary" class="w-full" [disabled]="accepting()" (click)="acceptQuote()">
                  @if (accepting()) { <mat-spinner diameter="18" class="inline-block mr-1" /> }
                  <mat-icon>check</mat-icon> Aceptar presupuesto
                </button>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class QuotesComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly snackBar = inject(MatSnackBar);

  loading = signal(true);
  accepting = signal(false);
  quotes = signal<any[]>([]);
  selectedQuote = signal<any | null>(null);

  async ngOnInit() {
    await this.loadQuotes();
  }

  async loadQuotes() {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(this.api.get<any>('/quotes'));
      this.quotes.set(res.data ?? []);
    } finally {
      this.loading.set(false);
    }
  }

  async openQuote(id: number) {
    try {
      const res = await firstValueFrom(this.api.get<any>(`/quotes/${id}`));
      this.selectedQuote.set(res.data);
    } catch {
      this.snackBar.open('Error al cargar el presupuesto', 'OK', { duration: 3000 });
    }
  }

  async acceptQuote() {
    const quote = this.selectedQuote();
    if (!quote) return;
    this.accepting.set(true);
    try {
      await firstValueFrom(this.api.post(`/quotes/${quote.id}/accept`, {}));
      this.snackBar.open('Presupuesto aceptado', 'OK', { duration: 3000 });
      this.selectedQuote.set(null);
      await this.loadQuotes();
    } catch {
      this.snackBar.open('Error al aceptar el presupuesto', 'OK', { duration: 3000 });
    } finally {
      this.accepting.set(false);
    }
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pendiente', sent: 'Enviado', accepted: 'Aceptado',
      rejected: 'Rechazado', expired: 'Expirado',
    };
    return labels[status] ?? status;
  }
}
