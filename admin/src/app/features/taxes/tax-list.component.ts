import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { DecimalPipe } from '@angular/common';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-tax-list',
  standalone: true,
  imports: [
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    DecimalPipe,
  ],
  template: `
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Impuestos</h1>
      <a mat-flat-button color="primary" routerLink="/taxes/new">
        <mat-icon>add</mat-icon> Nuevo impuesto
      </a>
    </div>

    <mat-tab-group>
      <mat-tab label="Impuestos">
        @if (loadingTaxes) {
          <div class="flex justify-center py-12"><mat-spinner diameter="48" /></div>
        } @else {
          <div class="bg-white rounded-lg shadow overflow-hidden mt-4">
            <table mat-table [dataSource]="taxes" class="w-full">
              <ng-container matColumnDef="id">
                <th mat-header-cell *matHeaderCellDef>ID</th>
                <td mat-cell *matCellDef="let t">{{ t.id }}</td>
              </ng-container>
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Nombre</th>
                <td mat-cell *matCellDef="let t">{{ t.name }}</td>
              </ng-container>
              <ng-container matColumnDef="rate">
                <th mat-header-cell *matHeaderCellDef>Tasa (%)</th>
                <td mat-cell *matCellDef="let t">{{ t.rate | number: '1.0-3' }}%</td>
              </ng-container>
              <ng-container matColumnDef="active">
                <th mat-header-cell *matHeaderCellDef>Estado</th>
                <td mat-cell *matCellDef="let t">
                  <span [class]="t.active ? 'text-green-600' : 'text-red-500'">
                    {{ t.active ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let t">
                  <a mat-icon-button [routerLink]="['/taxes', t.id]"><mat-icon>edit</mat-icon></a>
                  <button mat-icon-button color="warn" (click)="removeTax(t.id)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="taxCols"></tr>
              <tr mat-row *matRowDef="let row; columns: taxCols"></tr>
            </table>
          </div>
        }
      </mat-tab>

      <mat-tab label="Grupos de reglas">
        @if (loadingGroups) {
          <div class="flex justify-center py-12"><mat-spinner diameter="48" /></div>
        } @else {
          <div class="bg-white rounded-lg shadow overflow-hidden mt-4">
            <table mat-table [dataSource]="groups" class="w-full">
              <ng-container matColumnDef="id">
                <th mat-header-cell *matHeaderCellDef>ID</th>
                <td mat-cell *matCellDef="let g">{{ g.id }}</td>
              </ng-container>
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Nombre</th>
                <td mat-cell *matCellDef="let g">{{ g.name }}</td>
              </ng-container>
              <ng-container matColumnDef="rules">
                <th mat-header-cell *matHeaderCellDef>Reglas</th>
                <td mat-cell *matCellDef="let g">{{ g.rules?.length || 0 }}</td>
              </ng-container>
              <ng-container matColumnDef="active">
                <th mat-header-cell *matHeaderCellDef>Estado</th>
                <td mat-cell *matCellDef="let g">
                  <span [class]="g.active ? 'text-green-600' : 'text-red-500'">
                    {{ g.active ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let g">
                  <button mat-icon-button color="warn" (click)="removeGroup(g.id)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="groupCols"></tr>
              <tr mat-row *matRowDef="let row; columns: groupCols"></tr>
            </table>
          </div>
        }
      </mat-tab>
    </mat-tab-group>
  `,
})
export class TaxListComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly snackBar = inject(MatSnackBar);

  taxes: any[] = [];
  groups: any[] = [];
  taxCols = ['id', 'name', 'rate', 'active', 'actions'];
  groupCols = ['id', 'name', 'rules', 'active', 'actions'];
  loadingTaxes = true;
  loadingGroups = true;

  ngOnInit(): void {
    this.loadTaxes();
    this.loadGroups();
  }

  loadTaxes(): void {
    this.loadingTaxes = true;
    this.api.get<any>('/tax/taxes').subscribe((res) => {
      this.taxes = res.data;
      this.loadingTaxes = false;
    });
  }

  loadGroups(): void {
    this.loadingGroups = true;
    this.api.get<any>('/tax/groups').subscribe((res) => {
      this.groups = res.data;
      this.loadingGroups = false;
    });
  }

  removeTax(id: number): void {
    if (!confirm('¿Eliminar este impuesto?')) return;
    this.api.delete(`/tax/taxes/${id}`).subscribe(() => {
      this.snackBar.open('Impuesto eliminado', 'OK', { duration: 3000 });
      this.loadTaxes();
    });
  }

  removeGroup(id: number): void {
    if (!confirm('¿Eliminar este grupo de reglas?')) return;
    this.api.delete(`/tax/groups/${id}`).subscribe(() => {
      this.snackBar.open('Grupo eliminado', 'OK', { duration: 3000 });
      this.loadGroups();
    });
  }
}
