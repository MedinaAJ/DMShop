import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-address-form',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinner,
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
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Alias (ej. Casa, Trabajo)</label>
          <input
            [(ngModel)]="address.alias"
            name="alias"
            required
            maxlength="32"
            placeholder="Alias (ej. Casa, Trabajo)"
            class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              [(ngModel)]="address.firstName"
              name="firstName"
              required
              placeholder="Nombre"
              class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
            <input
              [(ngModel)]="address.lastName"
              name="lastName"
              required
              placeholder="Apellidos"
              class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Empresa (opcional)</label>
          <input
            [(ngModel)]="address.company"
            name="company"
            placeholder="Empresa (opcional)"
            class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
          <input
            [(ngModel)]="address.address1"
            name="address1"
            required
            placeholder="Dirección"
            class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Dirección línea 2 (opcional)</label>
          <input
            [(ngModel)]="address.address2"
            name="address2"
            placeholder="Dirección línea 2 (opcional)"
            class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Código postal</label>
            <input
              [(ngModel)]="address.postcode"
              name="postcode"
              required
              placeholder="Código postal"
              class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
            <input
              [(ngModel)]="address.city"
              name="city"
              required
              placeholder="Ciudad"
              class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">País</label>
          <select
            [(ngModel)]="address.idCountry"
            name="idCountry"
            required
            (ngModelChange)="onCountryChange()"
            class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
          >
            <option [ngValue]="null" disabled>— Seleccionar país —</option>
            @for (c of countries; track c.id) {
              <option [ngValue]="c.id">{{ c.name }}</option>
            }
          </select>
        </div>

        @if (states.length) {
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Provincia / Estado</label>
            <select
              [(ngModel)]="address.idState"
              name="idState"
              class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
            >
              <option [ngValue]="null">— Seleccionar —</option>
              @for (s of states; track s.id) {
                <option [ngValue]="s.id">{{ s.name }}</option>
              }
            </select>
          </div>
        }

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono fijo</label>
            <input
              [(ngModel)]="address.phone"
              name="phone"
              placeholder="Teléfono fijo"
              class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono móvil</label>
            <input
              [(ngModel)]="address.phoneMobile"
              name="phoneMobile"
              placeholder="Teléfono móvil"
              class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">NIF / CIF</label>
          <input
            [(ngModel)]="address.vatNumber"
            name="vatNumber"
            placeholder="NIF / CIF"
            class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
        </div>

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
