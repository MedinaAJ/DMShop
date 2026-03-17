import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-carrier-form',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
  ],
  template: `
    <div class="flex items-center gap-4 mb-6">
      <a mat-icon-button routerLink="/carriers"><mat-icon>arrow_back</mat-icon></a>
      <h1 class="text-2xl font-bold">
        {{ isNew ? 'Nuevo transportista' : 'Editar transportista' }}
      </h1>
    </div>

    @if (loading) {
      <div class="flex justify-center py-12"><mat-spinner diameter="48" /></div>
    } @else {
      <form (ngSubmit)="onSubmit()" class="max-w-2xl space-y-4">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Nombre</mat-label>
          <input matInput [(ngModel)]="item.name" name="name" required />
        </mat-form-field>

        <div class="grid grid-cols-2 gap-4">
          <mat-form-field appearance="outline">
            <mat-label>Plazo de entrega (días)</mat-label>
            <input matInput type="number" [(ngModel)]="item.delay" name="delay" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Método de envío</mat-label>
            <mat-select [(ngModel)]="item.shippingMethod" name="shippingMethod">
              <mat-option value="price">Por precio</mat-option>
              <mat-option value="weight">Por peso</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <mat-form-field appearance="outline">
            <mat-label>Grupo de reglas fiscales</mat-label>
            <mat-select [(ngModel)]="item.idTaxRulesGroup" name="idTaxRulesGroup">
              @for (g of taxGroups; track g.id) {
                <mat-option [value]="g.id">{{ g.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>URL Tracking</mat-label>
            <input
              matInput
              [(ngModel)]="item.url"
              name="url"
              placeholder="https://tracking.com/@@"
            />
          </mat-form-field>
        </div>

        <div class="grid grid-cols-4 gap-4">
          <mat-form-field appearance="outline">
            <mat-label>Ancho máx.</mat-label>
            <input matInput type="number" [(ngModel)]="item.maxWidth" name="maxWidth" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Alto máx.</mat-label>
            <input matInput type="number" [(ngModel)]="item.maxHeight" name="maxHeight" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Fondo máx.</mat-label>
            <input matInput type="number" [(ngModel)]="item.maxDepth" name="maxDepth" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Peso máx. (kg)</mat-label>
            <input
              matInput
              type="number"
              [(ngModel)]="item.maxWeight"
              name="maxWeight"
              step="0.001"
            />
          </mat-form-field>
        </div>

        <h3 class="font-semibold">Zonas de envío</h3>
        <div class="flex flex-wrap gap-3">
          @for (z of allZones; track z.id) {
            <mat-checkbox
              [checked]="selectedZones.has(z.id)"
              (change)="toggleZone(z.id, $event.checked)"
            >
              {{ z.name }}
            </mat-checkbox>
          }
        </div>

        <div class="flex items-center gap-4">
          <mat-slide-toggle [(ngModel)]="item.active" name="active" color="primary">
            Activo
          </mat-slide-toggle>
          <mat-slide-toggle [(ngModel)]="item.isFree" name="isFree" color="primary">
            Envío gratuito
          </mat-slide-toggle>
        </div>

        <div class="flex gap-3 pt-4">
          <button mat-flat-button color="primary" type="submit" [disabled]="saving">
            {{ isNew ? 'Crear' : 'Guardar' }}
          </button>
          <a mat-button routerLink="/carriers">Cancelar</a>
        </div>
      </form>
    }
  `,
})
export class CarrierFormComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  isNew = true;
  loading = false;
  saving = false;
  itemId: number | null = null;
  allZones: any[] = [];
  taxGroups: any[] = [];
  selectedZones = new Set<number>();

  item: any = {
    name: '',
    delay: 3,
    shippingMethod: 'price',
    idTaxRulesGroup: null,
    url: '',
    maxWidth: 0,
    maxHeight: 0,
    maxDepth: 0,
    maxWeight: 0,
    active: true,
    isFree: false,
  };

  ngOnInit(): void {
    this.api.get<any>('/geo/zones').subscribe((res) => (this.allZones = res.data));
    this.api.get<any>('/tax/groups').subscribe((res) => (this.taxGroups = res.data));

    const id = this.route.snapshot.params['id'];
    if (id && id !== 'new') {
      this.isNew = false;
      this.itemId = +id;
      this.loading = true;
      this.api.get<any>(`/carriers/${id}`).subscribe({
        next: (res) => {
          const c = res.data;
          this.item = {
            name: c.name,
            delay: c.delay,
            shippingMethod: c.shipping_method || c.shippingMethod || 'price',
            idTaxRulesGroup: c.id_tax_rules_group || c.idTaxRulesGroup,
            url: c.url || '',
            maxWidth: c.max_width || c.maxWidth || 0,
            maxHeight: c.max_height || c.maxHeight || 0,
            maxDepth: c.max_depth || c.maxDepth || 0,
            maxWeight: parseFloat(c.max_weight || c.maxWeight || 0),
            active: c.active,
            isFree: c.is_free || c.isFree || false,
          };
          (c.zones || []).forEach((z: any) => this.selectedZones.add(z.id));
          this.loading = false;
        },
        error: () => {
          this.snackBar.open('No encontrado', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/carriers']);
        },
      });
    }
  }

  toggleZone(id: number, checked: boolean): void {
    if (checked) this.selectedZones.add(id);
    else this.selectedZones.delete(id);
  }

  onSubmit(): void {
    this.saving = true;
    const body = { ...this.item, zones: Array.from(this.selectedZones), ranges: [] };
    const obs = this.isNew
      ? this.api.post('/carriers', body)
      : this.api.put(`/carriers/${this.itemId}`, body);

    obs.subscribe({
      next: () => {
        this.snackBar.open(
          this.isNew ? 'Transportista creado' : 'Transportista actualizado',
          'OK',
          { duration: 3000 },
        );
        this.router.navigate(['/carriers']);
      },
      error: () => {
        this.snackBar.open('Error al guardar', 'Cerrar', { duration: 3000 });
        this.saving = false;
      },
    });
  }
}
