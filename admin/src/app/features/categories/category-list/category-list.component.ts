import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';

interface CategoryNode {
  id: number;
  name: string;
  slug: string;
  active: boolean;
  children: CategoryNode[];
}

interface CategoryTreeResponse {
  success: boolean;
  data: CategoryNode[];
}

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [RouterLink, MatTableModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Categorías</h1>
    </div>

    @if (loading) {
      <div class="flex justify-center py-12">
        <mat-spinner diameter="48" />
      </div>
    } @else {
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table mat-table [dataSource]="categories" class="w-full">
          <ng-container matColumnDef="id">
            <th mat-header-cell *matHeaderCellDef>ID</th>
            <td mat-cell *matCellDef="let c">{{ c.id }}</td>
          </ng-container>
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Nombre</th>
            <td mat-cell *matCellDef="let c">{{ c.name }}</td>
          </ng-container>
          <ng-container matColumnDef="active">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let c">
              <span [class]="c.active ? 'text-green-600' : 'text-red-500'">
                {{ c.active ? 'Activa' : 'Inactiva' }}
              </span>
            </td>
          </ng-container>
          <ng-container matColumnDef="children">
            <th mat-header-cell *matHeaderCellDef>Subcategorías</th>
            <td mat-cell *matCellDef="let c">{{ c.children?.length || 0 }}</td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
        </table>
      </div>
    }
  `,
})
export class CategoryListComponent implements OnInit {
  private readonly api = inject(ApiService);

  categories: any[] = [];
  displayedColumns = ['id', 'name', 'active', 'children'];
  loading = true;

  ngOnInit(): void {
    this.api.get<CategoryTreeResponse>('/categories/tree').subscribe((res) => {
      this.categories = this.flatten(res.data);
      this.loading = false;
    });
  }

  private flatten(cats: CategoryNode[], level = 0): CategoryNode[] {
    const result: CategoryNode[] = [];
    for (const cat of cats) {
      result.push({ ...cat, name: '\u2014'.repeat(level) + ' ' + cat.name });
      if (cat.children?.length) {
        result.push(...this.flatten(cat.children, level + 1));
      }
    }
    return result;
  }
}
