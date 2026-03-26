import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CurrencyPipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { environment } from '../../../../environments/environment';
import { firstValueFrom } from 'rxjs';

interface ProductListResponse {
  success: boolean;
  data: Array<{
    id: number;
    name: string;
    reference: string | null;
    price: number;
    quantity: number;
    active: boolean;
  }>;
  meta: { page: number; perPage: number; total: number; totalPages: number };
}

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    CurrencyPipe,
  ],
  template: `
    <div class="flex flex-wrap justify-between items-center mb-6 gap-3">
      <h1 class="text-2xl font-bold">Productos</h1>
      <div class="flex gap-2 flex-wrap">
        <!-- Import CSV -->
        <button mat-stroked-button (click)="fileInput.click()" [disabled]="importing()">
          @if (importing()) {
            <mat-spinner diameter="18" class="inline-block mr-1" />
          } @else {
            <mat-icon>upload</mat-icon>
          }
          Importar CSV
        </button>
        <input #fileInput type="file" accept=".csv" class="hidden" (change)="onFileSelected($event)" />

        <!-- Export CSV -->
        <button mat-stroked-button (click)="exportCsv()" [disabled]="exporting()">
          @if (exporting()) {
            <mat-spinner diameter="18" class="inline-block mr-1" />
          } @else {
            <mat-icon>download</mat-icon>
          }
          Exportar CSV
        </button>

        <a mat-flat-button color="primary" routerLink="/products/new">
          <mat-icon>add</mat-icon> Nuevo producto
        </a>
      </div>
    </div>

    <!-- Import result -->
    @if (importResult()) {
      <div class="mb-4 p-4 rounded-lg border"
           [class.bg-green-50]="importResult()!.errors.length === 0"
           [class.bg-amber-50]="importResult()!.errors.length > 0"
           [class.border-green-200]="importResult()!.errors.length === 0"
           [class.border-amber-200]="importResult()!.errors.length > 0">
        <div class="flex items-start justify-between">
          <div>
            <p class="font-semibold mb-1">Resultado de la importación</p>
            <p class="text-sm">
              ✅ <strong>{{ importResult()!.created }}</strong> creados &nbsp;
              🔄 <strong>{{ importResult()!.updated }}</strong> actualizados &nbsp;
              ❌ <strong>{{ importResult()!.errors.length }}</strong> errores &nbsp;
              de {{ importResult()!.total }} filas procesadas
            </p>
            @if (importResult()!.errors.length > 0) {
              <details class="mt-2">
                <summary class="cursor-pointer text-sm text-amber-700">Ver errores</summary>
                <ul class="mt-1 text-xs space-y-1">
                  @for (err of importResult()!.errors; track err.row) {
                    <li>Fila {{ err.row }}: {{ err.error }}</li>
                  }
                </ul>
              </details>
            }
          </div>
          <button mat-icon-button (click)="importResult.set(null)"><mat-icon>close</mat-icon></button>
        </div>
      </div>
    }

    <!-- CSV preview before confirm import -->
    @if (csvPreview().length > 0) {
      <div class="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p class="font-semibold mb-3">Vista previa del CSV (primeras {{ csvPreview().length }} filas)</p>
        <div class="overflow-x-auto">
          <table class="text-xs border-collapse w-full">
            @for (row of csvPreview(); track $index) {
              <tr [class.bg-blue-100]="$index === 0" [class.font-bold]="$index === 0">
                @for (cell of row; track $index) {
                  <td class="border border-blue-200 px-2 py-1">{{ cell }}</td>
                }
              </tr>
            }
          </table>
        </div>
        <div class="flex gap-2 mt-3">
          <button mat-flat-button color="primary" [disabled]="importing()" (click)="confirmImport()">
            @if (importing()) {
              <mat-spinner diameter="18" class="inline-block mr-1" />
              Importando...
            } @else {
              <mat-icon>check</mat-icon>
              Confirmar importación
            }
          </button>
          <button mat-stroked-button (click)="cancelImport()">Cancelar</button>
        </div>
      </div>
    }

    @if (loading) {
      <div class="flex justify-center py-12">
        <mat-spinner diameter="48" />
      </div>
    } @else {
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table mat-table [dataSource]="products" class="w-full">
          <ng-container matColumnDef="id">
            <th mat-header-cell *matHeaderCellDef>ID</th>
            <td mat-cell *matCellDef="let p">{{ p.id }}</td>
          </ng-container>
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Nombre</th>
            <td mat-cell *matCellDef="let p">{{ p.name }}</td>
          </ng-container>
          <ng-container matColumnDef="reference">
            <th mat-header-cell *matHeaderCellDef>Referencia</th>
            <td mat-cell *matCellDef="let p">{{ p.reference || '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="price">
            <th mat-header-cell *matHeaderCellDef>Precio</th>
            <td mat-cell *matCellDef="let p">{{ p.price | currency: 'EUR' }}</td>
          </ng-container>
          <ng-container matColumnDef="quantity">
            <th mat-header-cell *matHeaderCellDef>Stock</th>
            <td mat-cell *matCellDef="let p">{{ p.quantity }}</td>
          </ng-container>
          <ng-container matColumnDef="active">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let p">
              <span [class]="p.active ? 'text-green-600' : 'text-red-500'">
                {{ p.active ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let p">
              <a mat-icon-button [routerLink]="['/products', p.id]">
                <mat-icon>edit</mat-icon>
              </a>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
        </table>
        <mat-paginator
          [length]="totalItems"
          [pageSize]="perPage"
          [pageIndex]="page - 1"
          [pageSizeOptions]="[10, 25, 50]"
          (page)="onPage($event)"
        />
      </div>
    }
  `,
})
export class ProductListComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly snackBar = inject(MatSnackBar);

  products: any[] = [];
  displayedColumns = ['id', 'name', 'reference', 'price', 'quantity', 'active', 'actions'];
  loading = true;
  page = 1;
  perPage = 10;
  totalItems = 0;

  exporting = signal(false);
  importing = signal(false);
  importResult = signal<{ created: number; updated: number; errors: { row: number; error: string }[]; total: number } | null>(null);
  csvPreview = signal<string[][]>([]);

  private pendingFile: File | null = null;

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.api
      .get<ProductListResponse>('/products', { page: this.page, perPage: this.perPage })
      .subscribe((res) => {
        this.products = res.data;
        this.totalItems = res.meta.total;
        this.loading = false;
      });
  }

  onPage(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.perPage = event.pageSize;
    this.loadProducts();
  }

  async exportCsv(): Promise<void> {
    this.exporting.set(true);
    try {
      const blob = await firstValueFrom(this.api.getBlob('/products/export'));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'productos.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      this.snackBar.open('Error al exportar productos', 'Cerrar', { duration: 3000 });
    } finally {
      this.exporting.set(false);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.pendingFile = file;
    this.importResult.set(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string).replace(/^\uFEFF/, '');
      const lines = text.split(/\r?\n/).filter((l) => l.trim()).slice(0, 6); // Preview: header + 5 rows
      const preview = lines.map((line) => this.parseCSVLine(line));
      this.csvPreview.set(preview);
    };
    reader.readAsText(file);

    // Reset file input
    input.value = '';
  }

  cancelImport(): void {
    this.csvPreview.set([]);
    this.pendingFile = null;
  }

  async confirmImport(): Promise<void> {
    if (!this.pendingFile) return;

    this.importing.set(true);
    const formData = new FormData();
    formData.append('file', this.pendingFile);

    try {
      const res = await firstValueFrom(
        this.api.postForm<{ success: boolean; data: any }>('/products/import', formData),
      );
      this.importResult.set(res.data);
      this.csvPreview.set([]);
      this.pendingFile = null;
      this.loadProducts(); // Refresh list
      this.snackBar.open(
        `Importación completada: ${res.data.created} creados, ${res.data.updated} actualizados`,
        'Cerrar',
        { duration: 5000 },
      );
    } catch {
      this.snackBar.open('Error al importar CSV', 'Cerrar', { duration: 3000 });
    } finally {
      this.importing.set(false);
    }
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }
}
