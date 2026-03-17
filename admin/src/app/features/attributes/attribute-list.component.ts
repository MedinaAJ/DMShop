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
  selector: 'app-attribute-list',
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
      <h1 class="text-2xl font-bold">Atributos</h1>
      <a mat-flat-button color="primary" routerLink="/attributes/new">
        <mat-icon>add</mat-icon> Nuevo atributo
      </a>
    </div>

    @if (loading) {
      <div class="flex justify-center py-12"><mat-spinner diameter="48" /></div>
    } @else {
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table mat-table [dataSource]="items" class="w-full">
          <ng-container matColumnDef="id">
            <th mat-header-cell *matHeaderCellDef>ID</th>
            <td mat-cell *matCellDef="let a">{{ a.id }}</td>
          </ng-container>
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Nombre</th>
            <td mat-cell *matCellDef="let a">{{ getTransName(a) }}</td>
          </ng-container>
          <ng-container matColumnDef="values">
            <th mat-header-cell *matHeaderCellDef>Valores</th>
            <td mat-cell *matCellDef="let a">
              <mat-chip-set>
                @for (v of a.values || []; track v.id) {
                  <mat-chip>
                    @if (v.color) {
                      <span
                        class="inline-block w-3 h-3 rounded-full mr-1"
                        [style.background]="v.color"
                      ></span>
                    }
                    {{ getValueName(v) }}
                  </mat-chip>
                }
              </mat-chip-set>
            </td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let a">
              <a mat-icon-button [routerLink]="['/attributes', a.id]"><mat-icon>edit</mat-icon></a>
              <button mat-icon-button color="warn" (click)="remove(a.id)">
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
export class AttributeListComponent implements OnInit {
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
    this.api.get<any>('/attributes').subscribe((res) => {
      this.items = res.data;
      this.loading = false;
    });
  }

  getTransName(a: any): string {
    return a.translations?.[0]?.name || `Attr #${a.id}`;
  }

  getValueName(v: any): string {
    return v.translations?.[0]?.name || `Val #${v.id}`;
  }

  remove(id: number): void {
    if (!confirm('¿Eliminar este atributo?')) return;
    this.api.delete(`/attributes/${id}`).subscribe(() => {
      this.snackBar.open('Atributo eliminado', 'OK', { duration: 3000 });
      this.load();
    });
  }
}
