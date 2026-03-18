import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { ApiService } from '../../core/services/api.service';

interface OrderState {
  id: number;
  name: string;
  color: string;
  paid: boolean;
  shipped: boolean;
  send_email: boolean;
  invoice: boolean;
  icon: string | null;
  deleted: boolean;
}

@Component({
  selector: 'app-order-states',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatCardModule,
  ],
  template: `
    <div class="mb-6">
      <h1 class="text-2xl font-bold">Estados de pedido</h1>
      <p class="text-gray-500 text-sm mt-1">Configura los estados y sus comportamientos (como en PrestaShop)</p>
    </div>

    @if (loading) {
      <div class="flex justify-center py-12"><mat-spinner diameter="48" /></div>
    } @else {
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- List of states -->
        <div class="space-y-3">
          <h2 class="text-lg font-semibold mb-3">Estados existentes</h2>
          @for (state of states; track state.id) {
            @if (!state.deleted) {
              <div
                class="bg-white rounded-lg shadow p-4 border-l-4 cursor-pointer transition-all"
                [style.borderLeftColor]="state.color"
                [class.ring-2]="editingState?.id === state.id"
                [class.ring-blue-500]="editingState?.id === state.id"
                (click)="startEdit(state)"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <span
                      class="inline-block w-4 h-4 rounded-full border border-white/30 shadow"
                      [style.backgroundColor]="state.color"
                    ></span>
                    <span class="font-semibold">{{ state.name }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    @if (state.paid) {
                      <span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Pagado</span>
                    }
                    @if (state.shipped) {
                      <span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Enviado</span>
                    }
                    @if (state.send_email) {
                      <span class="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Email</span>
                    }
                    <button
                      mat-icon-button
                      color="warn"
                      (click)="deleteState(state.id, $event)"
                      matTooltip="Eliminar"
                      class="!w-7 !h-7"
                    >
                      <mat-icon class="!text-sm">delete</mat-icon>
                    </button>
                  </div>
                </div>
              </div>
            }
          }

          <!-- Add new state button -->
          <button mat-stroked-button color="primary" (click)="startCreate()" class="w-full mt-2">
            <mat-icon>add</mat-icon> Nuevo estado
          </button>
        </div>

        <!-- Edit / Create form -->
        @if (editingState || creatingNew) {
          <mat-card>
            <mat-card-header>
              <mat-card-title>{{ creatingNew ? 'Crear estado' : 'Editar estado' }}</mat-card-title>
            </mat-card-header>
            <mat-card-content class="space-y-4 pt-4">
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Nombre</mat-label>
                <input matInput [(ngModel)]="formData.name" name="stateName" required />
              </mat-form-field>

              <div class="flex items-center gap-4">
                <mat-form-field appearance="outline" class="w-40">
                  <mat-label>Color</mat-label>
                  <input matInput [(ngModel)]="formData.color" name="stateColor" type="color" />
                </mat-form-field>
                <div
                  class="flex-1 h-10 rounded-lg border text-white text-sm font-semibold flex items-center justify-center"
                  [style.backgroundColor]="formData.color"
                >
                  {{ formData.name || 'Vista previa' }}
                </div>
              </div>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Icono (nombre Material Icon)</mat-label>
                <input matInput [(ngModel)]="formData.icon" name="stateIcon" placeholder="ej: local_shipping" />
                @if (formData.icon) {
                  <mat-icon matSuffix>{{ formData.icon }}</mat-icon>
                }
              </mat-form-field>

              <div class="grid grid-cols-2 gap-4">
                <mat-slide-toggle [(ngModel)]="formData.paid" name="statePaid" color="primary">
                  Marcar como pagado
                </mat-slide-toggle>
                <mat-slide-toggle [(ngModel)]="formData.shipped" name="stateShipped" color="primary">
                  Marcar como enviado
                </mat-slide-toggle>
                <mat-slide-toggle [(ngModel)]="formData.send_email" name="stateSendEmail" color="primary">
                  Enviar email al cliente
                </mat-slide-toggle>
                <mat-slide-toggle [(ngModel)]="formData.invoice" name="stateInvoice" color="primary">
                  Genera factura
                </mat-slide-toggle>
              </div>
            </mat-card-content>
            <mat-card-actions align="end" class="px-4 pb-4 gap-2">
              <button mat-button (click)="cancelEdit()">Cancelar</button>
              <button mat-flat-button color="primary" (click)="save()" [disabled]="saving">
                @if (saving) { <mat-spinner diameter="18" class="inline-block mr-1" /> }
                {{ creatingNew ? 'Crear' : 'Guardar' }}
              </button>
            </mat-card-actions>
          </mat-card>
        }
      </div>
    }
  `,
})
export class OrderStatesComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly snack = inject(MatSnackBar);

  states: OrderState[] = [];
  loading = true;
  saving = false;
  editingState: OrderState | null = null;
  creatingNew = false;

  formData = this.emptyForm();

  ngOnInit(): void {
    this.loadStates();
  }

  loadStates(): void {
    this.loading = true;
    this.api.get<{ success: boolean; data: OrderState[] }>('/orders/states').subscribe({
      next: (res) => {
        this.states = res.data;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  startEdit(state: OrderState): void {
    this.editingState = state;
    this.creatingNew = false;
    this.formData = {
      name: state.name,
      color: state.color,
      paid: state.paid,
      shipped: state.shipped,
      send_email: state.send_email,
      invoice: state.invoice,
      icon: state.icon ?? '',
    };
  }

  startCreate(): void {
    this.creatingNew = true;
    this.editingState = null;
    this.formData = this.emptyForm();
  }

  cancelEdit(): void {
    this.editingState = null;
    this.creatingNew = false;
  }

  save(): void {
    if (!this.formData.name.trim()) return;
    this.saving = true;
    const payload = {
      ...this.formData,
      icon: this.formData.icon || null,
    };

    const obs = this.creatingNew
      ? this.api.post('/orders/admin/states', payload)
      : this.api.put(`/orders/admin/states/${this.editingState!.id}`, payload);

    obs.subscribe({
      next: () => {
        this.snack.open(this.creatingNew ? 'Estado creado' : 'Estado actualizado', 'OK', { duration: 2000 });
        this.cancelEdit();
        this.loadStates();
        this.saving = false;
      },
      error: () => {
        this.snack.open('Error al guardar', 'Cerrar', { duration: 3000 });
        this.saving = false;
      },
    });
  }

  deleteState(id: number, event: Event): void {
    event.stopPropagation();
    if (!confirm('¿Eliminar este estado?')) return;
    this.api.delete(`/orders/admin/states/${id}`).subscribe({
      next: () => {
        this.snack.open('Estado eliminado', 'OK', { duration: 2000 });
        this.loadStates();
      },
      error: () => this.snack.open('Error al eliminar', 'Cerrar', { duration: 3000 }),
    });
  }

  private emptyForm() {
    return { name: '', color: '#777777', paid: false, shipped: false, send_email: false, invoice: false, icon: '' };
  }
}
