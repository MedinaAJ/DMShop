import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatCardModule, MatIconModule],
  template: `
    <h1 class="text-2xl font-bold mb-6">Dashboard</h1>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <mat-card>
        <mat-card-content class="flex items-center gap-4 !pt-4">
          <mat-icon class="!text-4xl text-blue-500">shopping_cart</mat-icon>
          <div>
            <p class="text-2xl font-bold">0</p>
            <p class="text-gray-500">Pedidos hoy</p>
          </div>
        </mat-card-content>
      </mat-card>
      <mat-card>
        <mat-card-content class="flex items-center gap-4 !pt-4">
          <mat-icon class="!text-4xl text-green-500">euro</mat-icon>
          <div>
            <p class="text-2xl font-bold">0,00 €</p>
            <p class="text-gray-500">Ventas hoy</p>
          </div>
        </mat-card-content>
      </mat-card>
      <mat-card>
        <mat-card-content class="flex items-center gap-4 !pt-4">
          <mat-icon class="!text-4xl text-orange-500">inventory_2</mat-icon>
          <div>
            <p class="text-2xl font-bold">0</p>
            <p class="text-gray-500">Productos</p>
          </div>
        </mat-card-content>
      </mat-card>
      <mat-card>
        <mat-card-content class="flex items-center gap-4 !pt-4">
          <mat-icon class="!text-4xl text-purple-500">people</mat-icon>
          <div>
            <p class="text-2xl font-bold">0</p>
            <p class="text-gray-500">Clientes</p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
})
export class DashboardComponent {}
