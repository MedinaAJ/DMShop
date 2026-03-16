import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <h1 class="text-2xl font-bold mb-6">Pedidos</h1>
    <div class="text-center py-16">
      <mat-icon class="!text-6xl text-gray-300 mb-4">receipt_long</mat-icon>
      <p class="text-gray-500">
        No hay pedidos aún. Los pedidos aparecerán aquí cuando los clientes compren.
      </p>
    </div>
  `,
})
export class OrderListComponent {}
