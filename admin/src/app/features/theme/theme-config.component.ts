import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/services/api.service';

interface ThemeConfig {
  THEME_NAME: string;
  THEME_PRIMARY_COLOR: string;
  THEME_SECONDARY_COLOR: string;
  THEME_FONT: string;
  THEME_LOGO_URL: string;
  THEME_FAVICON_URL: string;
  THEME_SHOW_PRICES_WITHOUT_TAX: string;
  THEME_PRODUCTS_PER_PAGE: string;
  THEME_BANNER_TEXT: string;
  THEME_BANNER_SUBTITLE: string;
  THEME_BANNER_IMAGE_URL: string;
}

@Component({
  selector: 'app-theme-config',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
  ],
  template: `
    <div class="max-w-3xl mx-auto">
      <h1 class="text-2xl font-bold mb-6">Apariencia y tema</h1>

      @if (loading()) {
        <div class="flex justify-center py-12">
          <mat-spinner diameter="40" />
        </div>
      } @else {
        <!-- Apariencia -->
        <mat-card class="mb-6">
          <mat-card-header>
            <mat-card-title>
              <mat-icon class="align-middle mr-2">palette</mat-icon>
              Apariencia
            </mat-card-title>
          </mat-card-header>
          <mat-card-content class="pt-4 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">Color primario</label>
                <div class="flex items-center gap-3">
                  <input
                    type="color"
                    [(ngModel)]="config.THEME_PRIMARY_COLOR"
                    class="w-10 h-10 rounded cursor-pointer border"
                  />
                  <mat-form-field appearance="outline" subscriptSizing="dynamic" class="flex-1">
                    <input matInput [(ngModel)]="config.THEME_PRIMARY_COLOR" placeholder="#1a56db" />
                  </mat-form-field>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Color secundario</label>
                <div class="flex items-center gap-3">
                  <input
                    type="color"
                    [(ngModel)]="config.THEME_SECONDARY_COLOR"
                    class="w-10 h-10 rounded cursor-pointer border"
                  />
                  <mat-form-field appearance="outline" subscriptSizing="dynamic" class="flex-1">
                    <input matInput [(ngModel)]="config.THEME_SECONDARY_COLOR" placeholder="#7e3af2" />
                  </mat-form-field>
                </div>
              </div>
            </div>

            <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic">
              <mat-label>Fuente principal</mat-label>
              <mat-select [(ngModel)]="config.THEME_FONT">
                @for (font of availableFonts; track font) {
                  <mat-option [value]="font">{{ font }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic">
              <mat-label>URL del logo</mat-label>
              <input matInput [(ngModel)]="config.THEME_LOGO_URL" placeholder="https://..." />
            </mat-form-field>

            @if (config.THEME_LOGO_URL) {
              <div class="p-3 bg-gray-100 rounded inline-block">
                <img [src]="config.THEME_LOGO_URL" alt="Logo preview" class="max-h-16 max-w-xs object-contain" />
              </div>
            }

            <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic">
              <mat-label>URL del favicon</mat-label>
              <input matInput [(ngModel)]="config.THEME_FAVICON_URL" placeholder="https://.../favicon.ico" />
            </mat-form-field>
          </mat-card-content>
        </mat-card>

        <!-- Catálogo -->
        <mat-card class="mb-6">
          <mat-card-header>
            <mat-card-title>
              <mat-icon class="align-middle mr-2">grid_view</mat-icon>
              Catálogo
            </mat-card-title>
          </mat-card-header>
          <mat-card-content class="pt-4 space-y-4">
            <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic">
              <mat-label>Productos por página</mat-label>
              <mat-select [(ngModel)]="config.THEME_PRODUCTS_PER_PAGE">
                <mat-option value="12">12</mat-option>
                <mat-option value="24">24</mat-option>
                <mat-option value="48">48</mat-option>
              </mat-select>
            </mat-form-field>

            <div class="flex items-center gap-3">
              <mat-slide-toggle
                [checked]="config.THEME_SHOW_PRICES_WITHOUT_TAX === 'true'"
                (change)="config.THEME_SHOW_PRICES_WITHOUT_TAX = $event.checked ? 'true' : 'false'"
              >
                Mostrar precios sin IVA
              </mat-slide-toggle>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Banner principal -->
        <mat-card class="mb-6">
          <mat-card-header>
            <mat-card-title>
              <mat-icon class="align-middle mr-2">image</mat-icon>
              Banner principal
            </mat-card-title>
          </mat-card-header>
          <mat-card-content class="pt-4 space-y-4">
            <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic">
              <mat-label>Texto principal del banner</mat-label>
              <input matInput [(ngModel)]="config.THEME_BANNER_TEXT" placeholder="Bienvenido a nuestra tienda" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic">
              <mat-label>Subtítulo del banner</mat-label>
              <input matInput [(ngModel)]="config.THEME_BANNER_SUBTITLE" placeholder="Descubre nuestra colección" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic">
              <mat-label>URL de imagen de fondo</mat-label>
              <input matInput [(ngModel)]="config.THEME_BANNER_IMAGE_URL" placeholder="https://..." />
            </mat-form-field>

            <!-- Live preview -->
            @if (config.THEME_BANNER_TEXT || config.THEME_BANNER_IMAGE_URL) {
              <div class="mt-4">
                <p class="text-sm text-gray-500 mb-2 font-medium">Previsualización:</p>
                <div
                  class="rounded-lg overflow-hidden relative"
                  style="height: 180px; background-size: cover; background-position: center;"
                  [style.backgroundImage]="config.THEME_BANNER_IMAGE_URL ? 'url(' + config.THEME_BANNER_IMAGE_URL + ')' : 'none'"
                  [style.backgroundColor]="config.THEME_BANNER_IMAGE_URL ? '' : config.THEME_PRIMARY_COLOR"
                >
                  <div class="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white p-4">
                    <h2 class="text-2xl font-bold text-center">{{ config.THEME_BANNER_TEXT }}</h2>
                    <p class="text-center mt-1 opacity-90">{{ config.THEME_BANNER_SUBTITLE }}</p>
                  </div>
                </div>
              </div>
            }
          </mat-card-content>
        </mat-card>

        <div class="flex justify-end gap-3">
          <button mat-button (click)="loadConfig()">Cancelar</button>
          <button mat-flat-button color="primary" (click)="save()" [disabled]="saving()">
            @if (saving()) {
              <mat-spinner diameter="18" class="inline-block mr-2" />
            }
            Guardar cambios
          </button>
        </div>
      }
    </div>
  `,
})
export class ThemeConfigComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly snack = inject(MatSnackBar);

  loading = signal(true);
  saving = signal(false);

  config: ThemeConfig = {
    THEME_NAME: 'default',
    THEME_PRIMARY_COLOR: '#1a56db',
    THEME_SECONDARY_COLOR: '#7e3af2',
    THEME_FONT: 'Inter',
    THEME_LOGO_URL: '',
    THEME_FAVICON_URL: '',
    THEME_SHOW_PRICES_WITHOUT_TAX: 'false',
    THEME_PRODUCTS_PER_PAGE: '12',
    THEME_BANNER_TEXT: 'Bienvenido a DMShop',
    THEME_BANNER_SUBTITLE: 'Descubre nuestra colección',
    THEME_BANNER_IMAGE_URL: '',
  };

  readonly availableFonts = ['Inter', 'Roboto', 'Poppins', 'Open Sans', 'Lato', 'Montserrat', 'Raleway'];

  ngOnInit(): void {
    this.loadConfig();
  }

  async loadConfig(): Promise<void> {
    this.loading.set(true);
    try {
      const data = await firstValueFrom(
        this.api.get<ThemeConfig>('/theme/config')
      );
      this.config = { ...this.config, ...data };
    } catch {
      this.snack.open('Error al cargar la configuración', 'Cerrar', { duration: 3000 });
    } finally {
      this.loading.set(false);
    }
  }

  async save(): Promise<void> {
    this.saving.set(true);
    try {
      await firstValueFrom(this.api.put('/theme/config', this.config));
      this.snack.open('Configuración guardada', 'OK', { duration: 2000 });
    } catch {
      this.snack.open('Error al guardar', 'Cerrar', { duration: 3000 });
    } finally {
      this.saving.set(false);
    }
  }
}
