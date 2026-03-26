import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-admin-quotes',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTableModule, MatSelectModule, MatFormFieldModule, MatSnackBarModule, MatTooltipModule, DatePipe, CurrencyPipe],
  template: `
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Presupuestos</h1>
    </div>

    <div class="flex gap-3 mb-4">
      <mat-form-field appearance="outline" class="w-48">
        <mat-label>Estado</mat-label>
        <mat-select [(ngModel)]="filterStatus" (ngModelChange)="loadQuotes()">
          <mat-option value="">Todos</mat-option>
          <mat-option value="pending">Pendientes</mat-option>
          <mat-option value="sent">Enviados</mat-option>
          <mat-option value="accepted">Aceptados</mat-option>
          <mat-option value="rejected">Rechazados</mat-option>
          <mat-option value="expired">Expirados</mat-option>
        </mat-select>
      </mat-form-field>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-12"><mat-spinner diameter="48" /></div>
    } @else {
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table mat-table [dataSource]="quotes()" class="w-full">
          <ng-container matColumnDef="id">
            <th mat-header-cell *matHeaderCellDef>#</th>
            <td mat-cell *matCellDef="let q">{{ q.id }}</td>
          </ng-container>
          <ng-container matColumnDef="customer">
            <th mat-header-cell *matHeaderCellDef>Cliente</th>
            <td mat-cell *matCellDef="let q">{{ q.user?.first_name }} {{ q.user?.last_name }}<br/><span class="text-xs text-gray-400">{{ q.user?.email }}</span></td>
          </ng-container>
          <ng-container matColumnDef="total">
            <th mat-header-cell *matHeaderCellDef>Total</th>
            <td mat-cell *matCellDef="let q">{{ q.total | currency: 'EUR' }}</td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let q">
              <span class="text-xs font-semibold px-2 py-1 rounded-full"
                    [class.bg-amber-100]="q.status === 'pending'"
                    [class.text-amber-700]="q.status === 'pending'"
                    [class.bg-blue-100]="q.status === 'sent'"
                    [class.text-blue-700]="q.status === 'sent'"
                    [class.bg-green-100]="q.status === 'accepted'"
                    [class.text-green-700]="q.status === 'accepted'"
                    [class.bg-gray-100]="['rejected','expired'].includes(q.status)"
                    [class.text-gray-600]="['rejected','expired'].includes(q.status)">
                {{ statusLabel(q.status) }}
              </span>
            </td>
          </ng-container>
          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef>Fecha</th>
            <td mat-cell *matCellDef="let q">{{ q.createdAt | date: 'dd/MM/yyyy' }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let q">
              <button mat-icon-button (click)="openQuote(q.id)" matTooltip="Ver presupuesto"><mat-icon>visibility</mat-icon></button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns" class="cursor-pointer hover:bg-gray-50" (click)="openQuote(row.id)"></tr>
        </table>
        @if (quotes().length === 0) {
          <div class="text-center py-12 text-gray-500">No hay presupuestos</div>
        }
      </div>
    }

    <!-- Quote detail modal -->
    @if (selectedQuote()) {
      <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click.self)="selectedQuote.set(null)">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
          <div class="flex justify-between items-center p-4 border-b">
            <div>
              <h3 class="font-bold">Presupuesto #{{ selectedQuote()!.id }}</h3>
              <p class="text-sm text-gray-500">{{ selectedQuote()!.user?.first_name }} {{ selectedQuote()!.user?.last_name }} · {{ selectedQuote()!.user?.email }}</p>
            </div>
            <div class="flex gap-2 items-center">
              <mat-form-field appearance="outline" class="w-36" subscriptSizing="dynamic">
                <mat-select [(ngModel)]="editStatus" (ngModelChange)="updateQuote()">
                  <mat-option value="pending">Pendiente</mat-option>
                  <mat-option value="sent">Enviado</mat-option>
                  <mat-option value="accepted">Aceptado</mat-option>
                  <mat-option value="rejected">Rechazado</mat-option>
                  <mat-option value="expired">Expirado</mat-option>
                </mat-select>
              </mat-form-field>
              <button mat-icon-button (click)="selectedQuote.set(null)"><mat-icon>close</mat-icon></button>
            </div>
          </div>
          <div class="p-4 space-y-3">
            @for (item of selectedQuote()!.items; track item.id) {
              <div class="flex justify-between py-2 border-b">
                <div>
                  <p class="font-medium">{{ item.product?.translations?.[0]?.name ?? 'Producto #' + item.id_product }}</p>
                  <p class="text-sm text-gray-500">{{ item.quantity }} × {{ item.unit_price | currency: 'EUR' }}</p>
                </div>
                <span>{{ item.total | currency: 'EUR' }}</span>
              </div>
            }
            <div class="flex justify-between font-bold pt-2">
              <span>Total</span>
              <span>{{ selectedQuote()!.total | currency: 'EUR' }}</span>
            </div>
            @if (selectedQuote()!.status === 'accepted') {
              <button mat-flat-button color="warn" (click)="convertToOrder()">
                <mat-icon>swap_horiz</mat-icon> Convertir a pedido
              </button>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class AdminQuotesComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly snackBar = inject(MatSnackBar);

  loading = signal(true);
  quotes = signal<any[]>([]);
  selectedQuote = signal<any | null>(null);

  columns = ['id', 'customer', 'total', 'status', 'date', 'actions'];
  filterStatus = '';
  editStatus = 'pending';

  async ngOnInit() {
    await this.loadQuotes();
  }

  async loadQuotes() {
    this.loading.set(true);
    try {
      const params: any = { page: 1, perPage: 50 };
      if (this.filterStatus) params.status = this.filterStatus;
      const res = await firstValueFrom(this.api.get<any>('/admin/quotes', params));
      this.quotes.set(res.data ?? []);
    } finally {
      this.loading.set(false);
    }
  }

  async openQuote(id: number) {
    try {
      const res = await firstValueFrom(this.api.get<any>(`/admin/quotes/${id}`));
      this.selectedQuote.set(res.data);
      this.editStatus = res.data.status;
    } catch {
      this.snackBar.open('Error al cargar el presupuesto', 'OK', { duration: 3000 });
    }
  }

  async updateQuote() {
    const quote = this.selectedQuote();
    if (!quote) return;
    try {
      await firstValueFrom(this.api.put(`/admin/quotes/${quote.id}`, { status: this.editStatus }));
      this.selectedQuote.set({ ...quote, status: this.editStatus });
      await this.loadQuotes();
      this.snackBar.open('Presupuesto actualizado', 'OK', { duration: 2000 });
    } catch {
      this.snackBar.open('Error al actualizar', 'OK', { duration: 3000 });
    }
  }

  async convertToOrder() {
    const quote = this.selectedQuote();
    if (!quote) return;
    try {
      await firstValueFrom(this.api.post(`/admin/quotes/${quote.id}/convert-to-order`, {}));
      this.selectedQuote.set(null);
      this.snackBar.open('Presupuesto convertido', 'OK', { duration: 3000 });
      await this.loadQuotes();
    } catch {
      this.snackBar.open('Error al convertir', 'OK', { duration: 3000 });
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
