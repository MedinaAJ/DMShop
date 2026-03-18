import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/services/api.service';

interface CustomerGroupTranslation {
  id_customer_group: number;
  id_lang: number;
  name: string;
}

interface CustomerGroup {
  id: number;
  reduction: number;
  price_display_method: number;
  show_prices: boolean;
  deleted: boolean;
  translations: CustomerGroupTranslation[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  active: boolean;
}

const PROTECTED_IDS = [1, 2, 3];

@Component({
  selector: 'app-customer-groups',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatDividerModule,
    MatCardModule,
    MatTooltipModule,
  ],
  template: `
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Grupos de Clientes</h1>
      <button mat-flat-button color="primary" (click)="openCreateForm()">
        <mat-icon>add</mat-icon> Nuevo grupo
      </button>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-12"><mat-spinner diameter="48" /></div>
    } @else {
      <!-- Groups Table -->
      <mat-card class="mb-6">
        <mat-card-content>
          <table mat-table [dataSource]="groups()" class="w-full">
            <ng-container matColumnDef="id">
              <th mat-header-cell *matHeaderCellDef>ID</th>
              <td mat-cell *matCellDef="let g">
                {{ g.id }}
                @if (isProtected(g.id)) {
                  <mat-chip color="accent" class="ml-2 text-xs">Sistema</mat-chip>
                }
              </td>
            </ng-container>

            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Nombre</th>
              <td mat-cell *matCellDef="let g">{{ getGroupName(g) }}</td>
            </ng-container>

            <ng-container matColumnDef="reduction">
              <th mat-header-cell *matHeaderCellDef>Descuento</th>
              <td mat-cell *matCellDef="let g">
                <span [class]="g.reduction > 0 ? 'text-green-600 font-semibold' : 'text-gray-400'">
                  {{ g.reduction }}%
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="show_prices">
              <th mat-header-cell *matHeaderCellDef>Ver precios</th>
              <td mat-cell *matCellDef="let g">
                <mat-icon [class]="g.show_prices ? 'text-green-600' : 'text-red-500'">
                  {{ g.show_prices ? 'visibility' : 'visibility_off' }}
                </mat-icon>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let g">
                <button mat-icon-button (click)="openEditForm(g)" matTooltip="Editar">
                  <mat-icon>edit</mat-icon>
                </button>
                <button
                  mat-icon-button
                  color="primary"
                  (click)="viewMembers(g)"
                  matTooltip="Ver miembros">
                  <mat-icon>people</mat-icon>
                </button>
                <button
                  mat-icon-button
                  color="warn"
                  (click)="removeGroup(g.id)"
                  [disabled]="isProtected(g.id)"
                  [matTooltip]="isProtected(g.id) ? 'Grupo de sistema, no eliminable' : 'Eliminar'">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </mat-card-content>
      </mat-card>

      <!-- Create / Edit Form -->
      @if (showForm()) {
        <mat-card class="mb-6">
          <mat-card-header>
            <mat-card-title>{{ editingGroup() ? 'Editar grupo' : 'Nuevo grupo' }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="groupForm" (ngSubmit)="saveGroup()" class="flex flex-col gap-4 mt-4">
              <mat-form-field>
                <mat-label>Nombre</mat-label>
                <input matInput formControlName="name" required />
              </mat-form-field>

              <mat-form-field>
                <mat-label>Reducción (%)</mat-label>
                <input matInput type="number" formControlName="reduction" min="0" max="100" />
                <mat-hint>Descuento global aplicado a todos los productos</mat-hint>
              </mat-form-field>

              <div class="flex items-center gap-4">
                <mat-slide-toggle formControlName="show_prices">Mostrar precios</mat-slide-toggle>
                <span class="text-sm text-gray-500">Si está desactivado, el grupo no verá los precios</span>
              </div>

              <div class="flex gap-3 mt-2">
                <button mat-flat-button color="primary" type="submit" [disabled]="groupForm.invalid || saving()">
                  @if (saving()) {
                    <mat-spinner diameter="20" class="inline-block mr-2"></mat-spinner>
                  }
                  Guardar
                </button>
                <button mat-button type="button" (click)="cancelForm()">Cancelar</button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      }

      <!-- Members Panel -->
      @if (selectedGroup()) {
        <mat-card>
          <mat-card-header>
            <mat-card-title>
              Miembros de "{{ getGroupName(selectedGroup()!) }}"
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (loadingMembers()) {
              <div class="flex justify-center py-8"><mat-spinner diameter="36" /></div>
            } @else {
              <!-- Add user by ID -->
              <div class="flex gap-3 items-center mb-4 mt-4">
                <mat-form-field class="w-40">
                  <mat-label>ID de usuario</mat-label>
                  <input matInput type="number" [(ngModel)]="addUserId" />
                </mat-form-field>
                <button mat-stroked-button color="primary" (click)="addUserToGroup()" [disabled]="!addUserId">
                  <mat-icon>person_add</mat-icon> Añadir
                </button>
              </div>

              @if (members().length === 0) {
                <p class="text-gray-500 py-4">No hay miembros en este grupo.</p>
              } @else {
                <table mat-table [dataSource]="members()" class="w-full">
                  <ng-container matColumnDef="id">
                    <th mat-header-cell *matHeaderCellDef>ID</th>
                    <td mat-cell *matCellDef="let u">{{ u.id }}</td>
                  </ng-container>
                  <ng-container matColumnDef="name">
                    <th mat-header-cell *matHeaderCellDef>Nombre</th>
                    <td mat-cell *matCellDef="let u">{{ u.first_name }} {{ u.last_name }}</td>
                  </ng-container>
                  <ng-container matColumnDef="email">
                    <th mat-header-cell *matHeaderCellDef>Email</th>
                    <td mat-cell *matCellDef="let u">{{ u.email }}</td>
                  </ng-container>
                  <ng-container matColumnDef="remove">
                    <th mat-header-cell *matHeaderCellDef></th>
                    <td mat-cell *matCellDef="let u">
                      <button mat-icon-button color="warn" (click)="removeUserFromGroup(u.id)" matTooltip="Quitar del grupo">
                        <mat-icon>person_remove</mat-icon>
                      </button>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="memberColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: memberColumns;"></tr>
                </table>
              }

              <div class="mt-4">
                <button mat-button (click)="selectedGroup.set(null)">
                  <mat-icon>close</mat-icon> Cerrar
                </button>
              </div>
            }
          </mat-card-content>
        </mat-card>
      }
    }
  `,
})
export class CustomerGroupsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  readonly groups = signal<CustomerGroup[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly showForm = signal(false);
  readonly editingGroup = signal<CustomerGroup | null>(null);
  readonly selectedGroup = signal<CustomerGroup | null>(null);
  readonly members = signal<User[]>([]);
  readonly loadingMembers = signal(false);

  addUserId: number | null = null;

  displayedColumns = ['id', 'name', 'reduction', 'show_prices', 'actions'];
  memberColumns = ['id', 'name', 'email', 'remove'];

  groupForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    reduction: [0, [Validators.min(0), Validators.max(100)]],
    show_prices: [true],
  });

  ngOnInit() {
    this.loadGroups();
  }

  async loadGroups() {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(this.api.get<ApiResponse<CustomerGroup[]>>('/customer-groups'));
      this.groups.set(res.data);
    } catch {
      this.snackBar.open('Error al cargar los grupos', 'Cerrar', { duration: 3000 });
    } finally {
      this.loading.set(false);
    }
  }

  getGroupName(group: CustomerGroup): string {
    // Prefer lang 1 (Spanish)
    const t = group.translations?.find((t) => t.id_lang === 1) ?? group.translations?.[0];
    return t?.name ?? `Grupo #${group.id}`;
  }

  isProtected(id: number): boolean {
    return PROTECTED_IDS.includes(id);
  }

  openCreateForm() {
    this.editingGroup.set(null);
    this.groupForm.reset({ name: '', reduction: 0, show_prices: true });
    this.showForm.set(true);
  }

  openEditForm(group: CustomerGroup) {
    this.editingGroup.set(group);
    this.groupForm.setValue({
      name: this.getGroupName(group),
      reduction: group.reduction,
      show_prices: group.show_prices,
    });
    this.showForm.set(true);
  }

  cancelForm() {
    this.showForm.set(false);
    this.editingGroup.set(null);
  }

  async saveGroup() {
    if (this.groupForm.invalid) return;
    this.saving.set(true);

    const { name, reduction, show_prices } = this.groupForm.value;
    const payload = {
      reduction,
      show_prices,
      translations: [{ id_lang: 1, name }],
    };

    try {
      const group = this.editingGroup();
      if (group) {
        await firstValueFrom(this.api.put<ApiResponse<CustomerGroup>>(`/customer-groups/${group.id}`, payload));
        this.snackBar.open('Grupo actualizado', 'OK', { duration: 2500 });
      } else {
        await firstValueFrom(this.api.post<ApiResponse<CustomerGroup>>('/customer-groups', payload));
        this.snackBar.open('Grupo creado', 'OK', { duration: 2500 });
      }
      this.showForm.set(false);
      this.editingGroup.set(null);
      await this.loadGroups();
    } catch {
      this.snackBar.open('Error al guardar el grupo', 'Cerrar', { duration: 3000 });
    } finally {
      this.saving.set(false);
    }
  }

  async removeGroup(id: number) {
    if (this.isProtected(id)) return;
    if (!confirm('¿Eliminar este grupo de clientes?')) return;

    try {
      await firstValueFrom(this.api.delete(`/customer-groups/${id}`));
      this.snackBar.open('Grupo eliminado', 'OK', { duration: 2500 });
      await this.loadGroups();
    } catch {
      this.snackBar.open('Error al eliminar el grupo', 'Cerrar', { duration: 3000 });
    }
  }

  async viewMembers(group: CustomerGroup) {
    this.selectedGroup.set(group);
    this.loadingMembers.set(true);
    this.addUserId = null;
    try {
      const res = await firstValueFrom(this.api.get<ApiResponse<User[]>>(`/customer-groups/${group.id}/users`));
      this.members.set(res.data);
    } catch {
      this.snackBar.open('Error al cargar los miembros', 'Cerrar', { duration: 3000 });
    } finally {
      this.loadingMembers.set(false);
    }
  }

  async addUserToGroup() {
    const group = this.selectedGroup();
    if (!group || !this.addUserId) return;

    try {
      await firstValueFrom(this.api.post(`/customer-groups/${group.id}/users`, { userId: this.addUserId }));
      this.snackBar.open('Usuario añadido al grupo', 'OK', { duration: 2500 });
      this.addUserId = null;
      await this.viewMembers(group);
    } catch {
      this.snackBar.open('Error al añadir el usuario', 'Cerrar', { duration: 3000 });
    }
  }

  async removeUserFromGroup(userId: number) {
    const group = this.selectedGroup();
    if (!group) return;

    try {
      await firstValueFrom(this.api.delete(`/customer-groups/${group.id}/users/${userId}`));
      this.snackBar.open('Usuario eliminado del grupo', 'OK', { duration: 2500 });
      await this.viewMembers(group);
    } catch {
      this.snackBar.open('Error al eliminar el usuario', 'Cerrar', { duration: 3000 });
    }
  }
}
