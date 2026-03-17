import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-geo-management',
  standalone: true,
  imports: [
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatExpansionModule,
  ],
  template: `
    <h1 class="text-2xl font-bold mb-6">Gestión geográfica</h1>

    <mat-tab-group>
      <!-- Zonas -->
      <mat-tab label="Zonas">
        <div class="mt-4 space-y-4">
          <div class="bg-white rounded-lg shadow overflow-hidden">
            <table mat-table [dataSource]="zones" class="w-full">
              <ng-container matColumnDef="id">
                <th mat-header-cell *matHeaderCellDef>ID</th>
                <td mat-cell *matCellDef="let z">{{ z.id }}</td>
              </ng-container>
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Nombre</th>
                <td mat-cell *matCellDef="let z">{{ z.name }}</td>
              </ng-container>
              <ng-container matColumnDef="active">
                <th mat-header-cell *matHeaderCellDef>Estado</th>
                <td mat-cell *matCellDef="let z">
                  <span [class]="z.active ? 'text-green-600' : 'text-red-500'">
                    {{ z.active ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let z">
                  <button mat-icon-button color="warn" (click)="removeZone(z.id)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="['id', 'name', 'active', 'actions']"></tr>
              <tr mat-row *matRowDef="let row; columns: ['id', 'name', 'active', 'actions']"></tr>
            </table>
          </div>

          <div class="flex items-end gap-3 bg-gray-50 rounded-lg p-4 max-w-lg">
            <mat-form-field appearance="outline" class="flex-1 !mb-0">
              <mat-label>Nueva zona</mat-label>
              <input matInput [(ngModel)]="newZone.name" name="newZoneName" />
            </mat-form-field>
            <mat-slide-toggle [(ngModel)]="newZone.active" name="newZoneActive" class="!mb-4"
              >Activa</mat-slide-toggle
            >
            <button mat-flat-button color="primary" (click)="addZone()" class="!mb-2">
              Añadir
            </button>
          </div>
        </div>
      </mat-tab>

      <!-- Países -->
      <mat-tab label="Países">
        <div class="mt-4 space-y-4">
          <div class="bg-white rounded-lg shadow overflow-hidden">
            <table mat-table [dataSource]="countries" class="w-full">
              <ng-container matColumnDef="id">
                <th mat-header-cell *matHeaderCellDef>ID</th>
                <td mat-cell *matCellDef="let c">{{ c.id }}</td>
              </ng-container>
              <ng-container matColumnDef="isoCode">
                <th mat-header-cell *matHeaderCellDef>ISO</th>
                <td mat-cell *matCellDef="let c">{{ c.iso_code }}</td>
              </ng-container>
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Nombre</th>
                <td mat-cell *matCellDef="let c">{{ c.name }}</td>
              </ng-container>
              <ng-container matColumnDef="zone">
                <th mat-header-cell *matHeaderCellDef>Zona</th>
                <td mat-cell *matCellDef="let c">{{ c.zone?.name }}</td>
              </ng-container>
              <ng-container matColumnDef="active">
                <th mat-header-cell *matHeaderCellDef>Estado</th>
                <td mat-cell *matCellDef="let c">
                  <span [class]="c.active ? 'text-green-600' : 'text-red-500'">
                    {{ c.active ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let c">
                  <button mat-icon-button color="warn" (click)="removeCountry(c.id)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="countryCols"></tr>
              <tr mat-row *matRowDef="let row; columns: countryCols"></tr>
            </table>
          </div>

          <mat-expansion-panel class="max-w-xl">
            <mat-expansion-panel-header>
              <mat-panel-title>Añadir país</mat-panel-title>
            </mat-expansion-panel-header>
            <div class="space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <mat-form-field appearance="outline">
                  <mat-label>Nombre</mat-label>
                  <input matInput [(ngModel)]="newCountry.name" name="ncName" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Código ISO (2)</mat-label>
                  <input matInput [(ngModel)]="newCountry.isoCode" name="ncIso" maxlength="2" />
                </mat-form-field>
              </div>
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Zona</mat-label>
                <mat-select [(ngModel)]="newCountry.idZone" name="ncZone">
                  @for (z of zones; track z.id) {
                    <mat-option [value]="z.id">{{ z.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <button mat-flat-button color="primary" (click)="addCountry()">Añadir país</button>
            </div>
          </mat-expansion-panel>
        </div>
      </mat-tab>

      <!-- Estados/Provincias -->
      <mat-tab label="Estados / Provincias">
        <div class="mt-4 space-y-4">
          <mat-form-field appearance="outline">
            <mat-label>Filtrar por país</mat-label>
            <mat-select
              [(ngModel)]="selectedCountryId"
              name="stateFilter"
              (selectionChange)="loadStates()"
            >
              @for (c of countries; track c.id) {
                <mat-option [value]="c.id">{{ c.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          @if (states.length) {
            <div class="bg-white rounded-lg shadow overflow-hidden">
              <table mat-table [dataSource]="states" class="w-full">
                <ng-container matColumnDef="id">
                  <th mat-header-cell *matHeaderCellDef>ID</th>
                  <td mat-cell *matCellDef="let s">{{ s.id }}</td>
                </ng-container>
                <ng-container matColumnDef="isoCode">
                  <th mat-header-cell *matHeaderCellDef>ISO</th>
                  <td mat-cell *matCellDef="let s">{{ s.iso_code }}</td>
                </ng-container>
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Nombre</th>
                  <td mat-cell *matCellDef="let s">{{ s.name }}</td>
                </ng-container>
                <ng-container matColumnDef="active">
                  <th mat-header-cell *matHeaderCellDef>Estado</th>
                  <td mat-cell *matCellDef="let s">
                    <span [class]="s.active ? 'text-green-600' : 'text-red-500'">
                      {{ s.active ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="['id', 'isoCode', 'name', 'active']"></tr>
                <tr mat-row *matRowDef="let row; columns: ['id', 'isoCode', 'name', 'active']"></tr>
              </table>
            </div>
          } @else if (selectedCountryId) {
            <p class="text-gray-500">No hay estados para este país.</p>
          }
        </div>
      </mat-tab>
    </mat-tab-group>
  `,
})
export class GeoManagementComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly snackBar = inject(MatSnackBar);

  zones: any[] = [];
  countries: any[] = [];
  states: any[] = [];
  countryCols = ['id', 'isoCode', 'name', 'zone', 'active', 'actions'];
  selectedCountryId: number | null = null;

  newZone = { name: '', active: true };
  newCountry = { name: '', isoCode: '', idZone: null as number | null };

  ngOnInit(): void {
    this.loadZones();
    this.loadCountries();
  }

  loadZones(): void {
    this.api.get<any>('/geo/zones').subscribe((res) => (this.zones = res.data));
  }

  loadCountries(): void {
    this.api.get<any>('/geo/countries').subscribe((res) => (this.countries = res.data));
  }

  loadStates(): void {
    if (!this.selectedCountryId) return;
    this.api
      .get<any>('/geo/states', { idCountry: this.selectedCountryId })
      .subscribe((res) => (this.states = res.data));
  }

  addZone(): void {
    if (!this.newZone.name) return;
    this.api.post('/geo/zones', this.newZone).subscribe(() => {
      this.snackBar.open('Zona creada', 'OK', { duration: 2000 });
      this.newZone = { name: '', active: true };
      this.loadZones();
    });
  }

  removeZone(id: number): void {
    if (!confirm('¿Eliminar esta zona?')) return;
    this.api.delete(`/geo/zones/${id}`).subscribe(() => {
      this.snackBar.open('Zona eliminada', 'OK', { duration: 2000 });
      this.loadZones();
    });
  }

  addCountry(): void {
    if (!this.newCountry.name || !this.newCountry.isoCode) return;
    this.api.post('/geo/countries', this.newCountry).subscribe(() => {
      this.snackBar.open('País creado', 'OK', { duration: 2000 });
      this.newCountry = { name: '', isoCode: '', idZone: null };
      this.loadCountries();
    });
  }

  removeCountry(id: number): void {
    if (!confirm('¿Eliminar este país?')) return;
    this.api.delete(`/geo/countries/${id}`).subscribe(() => {
      this.snackBar.open('País eliminado', 'OK', { duration: 2000 });
      this.loadCountries();
    });
  }
}
