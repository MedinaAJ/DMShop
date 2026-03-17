import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-address-form',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="flex items-center gap-3 mb-6">
      <a mat-icon-button routerLink="/account/addresses"><mat-icon>arrow_back</mat-icon></a>
      <h2 class="text-xl font-semibold">{{ isNew ? 'Nueva dirección' : 'Editar dirección' }}</h2>
    </div>

    @if (loading) {
      <div class="flex justify-center py-12"><mat-spinner diameter="40" /></div>
    } @else {
      <form (ngSubmit)="onSubmit()" class="max-w-lg space-y-4">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Alias (ej. Casa, Trabajo)</mat-label>
          <input matInput [(ngModel)]="address.alias" name="alias" required maxlength="32" />
        </mat-form-field>

        <div class="grid grid-cols-2 gap-4">
          <mat-form-field appearance="outline">
            <mat-label>Nombre</mat-label>
            <input matInput [(ngModel)]="address.firstName" name="firstName" required />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Apellidos</mat-label>
            <input matInput [(ngModel)]="address.lastName" name="lastName" required />
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Empresa (opcional)</mat-label>
          <input matInput [(ngModel)]="address.company" name="company" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Dirección</mat-label>
          <input matInput [(ngModel)]="address.address1" name="address1" required />
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Dirección línea 2 (opcional)</mat-label>
          <input matInput [(ngModel)]="address.address2" name="address2" />
        </mat-form-field>

        <div class="grid grid-cols-2 gap-4">
          <mat-form-field appearance="outline">
            <mat-label>Código postal</mat-label>
            <input matInput [(ngModel)]="address.postcode" name="postcode" required />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Ciudad</mat-label>
            <input matInput [(ngModel)]="address.city" name="city" required />
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>País</mat-label>
          <mat-select
            [(ngModel)]="address.idCountry"
            name="idCountry"
            required
            (selectionChange)="onCountryChange()"
          >
            @for (c of countries; track c.id) {
              <mat-option [value]="c.id">{{ c.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        @if (states.length) {
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Provincia / Estado</mat-label>
            <mat-select [(ngModel)]="address.idState" name="idState">
              <mat-option [value]="null">— Seleccionar —</mat-option>
              @for (s of states; track s.id) {
                <mat-option [value]="s.id">{{ s.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        }

        <div class="grid grid-cols-2 gap-4">
          <mat-form-field appearance="outline">
            <mat-label>Teléfono fijo</mat-label>
            <input matInput [(ngModel)]="address.phone" name="phone" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Teléfono móvil</mat-label>
            <input matInput [(ngModel)]="address.phoneMobile" name="phoneMobile" />
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>NIF / CIF</mat-label>
          <input matInput [(ngModel)]="address.vatNumber" name="vatNumber" />
        </mat-form-field>

        <div class="flex gap-3 pt-2">
          <button mat-flat-button color="primary" type="submit" [disabled]="saving">
            @if (saving) {
              <mat-spinner diameter="20" class="inline-block" />
            } @else {
              {{ isNew ? 'Crear' : 'Guardar' }}
            }
          </button>
          <a mat-button routerLink="/account/addresses">Cancelar</a>
        </div>
      </form>
    }
  `,
})
export class AddressFormComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  isNew = true;
  loading = false;
  saving = false;
  countries: any[] = [];
  states: any[] = [];

  address: any = {
    alias: '',
    firstName: '',
    lastName: '',
    company: null,
    address1: '',
    address2: null,
    city: '',
    postcode: '',
    idCountry: null,
    idState: null,
    phone: null,
    phoneMobile: null,
    vatNumber: null,
  };

  ngOnInit(): void {
    this.api.get<any>('/geo/countries').subscribe((r) => (this.countries = r.data || []));

    const id = this.route.snapshot.params['id'];
    if (id && id !== 'new') {
      this.isNew = false;
      this.loading = true;
      this.api.get<any>(`/addresses/${id}`).subscribe({
        next: (res) => {
          this.address = res.data;
          this.loading = false;
          if (this.address.idCountry) this.loadStates(this.address.idCountry);
        },
        error: () => {
          this.snackBar.open('Dirección no encontrada', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/account/addresses']);
        },
      });
    }
  }

  onCountryChange(): void {
    this.address.idState = null;
    this.states = [];
    if (this.address.idCountry) {
      this.loadStates(this.address.idCountry);
    }
  }

  private loadStates(countryId: number): void {
    this.api.get<any>('/geo/states', { idCountry: countryId }).subscribe((r) => {
      this.states = r.data || [];
    });
  }

  onSubmit(): void {
    this.saving = true;
    const obs = this.isNew
      ? this.api.post('/addresses', this.address)
      : this.api.put(`/addresses/${this.address.id}`, this.address);

    obs.subscribe({
      next: () => {
        this.snackBar.open(this.isNew ? 'Dirección creada' : 'Dirección actualizada', 'OK', {
          duration: 2000,
        });
        this.router.navigate(['/account/addresses']);
      },
      error: () => {
        this.snackBar.open('Error al guardar', 'Cerrar', { duration: 3000 });
        this.saving = false;
      },
    });
  }
}
