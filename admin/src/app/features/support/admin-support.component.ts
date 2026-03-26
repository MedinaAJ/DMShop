import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    DatePipe,
  ],
  template: `
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Soporte al cliente</h1>
    </div>

    <!-- Filters -->
    <div class="flex gap-3 mb-4 flex-wrap">
      <mat-form-field appearance="outline" class="w-48">
        <mat-label>Estado</mat-label>
        <mat-select [(ngModel)]="filterStatus" (ngModelChange)="loadTickets()">
          <mat-option value="">Todos</mat-option>
          <mat-option value="open">Abiertos</mat-option>
          <mat-option value="pending">Pendientes</mat-option>
          <mat-option value="closed">Cerrados</mat-option>
        </mat-select>
      </mat-form-field>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-12"><mat-spinner diameter="48" /></div>
    } @else {
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table mat-table [dataSource]="tickets()" class="w-full">
          <ng-container matColumnDef="id">
            <th mat-header-cell *matHeaderCellDef>#</th>
            <td mat-cell *matCellDef="let t">{{ t.id }}</td>
          </ng-container>
          <ng-container matColumnDef="subject">
            <th mat-header-cell *matHeaderCellDef>Asunto</th>
            <td mat-cell *matCellDef="let t" class="max-w-xs truncate">{{ t.subject }}</td>
          </ng-container>
          <ng-container matColumnDef="customer">
            <th mat-header-cell *matHeaderCellDef>Cliente</th>
            <td mat-cell *matCellDef="let t">{{ t.user?.first_name }} {{ t.user?.last_name }}</td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let t">
              <span class="text-xs font-semibold px-2 py-1 rounded-full"
                    [class.bg-green-100]="t.status === 'open'"
                    [class.text-green-700]="t.status === 'open'"
                    [class.bg-amber-100]="t.status === 'pending'"
                    [class.text-amber-700]="t.status === 'pending'"
                    [class.bg-gray-100]="t.status === 'closed'"
                    [class.text-gray-600]="t.status === 'closed'">
                {{ statusLabel(t.status) }}
              </span>
            </td>
          </ng-container>
          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef>Fecha</th>
            <td mat-cell *matCellDef="let t">{{ t.updatedAt | date: 'dd/MM/yyyy HH:mm' }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let t">
              <button mat-icon-button (click)="openTicket(t.id)" title="Ver ticket">
                <mat-icon>open_in_new</mat-icon>
              </button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns" class="cursor-pointer hover:bg-gray-50" (click)="openTicket(row.id)"></tr>
        </table>
        @if (tickets().length === 0) {
          <div class="text-center py-12 text-gray-500">No hay tickets con los filtros seleccionados</div>
        }
      </div>
    }

    <!-- Ticket detail panel -->
    @if (selectedTicket()) {
      <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click.self)="selectedTicket.set(null)">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          <div class="flex justify-between items-center p-4 border-b">
            <div class="flex-1">
              <h3 class="font-bold">{{ selectedTicket()!.subject }}</h3>
              <p class="text-sm text-gray-500">
                #{{ selectedTicket()!.id }} · {{ selectedTicket()!.user?.first_name }} {{ selectedTicket()!.user?.last_name }}
                ({{ selectedTicket()!.user?.email }})
              </p>
            </div>
            <div class="flex gap-2 items-center">
              <mat-form-field appearance="outline" class="w-36 !text-sm" subscriptSizing="dynamic">
                <mat-select [(ngModel)]="newStatus" (ngModelChange)="updateStatus()">
                  <mat-option value="open">Abierto</mat-option>
                  <mat-option value="pending">Pendiente</mat-option>
                  <mat-option value="closed">Cerrado</mat-option>
                </mat-select>
              </mat-form-field>
              <button mat-icon-button (click)="selectedTicket.set(null)"><mat-icon>close</mat-icon></button>
            </div>
          </div>
          <div class="flex-1 overflow-y-auto p-4 space-y-3">
            @for (msg of selectedTicket()!.messages; track msg.id) {
              <div [class.flex-row-reverse]="msg.is_admin" class="flex gap-3">
                <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                     [class.bg-blue-600]="msg.is_admin" [class.bg-gray-200]="!msg.is_admin">
                  <mat-icon class="!text-sm" [class.text-white]="msg.is_admin">{{ msg.is_admin ? 'support_agent' : 'person' }}</mat-icon>
                </div>
                <div class="max-w-sm rounded-lg p-3 text-sm"
                     [class.bg-blue-600]="msg.is_admin" [class.text-white]="msg.is_admin"
                     [class.bg-gray-100]="!msg.is_admin">
                  <p>{{ msg.message }}</p>
                  <p class="text-xs mt-1 opacity-60">{{ msg.createdAt | date: 'dd/MM/yyyy HH:mm' }}</p>
                </div>
              </div>
            }
          </div>
          <div class="p-4 border-t flex gap-2">
            <textarea [(ngModel)]="replyText" rows="2" placeholder="Escribe tu respuesta..."
                      class="flex-1 border rounded-lg px-3 py-2 text-sm resize-none outline-none focus:ring-2 focus:ring-blue-500"></textarea>
            <button mat-flat-button color="primary" [disabled]="!replyText.trim() || submitting()" (click)="sendReply()">
              @if (submitting()) {
                <mat-spinner diameter="18" class="inline-block" />
              } @else {
                <mat-icon>send</mat-icon>
              }
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class AdminSupportComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly snackBar = inject(MatSnackBar);

  loading = signal(true);
  submitting = signal(false);
  tickets = signal<any[]>([]);
  selectedTicket = signal<any | null>(null);

  columns = ['id', 'subject', 'customer', 'status', 'date', 'actions'];
  filterStatus = '';
  replyText = '';
  newStatus = 'open';

  async ngOnInit() {
    await this.loadTickets();
  }

  async loadTickets() {
    this.loading.set(true);
    try {
      const params: any = { page: 1, perPage: 50 };
      if (this.filterStatus) params.status = this.filterStatus;
      const res = await firstValueFrom(this.api.get<any>('/admin/support/tickets', params));
      this.tickets.set(res.data ?? []);
    } finally {
      this.loading.set(false);
    }
  }

  async openTicket(id: number) {
    try {
      const res = await firstValueFrom(this.api.get<any>(`/admin/support/tickets/${id}`));
      this.selectedTicket.set(res.data);
      this.newStatus = res.data.status;
      this.replyText = '';
    } catch {
      this.snackBar.open('Error al cargar el ticket', 'OK', { duration: 3000 });
    }
  }

  async updateStatus() {
    const ticket = this.selectedTicket();
    if (!ticket) return;
    try {
      await firstValueFrom(this.api.put(`/admin/support/tickets/${ticket.id}/status`, { status: this.newStatus }));
      this.selectedTicket.set({ ...ticket, status: this.newStatus });
      await this.loadTickets();
    } catch {
      this.snackBar.open('Error al actualizar el estado', 'OK', { duration: 3000 });
    }
  }

  async sendReply() {
    const ticket = this.selectedTicket();
    if (!ticket) return;
    this.submitting.set(true);
    try {
      await firstValueFrom(this.api.post(`/admin/support/tickets/${ticket.id}/messages`, { message: this.replyText }));
      this.replyText = '';
      await this.openTicket(ticket.id);
      this.snackBar.open('Respuesta enviada', 'OK', { duration: 2000 });
    } catch {
      this.snackBar.open('Error al enviar la respuesta', 'OK', { duration: 3000 });
    } finally {
      this.submitting.set(false);
    }
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = { open: 'Abierto', pending: 'Pendiente', closed: 'Cerrado' };
    return labels[status] ?? status;
  }
}
