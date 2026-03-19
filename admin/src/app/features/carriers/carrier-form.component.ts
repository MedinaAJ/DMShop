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
import { CurrencyPipe } from '@angular/common';
import { ApiService } from '../../core/services/api.service';

interface RangePrice {
  idZone: number;
  zoneName: string;
  price: number;
}

interface CarrierRange {
  delimiter1: number;
  delimiter2: number;
  prices: RangePrice[];
}

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
    CurrencyPipe,
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
      <form (ngSubmit)="onSubmit()" class="max-w-3xl space-y-4">
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
            <mat-label>URL Tracking (usa &#64; para el número)</mat-label>
            <input
              matInput
              [(ngModel)]="item.url"
              name="url"
              placeholder="https://tracking.correos.es/?tracking=&#64;"
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

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Envío gratuito a partir de (€) — deja vacío para desactivar</mat-label>
          <input matInput type="number" [(ngModel)]="item.freeShippingStartsAt" name="freeShippingStartsAt" min="0" step="0.01" />
          <mat-hint>Si el total del pedido supera este importe, el envío será gratuito.</mat-hint>
        </mat-form-field>

        <!-- Rangos de precio -->
        <div class="mt-6">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold">Rangos de precio por zona</h3>
            <button mat-stroked-button type="button" (click)="addRange()">
              <mat-icon>add</mat-icon> Añadir rango
            </button>
          </div>

          @if (ranges.length === 0) {
            <p class="text-gray-500 text-sm py-2">Sin rangos definidos. El transportista usará precio libre o gratuito.</p>
          }

          @for (range of ranges; track $index) {
            <div class="border rounded-lg p-4 mb-3 bg-gray-50">
              <div class="flex items-center gap-4 mb-3">
                <mat-form-field appearance="outline" class="w-32">
                  <mat-label>Desde ({{ item.shippingMethod === 'weight' ? 'kg' : '€' }})</mat-label>
                  <input matInput type="number" [(ngModel)]="range.delimiter1" [name]="'d1_' + $index" step="0.01" min="0" />
                </mat-form-field>
                <mat-form-field appearance="outline" class="w-32">
                  <mat-label>Hasta ({{ item.shippingMethod === 'weight' ? 'kg' : '€' }})</mat-label>
                  <input matInput type="number" [(ngModel)]="range.delimiter2" [name]="'d2_' + $index" step="0.01" min="0" />
                </mat-form-field>
                <button mat-icon-button type="button" color="warn" (click)="removeRange($index)">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                @for (price of range.prices; track price.idZone) {
                  <mat-form-field appearance="outline">
                    <mat-label>{{ price.zoneName }} (€)</mat-label>
                    <input matInput type="number" [(ngModel)]="price.price" [name]="'p_' + $index + '_' + price.idZone" step="0.01" min="0" />
                  </mat-form-field>
                }
              </div>
            </div>
          }
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
  ranges: CarrierRange[] = [];

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
    freeShippingStartsAt: null,
  };

  ngOnInit(): void {
    this.api.get<any>('/geo/zones').subscribe((res) => {
      this.allZones = res.data;
    });
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
            freeShippingStartsAt: c.free_shipping_starts_at != null ? parseFloat(c.free_shipping_starts_at) : null,
          };
          (c.zones || []).forEach((z: any) => this.selectedZones.add(z.id));

          // Populate ranges from existing carrier data
          // After zones are loaded, build ranges with zone prices
          this.populateRanges(c.ranges || []);

          this.loading = false;
        },
        error: () => {
          this.snackBar.open('No encontrado', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/carriers']);
        },
      });
    }
  }

  private populateRanges(serverRanges: any[]): void {
    // Wait for allZones to be available; if not yet, retry after a tick
    if (this.allZones.length === 0 && serverRanges.length > 0) {
      setTimeout(() => this.populateRanges(serverRanges), 100);
      return;
    }

    this.ranges = serverRanges.map((r: any) => {
      const serverPrices: any[] = r.prices || [];
      const prices: RangePrice[] = this.buildZonePrices(serverPrices);
      return {
        delimiter1: Number(r.delimiter1),
        delimiter2: Number(r.delimiter2),
        prices,
      };
    });
  }

  private buildZonePrices(serverPrices: any[]): RangePrice[] {
    return this.allZones
      .filter((z) => this.selectedZones.size === 0 || this.selectedZones.has(z.id))
      .map((z) => {
        const existing = serverPrices.find(
          (p: any) => (p.id_zone || p.idZone) === z.id,
        );
        return {
          idZone: z.id,
          zoneName: z.name,
          price: existing ? Number(existing.price) : 0,
        };
      });
  }

  toggleZone(id: number, checked: boolean): void {
    if (checked) this.selectedZones.add(id);
    else this.selectedZones.delete(id);
    // Rebuild zone prices in all ranges to include/exclude this zone
    this.syncRangeZones();
  }

  private syncRangeZones(): void {
    for (const range of this.ranges) {
      const existingPriceMap = new Map(range.prices.map((p) => [p.idZone, p.price]));
      range.prices = this.allZones
        .filter((z) => this.selectedZones.has(z.id))
        .map((z) => ({
          idZone: z.id,
          zoneName: z.name,
          price: existingPriceMap.get(z.id) ?? 0,
        }));
    }
  }

  addRange(): void {
    const lastRange = this.ranges[this.ranges.length - 1];
    const from = lastRange ? lastRange.delimiter2 : 0;
    const prices: RangePrice[] = Array.from(this.selectedZones).map((zoneId) => {
      const zone = this.allZones.find((z) => z.id === zoneId);
      return { idZone: zoneId, zoneName: zone?.name ?? `Zona ${zoneId}`, price: 0 };
    });
    this.ranges.push({ delimiter1: from, delimiter2: from + 100, prices });
  }

  removeRange(index: number): void {
    this.ranges.splice(index, 1);
  }

  onSubmit(): void {
    this.saving = true;
    const serializedRanges = this.ranges.map((r) => ({
      delimiter1: Number(r.delimiter1),
      delimiter2: Number(r.delimiter2),
      prices: r.prices.map((p) => ({
        idZone: p.idZone,
        price: Number(p.price),
      })),
    }));

    const body = { ...this.item, zones: Array.from(this.selectedZones), ranges: serializedRanges };
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
