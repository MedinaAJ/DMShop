import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-feature-list',
  standalone: true,
  imports: [
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
  ],
  template: `
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Características</h1>
      <a mat-flat-button color="primary" routerLink="/features/new">
        <mat-icon>add</mat-icon> Nueva característica
      </a>
    </div>

    @if (loading) {
      <div class="flex justify-center py-12"><mat-spinner diameter="48" /></div>
    } @else {
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table mat-table [dataSource]="items" class="w-full">
          <ng-container matColumnDef="id">
            <th mat-header-cell *matHeaderCellDef>ID</th>
            <td mat-cell *matCellDef="let f">{{ f.id }}</td>
          </ng-container>
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Nombre</th>
            <td mat-cell *matCellDef="let f">{{ getTransName(f) }}</td>
          </ng-container>
          <ng-container matColumnDef="values">
            <th mat-header-cell *matHeaderCellDef>Valores</th>
            <td mat-cell *matCellDef="let f">
              <mat-chip-set>
                @for (v of f.values || []; track v.id) {
                  <mat-chip>{{ getValueName(v) }}</mat-chip>
                }
              </mat-chip-set>
            </td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let f">
              <a mat-icon-button [routerLink]="['/features', f.id]"><mat-icon>edit</mat-icon></a>
              <button mat-icon-button color="warn" (click)="remove(f.id)">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
        </table>
      </div>
    }
  `,
})
export class FeatureListComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly snackBar = inject(MatSnackBar);

  items: any[] = [];
  columns = ['id', 'name', 'values', 'actions'];
  loading = true;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api.get<any>('/features').subscribe((res) => {
      this.items = res.data;
      this.loading = false;
    });
  }

  getTransName(f: any): string {
    return f.translations?.[0]?.name || `Feature #${f.id}`;
  }

  getValueName(v: any): string {
    return v.translations?.[0]?.value || v.translations?.[0]?.name || `Val #${v.id}`;
  }

  remove(id: number): void {
    if (!confirm('¿Eliminar esta característica?')) return;
    this.api.delete(`/features/${id}`).subscribe(() => {
      this.snackBar.open('Característica eliminada', 'OK', { duration: 3000 });
      this.load();
    });
  }
}
