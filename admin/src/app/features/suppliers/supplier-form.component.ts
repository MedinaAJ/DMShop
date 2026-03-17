import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-supplier-form',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="flex items-center gap-4 mb-6">
      <a mat-icon-button routerLink="/suppliers"><mat-icon>arrow_back</mat-icon></a>
      <h1 class="text-2xl font-bold">{{ isNew ? 'Nuevo proveedor' : 'Editar proveedor' }}</h1>
    </div>

    @if (loading) {
      <div class="flex justify-center py-12"><mat-spinner diameter="48" /></div>
    } @else {
      <form (ngSubmit)="onSubmit()" class="max-w-xl space-y-4">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Nombre</mat-label>
          <input matInput [(ngModel)]="item.name" name="name" required />
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Descripción</mat-label>
          <textarea matInput [(ngModel)]="item.description" name="description" rows="4"></textarea>
        </mat-form-field>

        <mat-slide-toggle [(ngModel)]="item.active" name="active" color="primary">
          Activo
        </mat-slide-toggle>

        <div class="flex gap-3 pt-4">
          <button mat-flat-button color="primary" type="submit" [disabled]="saving">
            {{ isNew ? 'Crear' : 'Guardar' }}
          </button>
          <a mat-button routerLink="/suppliers">Cancelar</a>
        </div>
      </form>
    }
  `,
})
export class SupplierFormComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  isNew = true;
  loading = false;
  saving = false;
  itemId: number | null = null;
  item = { name: '', description: '', active: true };

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id && id !== 'new') {
      this.isNew = false;
      this.itemId = +id;
      this.loading = true;
      this.api.get<any>(`/suppliers/${id}`).subscribe({
        next: (res) => {
          this.item = {
            name: res.data.name,
            description: res.data.description || '',
            active: res.data.active,
          };
          this.loading = false;
        },
        error: () => {
          this.snackBar.open('No encontrado', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/suppliers']);
        },
      });
    }
  }

  onSubmit(): void {
    this.saving = true;
    const obs = this.isNew
      ? this.api.post('/suppliers', this.item)
      : this.api.put(`/suppliers/${this.itemId}`, this.item);

    obs.subscribe({
      next: () => {
        this.snackBar.open(this.isNew ? 'Proveedor creado' : 'Proveedor actualizado', 'OK', {
          duration: 3000,
        });
        this.router.navigate(['/suppliers']);
      },
      error: () => {
        this.snackBar.open('Error al guardar', 'Cerrar', { duration: 3000 });
        this.saving = false;
      },
    });
  }
}
