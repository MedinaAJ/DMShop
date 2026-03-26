import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { DatePipe } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../../core/services/api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinner,
    MatChipsModule,
    DatePipe,
    MatSnackBarModule,
  ],
  template: `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h2 class="text-xl font-bold">Soporte y ayuda</h2>
        <button mat-flat-button color="primary" (click)="showNewTicket = true" *ngIf="!showNewTicket">
          <mat-icon>add</mat-icon> Nuevo ticket
        </button>
      </div>

      <!-- New ticket form -->
      @if (showNewTicket) {
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 class="font-semibold mb-4">Nuevo ticket de soporte</h3>
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Asunto</label>
              <input type="text" [(ngModel)]="newSubject" placeholder="Describe brevemente tu consulta"
                     class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
              <textarea [(ngModel)]="newMessage" rows="4" placeholder="Describe tu consulta en detalle..."
                        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"></textarea>
            </div>
            <div class="flex gap-2">
              <button mat-flat-button color="primary" [disabled]="!newSubject.trim() || !newMessage.trim() || submitting()" (click)="createTicket()">
                @if (submitting()) { <mat-spinner diameter="18" class="inline-block mr-1" /> } Enviar
              </button>
              <button mat-button (click)="showNewTicket = false">Cancelar</button>
            </div>
          </div>
        </div>
      }

      <!-- Ticket list -->
      @if (loading()) {
        <div class="flex justify-center py-12"><mat-spinner diameter="36" /></div>
      } @else if (tickets().length === 0) {
        <div class="text-center py-12 text-gray-500">
          <mat-icon class="!text-5xl mb-2">support_agent</mat-icon>
          <p>No tienes tickets de soporte abiertos.</p>
        </div>
      } @else {
        <div class="space-y-3">
          @for (ticket of tickets(); track ticket.id) {
            <div class="bg-white border rounded-lg p-4 cursor-pointer hover:shadow-md transition"
                 (click)="openTicket(ticket.id)">
              <div class="flex justify-between items-start">
                <div>
                  <p class="font-medium">{{ ticket.subject }}</p>
                  <p class="text-sm text-gray-500 mt-1">Ticket #{{ ticket.id }} · {{ ticket.createdAt | date: 'dd/MM/yyyy' }}</p>
                </div>
                <span class="text-xs font-semibold px-2 py-1 rounded-full"
                      [class.bg-green-100]="ticket.status === 'open'"
                      [class.text-green-700]="ticket.status === 'open'"
                      [class.bg-amber-100]="ticket.status === 'pending'"
                      [class.text-amber-700]="ticket.status === 'pending'"
                      [class.bg-gray-100]="ticket.status === 'closed'"
                      [class.text-gray-600]="ticket.status === 'closed'">
                  {{ statusLabel(ticket.status) }}
                </span>
              </div>
            </div>
          }
        </div>
      }

      <!-- Ticket detail -->
      @if (selectedTicket()) {
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click.self)="selectedTicket.set(null)">
          <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div class="flex justify-between items-center p-4 border-b">
              <div>
                <h3 class="font-bold text-lg">{{ selectedTicket()!.subject }}</h3>
                <p class="text-sm text-gray-500">Ticket #{{ selectedTicket()!.id }}</p>
              </div>
              <button mat-icon-button (click)="selectedTicket.set(null)"><mat-icon>close</mat-icon></button>
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
            @if (selectedTicket()!.status !== 'closed') {
              <div class="p-4 border-t flex gap-2">
                <textarea [(ngModel)]="replyText" rows="2" placeholder="Escribe tu respuesta..."
                          class="flex-1 border rounded-lg px-3 py-2 text-sm resize-none outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                <button mat-flat-button color="primary" [disabled]="!replyText.trim() || submitting()" (click)="sendReply()">
                  <mat-icon>send</mat-icon>
                </button>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class SupportComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly snackBar = inject(MatSnackBar);

  loading = signal(true);
  submitting = signal(false);
  tickets = signal<any[]>([]);
  selectedTicket = signal<any | null>(null);

  showNewTicket = false;
  newSubject = '';
  newMessage = '';
  replyText = '';

  async ngOnInit() {
    await this.loadTickets();
  }

  async loadTickets() {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(this.api.get<any>('/support/tickets'));
      this.tickets.set(res.data ?? []);
    } finally {
      this.loading.set(false);
    }
  }

  async createTicket() {
    this.submitting.set(true);
    try {
      await firstValueFrom(this.api.post('/support/tickets', {
        subject: this.newSubject,
        message: this.newMessage,
      }));
      this.newSubject = '';
      this.newMessage = '';
      this.showNewTicket = false;
      this.snackBar.open('Ticket creado correctamente', 'OK', { duration: 3000 });
      await this.loadTickets();
    } catch {
      this.snackBar.open('Error al crear el ticket', 'OK', { duration: 3000 });
    } finally {
      this.submitting.set(false);
    }
  }

  async openTicket(id: number) {
    try {
      const res = await firstValueFrom(this.api.get<any>(`/support/tickets/${id}`));
      this.selectedTicket.set(res.data);
    } catch {
      this.snackBar.open('Error al cargar el ticket', 'OK', { duration: 3000 });
    }
  }

  async sendReply() {
    const ticket = this.selectedTicket();
    if (!ticket) return;
    this.submitting.set(true);
    try {
      await firstValueFrom(this.api.post(`/support/tickets/${ticket.id}/messages`, { message: this.replyText }));
      this.replyText = '';
      await this.openTicket(ticket.id);
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
