import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-address-list',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-semibold">Mis direcciones</h2>
      <a mat-flat-button color="primary" routerLink="/account/addresses/new">
        <mat-icon>add</mat-icon> Nueva dirección
      </a>
    </div>

    @if (loading) {
      <div class="flex justify-center py-12"><mat-spinner diameter="40" /></div>
    } @else if (!addresses.length) {
      <p class="text-gray-500">No tienes direcciones guardadas.</p>
    } @else {
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        @for (addr of addresses; track addr.id) {
          <mat-card>
            <mat-card-header>
              <mat-icon mat-card-avatar class="!text-blue-600">location_on</mat-icon>
              <mat-card-title>{{ addr.alias }}</mat-card-title>
              <mat-card-subtitle>{{ addr.firstName }} {{ addr.lastName }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content class="mt-3 text-sm text-gray-600 space-y-1">
              <p>{{ addr.address1 }}</p>
              @if (addr.address2) {
                <p>{{ addr.address2 }}</p>
              }
              <p>{{ addr.postcode }} {{ addr.city }}</p>
              <p>{{ addr.country?.name || '' }}</p>
              @if (addr.phone || addr.phoneMobile) {
                <p class="pt-1">
                  @if (addr.phoneMobile) {
                    <span>📱 {{ addr.phoneMobile }}</span>
                  }
                  @if (addr.phone) {
                    <span class="ml-3">📞 {{ addr.phone }}</span>
                  }
                </p>
              }
            </mat-card-content>
            <mat-card-actions class="!px-4 !pb-3">
              <a mat-button [routerLink]="['/account/addresses', addr.id]">
                <mat-icon>edit</mat-icon> Editar
              </a>
              <button mat-button color="warn" (click)="deleteAddress(addr.id)">
                <mat-icon>delete</mat-icon> Eliminar
              </button>
            </mat-card-actions>
          </mat-card>
        }
      </div>
    }
  `,
})
export class AddressListComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly snackBar = inject(MatSnackBar);

  addresses: any[] = [];
  loading = true;

  ngOnInit(): void {
    this.loadAddresses();
  }

  private loadAddresses(): void {
    this.api.get<any>('/addresses').subscribe({
      next: (res) => {
        this.addresses = res.data || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  deleteAddress(id: number): void {
    if (!confirm('¿Eliminar esta dirección?')) return;
    this.api.delete(`/addresses/${id}`).subscribe({
      next: () => {
        this.addresses = this.addresses.filter((a) => a.id !== id);
        this.snackBar.open('Dirección eliminada', 'OK', { duration: 2000 });
      },
      error: () => this.snackBar.open('Error al eliminar', 'Cerrar', { duration: 3000 }),
    });
  }
}
