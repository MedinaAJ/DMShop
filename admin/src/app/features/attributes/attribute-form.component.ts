import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-attribute-form',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDividerModule,
  ],
  template: `
    <div class="flex items-center gap-4 mb-6">
      <a mat-icon-button routerLink="/attributes"><mat-icon>arrow_back</mat-icon></a>
      <h1 class="text-2xl font-bold">{{ isNew ? 'Nuevo atributo' : 'Editar atributo' }}</h1>
    </div>

    @if (loading) {
      <div class="flex justify-center py-12"><mat-spinner diameter="48" /></div>
    } @else {
      <form (ngSubmit)="onSubmit()" class="max-w-2xl space-y-4">
        <h3 class="font-semibold">Traducciones</h3>
        <div class="grid grid-cols-2 gap-4">
          <mat-form-field appearance="outline">
            <mat-label>Nombre (ES)</mat-label>
            <input matInput [(ngModel)]="nameEs" name="nameEs" required />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Name (EN)</mat-label>
            <input matInput [(ngModel)]="nameEn" name="nameEn" />
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="w-32">
          <mat-label>Posición</mat-label>
          <input matInput type="number" [(ngModel)]="position" name="position" />
        </mat-form-field>

        <div class="flex gap-3">
          <button mat-flat-button color="primary" type="submit" [disabled]="saving">
            {{ isNew ? 'Crear' : 'Guardar' }}
          </button>
          <a mat-button routerLink="/attributes">Cancelar</a>
        </div>
      </form>

      @if (!isNew) {
        <mat-divider class="my-8" />
        <h2 class="text-xl font-bold mb-4">Valores del atributo</h2>

        <div class="space-y-3 max-w-2xl">
          @for (v of values; track v.id) {
            <div class="flex items-center gap-3 bg-white rounded-lg shadow p-3">
              <mat-form-field appearance="outline" class="flex-1 !mb-0">
                <mat-label>ES</mat-label>
                <input matInput [(ngModel)]="v.nameEs" [name]="'ves_' + v.id" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="flex-1 !mb-0">
                <mat-label>EN</mat-label>
                <input matInput [(ngModel)]="v.nameEn" [name]="'ven_' + v.id" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="w-24 !mb-0">
                <mat-label>Color</mat-label>
                <input matInput [(ngModel)]="v.color" [name]="'vc_' + v.id" placeholder="#hex" />
              </mat-form-field>
              <button mat-icon-button color="primary" (click)="updateValue(v)">
                <mat-icon>save</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="removeValue(v.id)">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          }
        </div>

        <div class="flex items-center gap-3 mt-4 max-w-2xl bg-gray-50 rounded-lg p-3">
          <mat-form-field appearance="outline" class="flex-1 !mb-0">
            <mat-label>Nuevo valor (ES)</mat-label>
            <input matInput [(ngModel)]="newValueEs" name="newValueEs" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="flex-1 !mb-0">
            <mat-label>New value (EN)</mat-label>
            <input matInput [(ngModel)]="newValueEn" name="newValueEn" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="w-24 !mb-0">
            <mat-label>Color</mat-label>
            <input matInput [(ngModel)]="newValueColor" name="newValueColor" placeholder="#hex" />
          </mat-form-field>
          <button mat-icon-button color="primary" (click)="addValue()">
            <mat-icon>add_circle</mat-icon>
          </button>
        </div>
      }
    }
  `,
})
export class AttributeFormComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  isNew = true;
  loading = false;
  saving = false;
  itemId: number | null = null;
  nameEs = '';
  nameEn = '';
  position = 0;
  values: Array<{ id: number; nameEs: string; nameEn: string; color: string }> = [];
  newValueEs = '';
  newValueEn = '';
  newValueColor = '';

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id && id !== 'new') {
      this.isNew = false;
      this.itemId = +id;
      this.loading = true;
      this.api.get<any>(`/attributes/${id}`).subscribe({
        next: (res) => {
          const a = res.data;
          this.position = a.position || 0;
          const tEs = a.translations?.find((t: any) => t.id_lang === 1);
          const tEn = a.translations?.find((t: any) => t.id_lang === 2);
          this.nameEs = tEs?.name || '';
          this.nameEn = tEn?.name || '';
          this.values = (a.values || []).map((v: any) => ({
            id: v.id,
            nameEs: v.translations?.find((t: any) => t.id_lang === 1)?.name || '',
            nameEn: v.translations?.find((t: any) => t.id_lang === 2)?.name || '',
            color: v.color || '',
          }));
          this.loading = false;
        },
        error: () => {
          this.snackBar.open('No encontrado', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/attributes']);
        },
      });
    }
  }

  onSubmit(): void {
    this.saving = true;
    const body = { translations: { es: this.nameEs, en: this.nameEn }, position: this.position };
    const obs = this.isNew
      ? this.api.post('/attributes', body)
      : this.api.put(`/attributes/${this.itemId}`, body);

    obs.subscribe({
      next: (res: any) => {
        this.snackBar.open(this.isNew ? 'Atributo creado' : 'Atributo actualizado', 'OK', {
          duration: 3000,
        });
        if (this.isNew) {
          this.router.navigate(['/attributes', res.data?.id || res.id]);
        }
        this.saving = false;
      },
      error: () => {
        this.snackBar.open('Error al guardar', 'Cerrar', { duration: 3000 });
        this.saving = false;
      },
    });
  }

  addValue(): void {
    if (!this.newValueEs) return;
    this.api
      .post(`/attributes/${this.itemId}/values`, {
        translations: { es: this.newValueEs, en: this.newValueEn },
        color: this.newValueColor || null,
      })
      .subscribe({
        next: () => {
          this.snackBar.open('Valor añadido', 'OK', { duration: 2000 });
          this.newValueEs = '';
          this.newValueEn = '';
          this.newValueColor = '';
          this.reloadValues();
        },
        error: () => this.snackBar.open('Error', 'Cerrar', { duration: 3000 }),
      });
  }

  updateValue(v: any): void {
    this.api
      .put(`/attributes/${this.itemId}/values/${v.id}`, {
        translations: { es: v.nameEs, en: v.nameEn },
        color: v.color || null,
      })
      .subscribe({
        next: () => this.snackBar.open('Valor actualizado', 'OK', { duration: 2000 }),
        error: () => this.snackBar.open('Error', 'Cerrar', { duration: 3000 }),
      });
  }

  removeValue(valueId: number): void {
    if (!confirm('¿Eliminar este valor?')) return;
    this.api.delete(`/attributes/${this.itemId}/values/${valueId}`).subscribe({
      next: () => {
        this.values = this.values.filter((v) => v.id !== valueId);
        this.snackBar.open('Valor eliminado', 'OK', { duration: 2000 });
      },
    });
  }

  private reloadValues(): void {
    this.api.get<any>(`/attributes/${this.itemId}`).subscribe((res) => {
      this.values = (res.data.values || []).map((v: any) => ({
        id: v.id,
        nameEs: v.translations?.find((t: any) => t.id_lang === 1)?.name || '',
        nameEn: v.translations?.find((t: any) => t.id_lang === 2)?.name || '',
        color: v.color || '',
      }));
    });
  }
}
