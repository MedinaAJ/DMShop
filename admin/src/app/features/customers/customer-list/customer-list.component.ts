import { Component, inject, OnInit } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';

interface CustomerListResponse {
  success: boolean;
  data: Array<{ id: number; firstName: string; lastName: string; email: string; active: boolean }>;
}

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [MatTableModule, MatProgressSpinnerModule],
  template: `
    <h1 class="text-2xl font-bold mb-6">Clientes</h1>

    @if (loading) {
      <div class="flex justify-center py-12">
        <mat-spinner diameter="48" />
      </div>
    } @else {
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table mat-table [dataSource]="customers" class="w-full">
          <ng-container matColumnDef="id">
            <th mat-header-cell *matHeaderCellDef>ID</th>
            <td mat-cell *matCellDef="let c">{{ c.id }}</td>
          </ng-container>
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Nombre</th>
            <td mat-cell *matCellDef="let c">{{ c.firstName }} {{ c.lastName }}</td>
          </ng-container>
          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>Email</th>
            <td mat-cell *matCellDef="let c">{{ c.email }}</td>
          </ng-container>
          <ng-container matColumnDef="active">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let c">
              <span [class]="c.active ? 'text-green-600' : 'text-red-500'">
                {{ c.active ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
        </table>
      </div>
    }
  `,
})
export class CustomerListComponent implements OnInit {
  private readonly api = inject(ApiService);

  customers: any[] = [];
  displayedColumns = ['id', 'name', 'email', 'active'];
  loading = true;

  ngOnInit(): void {
    this.api.get<CustomerListResponse>('/users').subscribe({
      next: (res) => {
        this.customers = res.data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }
}
