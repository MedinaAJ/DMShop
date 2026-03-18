import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../core/services/api.service';

type ReturnState = 'waiting' | 'confirmed' | 'received' | 'rejected';

interface ReturnSummary {
  id: number;
  state: ReturnState;
  reason: string | null;
  customer_note: string | null;
  admin_note: string | null;
  created_at: string;
  order?: { id: number; reference: string };
  user?: { id: number; firstName: string; lastName: string; email: string };
  items: Array<{
    id: number;
    quantity: number;
    reason: string | null;
    orderItem?: { id_product: number; product_name?: string; productName?: string; quantity: number };
  }>;
}

const STATE_LABELS: Record<ReturnState, string> = {
  waiting: 'Pendiente',
  confirmed: 'Confirmada',
  received: 'Recibida',
  rejected: 'Rechazada',
};

const STATE_COLORS: Record<ReturnState, string> = {
  waiting: '#f59e0b',
  confirmed: '#3b82f6',
  received: '#10b981',
  rejected: '#ef4444',
};

@Component({
  selector: 'app-returns-list',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatTableModule,
    MatChipsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    DatePipe,
  ],
  template: `
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Devoluciones (RMA)</h1>
        <p class="text-gray-500 text-sm mt-1">Gestión de solicitudes de devolución</p>
      </div>
    </div>

    <!-- Filter by state -->
    <div class="mb-4 flex gap-3 flex-wrap">
      @for (s of stateOptions; track s.value) {
        <button
          mat-stroked-button
          [style.borderColor]="s.color"
          [style.color]="filterState === s.value ? 'white' : s.color"
          [style.backgroundColor]="filterState === s.value ? s.color : 'transparent'"
          (click)="setFilter(s.value)"
        >
          {{ s.label }}
        </button>
      }
      <button mat-button (click)="setFilter('')">Todos</button>
    </div>

    @if (loading) {
      <div class="flex justify-center py-12"><mat-spinner diameter="48" /></div>
    } @else if (returns.length === 0) {
      <div class="text-center py-12 text-gray-500">
        <mat-icon class="!text-5xl mb-3 text-gray-300">assignment_return</mat-icon>
        <p>No hay devoluciones</p>
      </div>
    } @else {
      <div class="space-y-4">
        @for (ret of returns; track ret.id) {
          <mat-card>
            <mat-card-content class="pt-4">
              <div class="flex items-start justify-between mb-3">
                <div>
                  <div class="flex items-center gap-3 mb-1">
                    <span class="font-bold text-lg">#{{ ret.id }}</span>
                    <span
                      class="px-2 py-0.5 rounded text-white text-xs font-semibold"
                      [style.backgroundColor]="getStateColor(ret.state)"
                    >
                      {{ getStateLabel(ret.state) }}
                    </span>
                  </div>
                  <p class="text-sm text-gray-600">
                    Pedido: <strong>#{{ ret.order?.reference }}</strong> ·
                    Cliente: {{ ret.user?.firstName }} {{ ret.user?.lastName }} ({{ ret.user?.email }})
                  </p>
                  <p class="text-xs text-gray-400 mt-0.5">{{ ret.created_at | date:'dd/MM/yyyy HH:mm' }}</p>
                </div>
                <!-- State selector -->
                <mat-form-field appearance="outline" class="!w-48">
                  <mat-label>Cambiar estado</mat-label>
                  <mat-select [value]="ret.state" (selectionChange)="changeState(ret.id, $event.value)">
                    @for (s of stateOptions; track s.value) {
                      <mat-option [value]="s.value">{{ s.label }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              </div>

              @if (ret.reason) {
                <p class="text-sm"><strong>Motivo:</strong> {{ ret.reason }}</p>
              }
              @if (ret.customer_note) {
                <p class="text-sm text-gray-600"><strong>Nota cliente:</strong> {{ ret.customer_note }}</p>
              }

              <!-- Items -->
              @if (ret.items && ret.items.length > 0) {
                <div class="mt-3">
                  <p class="text-xs font-semibold text-gray-500 uppercase mb-1">Artículos</p>
                  @for (item of ret.items; track item.id) {
                    <div class="text-sm flex items-center gap-2 py-1 border-b border-gray-100 last:border-0">
                      <mat-icon class="!text-base text-gray-400">inventory_2</mat-icon>
                      <span>{{ item.orderItem?.product_name ?? item.orderItem?.productName ?? '—' }}</span>
                      <span class="text-gray-400">× {{ item.quantity }}</span>
                      @if (item.reason) {
                        <span class="text-gray-500 text-xs">({{ item.reason }})</span>
                      }
                    </div>
                  }
                </div>
              }

              <!-- Admin note -->
              <div class="mt-3">
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Nota interna</mat-label>
                  <textarea
                    matInput
                    [value]="ret.admin_note ?? ''"
                    #adminNoteInput
                    rows="2"
                  ></textarea>
                </mat-form-field>
                <button mat-stroked-button (click)="saveAdminNote(ret.id, adminNoteInput.value)">
                  <mat-icon>save</mat-icon> Guardar nota
                </button>
              </div>
            </mat-card-content>
          </mat-card>
        }
      </div>
    }
  `,
})
export class ReturnsListComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly snack = inject(MatSnackBar);

  returns: ReturnSummary[] = [];
  loading = true;
  filterState = '';

  readonly stateOptions = [
    { value: 'waiting', label: 'Pendiente', color: STATE_COLORS.waiting },
    { value: 'confirmed', label: 'Confirmada', color: STATE_COLORS.confirmed },
    { value: 'received', label: 'Recibida', color: STATE_COLORS.received },
    { value: 'rejected', label: 'Rechazada', color: STATE_COLORS.rejected },
  ];

  ngOnInit(): void {
    this.loadReturns();
  }

  setFilter(state: string): void {
    this.filterState = state;
    this.loadReturns();
  }

  loadReturns(): void {
    this.loading = true;
    const params: any = { limit: 50 };
    if (this.filterState) params.state = this.filterState;
    this.api.get<{ success: boolean; data: ReturnSummary[]; meta: any }>('/returns', params).subscribe({
      next: (res) => {
        this.returns = res.data;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  changeState(returnId: number, state: ReturnState): void {
    this.api.patch<{ success: boolean }>(`/returns/${returnId}/state`, { state }).subscribe({
      next: () => {
        this.snack.open('Estado actualizado', 'OK', { duration: 2000 });
        const ret = this.returns.find((r) => r.id === returnId);
        if (ret) ret.state = state;
      },
      error: () => this.snack.open('Error al actualizar estado', 'Cerrar', { duration: 3000 }),
    });
  }

  saveAdminNote(returnId: number, note: string): void {
    this.api.patch<{ success: boolean }>(`/returns/${returnId}/state`, { admin_note: note }).subscribe({
      next: () => {
        this.snack.open('Nota guardada', 'OK', { duration: 2000 });
      },
      error: () => this.snack.open('Error al guardar nota', 'Cerrar', { duration: 3000 }),
    });
  }

  getStateLabel(state: ReturnState): string {
    return STATE_LABELS[state] ?? state;
  }

  getStateColor(state: ReturnState): string {
    return STATE_COLORS[state] ?? '#777';
  }
}
