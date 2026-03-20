import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ApiService } from '../../core/services/api.service';
import { firstValueFrom } from 'rxjs';

interface CmsPageAdmin {
  id: number;
  title: string;
  slug: string;
  active: boolean;
  created_at: string;
}

@Component({
  selector: 'app-cms-list',
  standalone: true,
  imports: [
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatPaginatorModule,
  ],
  template: `
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Páginas CMS</h1>
      <a mat-flat-button color="primary" routerLink="/cms/new">
        <mat-icon>add</mat-icon> Nueva página
      </a>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-12"><mat-spinner diameter="48" /></div>
    } @else {
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table mat-table [dataSource]="pages()" class="w-full">
          <ng-container matColumnDef="title">
            <th mat-header-cell *matHeaderCellDef>Título</th>
            <td mat-cell *matCellDef="let p">{{ p.title }}</td>
          </ng-container>
          <ng-container matColumnDef="slug">
            <th mat-header-cell *matHeaderCellDef>Slug</th>
            <td mat-cell *matCellDef="let p">
              <code class="text-xs bg-gray-100 px-1 rounded">{{ p.slug }}</code>
            </td>
          </ng-container>
          <ng-container matColumnDef="active">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let p">
              <span [class]="p.active ? 'text-green-600 font-medium' : 'text-red-500'">
                {{ p.active ? 'Activa' : 'Inactiva' }}
              </span>
            </td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let p">
              <a mat-icon-button [routerLink]="['/cms', p.id]" title="Editar">
                <mat-icon>edit</mat-icon>
              </a>
              <button mat-icon-button color="warn" title="Eliminar" (click)="remove(p.id)">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
        </table>
        <mat-paginator
          [length]="total()"
          [pageSize]="perPage"
          [pageIndex]="page() - 1"
          [pageSizeOptions]="[10, 25, 50]"
          (page)="onPage($event)"
        />
      </div>
    }
  `,
})
export class CmsListComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly snackBar = inject(MatSnackBar);

  readonly pages = signal<CmsPageAdmin[]>([]);
  readonly loading = signal(false);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly perPage = 20;

  readonly columns = ['title', 'slug', 'active', 'actions'];

  async ngOnInit() {
    await this.loadPages();
  }

  onPage(event: PageEvent) {
    this.page.set(event.pageIndex + 1);
    this.loadPages();
  }

  async loadPages() {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(
        this.api.get<any>('/cms/admin/pages', { page: this.page(), perPage: this.perPage }),
      );
      this.pages.set(res.data ?? []);
      this.total.set(res.meta?.total ?? 0);
    } catch {
      this.snackBar.open('Error al cargar páginas', 'OK', { duration: 3000 });
    } finally {
      this.loading.set(false);
    }
  }

  async remove(id: number) {
    if (!confirm('¿Eliminar esta página?')) return;
    try {
      await firstValueFrom(this.api.delete(`/cms/admin/pages/${id}`));
      this.snackBar.open('Página eliminada', 'OK', { duration: 2000 });
      await this.loadPages();
    } catch {
      this.snackBar.open('Error al eliminar la página', 'OK', { duration: 3000 });
    }
  }
}
