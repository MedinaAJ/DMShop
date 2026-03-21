import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/services/api.service';

interface Lang {
  id: number;
  name: string;
  iso_code: string;
  locale: string;
  active: boolean;
  is_default: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// Common locales for quick selection
const COMMON_LOCALES: { locale: string; label: string }[] = [
  { locale: 'es-ES', label: 'Español (España)' },
  { locale: 'es-MX', label: 'Español (México)' },
  { locale: 'en-GB', label: 'English (UK)' },
  { locale: 'en-US', label: 'English (US)' },
  { locale: 'fr-FR', label: 'Français (France)' },
  { locale: 'de-DE', label: 'Deutsch (Deutschland)' },
  { locale: 'it-IT', label: 'Italiano (Italia)' },
  { locale: 'pt-PT', label: 'Português (Portugal)' },
  { locale: 'pt-BR', label: 'Português (Brasil)' },
  { locale: 'ca-ES', label: 'Català' },
  { locale: 'eu-ES', label: 'Euskara' },
  { locale: 'gl-ES', label: 'Galego' },
];

@Component({
  selector: 'app-languages',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatCardModule,
    MatTooltipModule,
    MatChipsModule,
    MatSelectModule,
  ],
  template: `
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold">Idiomas</h1>
        <p class="text-gray-500 text-sm mt-1">Gestiona los idiomas disponibles en la tienda</p>
      </div>
      <button mat-flat-button color="primary" (click)="openCreateForm()">
        <mat-icon>add</mat-icon> Nuevo idioma
      </button>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-12"><mat-spinner diameter="48" /></div>
    } @else {

      <!-- Languages Table -->
      <mat-card class="mb-6">
        <mat-card-content>
          <table mat-table [dataSource]="langs()" class="w-full">

            <ng-container matColumnDef="id">
              <th mat-header-cell *matHeaderCellDef class="w-12">ID</th>
              <td mat-cell *matCellDef="let l">{{ l.id }}</td>
            </ng-container>

            <ng-container matColumnDef="flag">
              <th mat-header-cell *matHeaderCellDef class="w-12"></th>
              <td mat-cell *matCellDef="let l">
                <span class="text-2xl">{{ getFlagEmoji(l.iso_code) }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Nombre</th>
              <td mat-cell *matCellDef="let l">
                <span class="font-medium">{{ l.name }}</span>
                @if (l.is_default) {
                  <mat-chip color="primary" class="ml-2 text-xs scale-75">Por defecto</mat-chip>
                }
              </td>
            </ng-container>

            <ng-container matColumnDef="iso_code">
              <th mat-header-cell *matHeaderCellDef>ISO</th>
              <td mat-cell *matCellDef="let l">
                <code class="bg-gray-100 px-2 py-0.5 rounded text-sm font-mono">{{ l.iso_code }}</code>
              </td>
            </ng-container>

            <ng-container matColumnDef="locale">
              <th mat-header-cell *matHeaderCellDef>Locale</th>
              <td mat-cell *matCellDef="let l">
                <span class="text-gray-600 text-sm">{{ l.locale }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="active">
              <th mat-header-cell *matHeaderCellDef>Activo</th>
              <td mat-cell *matCellDef="let l">
                <mat-icon [class]="l.active ? 'text-green-600' : 'text-gray-400'">
                  {{ l.active ? 'check_circle' : 'cancel' }}
                </mat-icon>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let l">
                <button mat-icon-button (click)="openEditForm(l)" matTooltip="Editar">
                  <mat-icon>edit</mat-icon>
                </button>
                @if (!l.is_default) {
                  <button
                    mat-icon-button
                    (click)="setDefault(l)"
                    matTooltip="Establecer como predeterminado"
                    class="text-blue-600">
                    <mat-icon>star_border</mat-icon>
                  </button>
                } @else {
                  <button mat-icon-button disabled matTooltip="Idioma predeterminado">
                    <mat-icon class="text-yellow-500">star</mat-icon>
                  </button>
                }
                <button
                  mat-icon-button
                  color="warn"
                  (click)="deleteLang(l)"
                  [disabled]="l.is_default"
                  [matTooltip]="l.is_default ? 'No se puede eliminar el idioma por defecto' : 'Eliminar'">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                [class.bg-blue-50]="row.is_default"></tr>
          </table>

          @if (langs().length === 0) {
            <p class="text-center text-gray-500 py-8">No hay idiomas configurados.</p>
          }
        </mat-card-content>
      </mat-card>

      <!-- Create / Edit Form -->
      @if (showForm()) {
        <mat-card>
          <mat-card-header>
            <mat-card-title>{{ editingLang() ? 'Editar idioma' : 'Nuevo idioma' }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="langForm" (ngSubmit)="saveLang()" class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">

              <mat-form-field>
                <mat-label>Nombre</mat-label>
                <input matInput formControlName="name" placeholder="Español" required />
                <mat-hint>Nombre del idioma en su propio idioma</mat-hint>
              </mat-form-field>

              <mat-form-field>
                <mat-label>Código ISO (2 letras)</mat-label>
                <input matInput formControlName="iso_code" placeholder="es" maxlength="2" required />
                <mat-hint>Ejemplo: es, en, fr, de</mat-hint>
                @if (langForm.get('iso_code')?.hasError('maxlength')) {
                  <mat-error>Máximo 2 caracteres</mat-error>
                }
              </mat-form-field>

              <mat-form-field class="md:col-span-2">
                <mat-label>Locale</mat-label>
                <mat-select formControlName="locale">
                  @for (opt of commonLocales; track opt.locale) {
                    <mat-option [value]="opt.locale">{{ opt.label }} ({{ opt.locale }})</mat-option>
                  }
                  <mat-option value="__custom__">Otro (introducir manualmente)</mat-option>
                </mat-select>
              </mat-form-field>

              @if (langForm.get('locale')?.value === '__custom__') {
                <mat-form-field class="md:col-span-2">
                  <mat-label>Locale personalizado</mat-label>
                  <input matInput formControlName="localeCustom" placeholder="xx-XX" />
                  <mat-hint>Formato BCP 47: idioma-REGIÓN (ej: zh-CN)</mat-hint>
                </mat-form-field>
              }

              <div class="flex items-center gap-6 md:col-span-2">
                <mat-slide-toggle formControlName="active">Activo</mat-slide-toggle>
                <mat-slide-toggle formControlName="is_default">Idioma por defecto</mat-slide-toggle>
              </div>

              <div class="flex gap-3 md:col-span-2 mt-2">
                <button mat-flat-button color="primary" type="submit"
                        [disabled]="langForm.invalid || saving()">
                  @if (saving()) {
                    <mat-spinner diameter="20" class="inline-block mr-2"></mat-spinner>
                  }
                  Guardar
                </button>
                <button mat-button type="button" (click)="cancelForm()">Cancelar</button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      }
    }
  `,
})
export class LanguagesComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  readonly langs = signal<Lang[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly showForm = signal(false);
  readonly editingLang = signal<Lang | null>(null);

  readonly commonLocales = COMMON_LOCALES;
  displayedColumns = ['id', 'flag', 'name', 'iso_code', 'locale', 'active', 'actions'];

  langForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    iso_code: ['', [Validators.required, Validators.maxLength(2), Validators.pattern(/^[a-zA-Z]{2}$/)]],
    locale: ['es-ES', Validators.required],
    localeCustom: [''],
    active: [true],
    is_default: [false],
  });

  ngOnInit() {
    this.loadLangs();
  }

  async loadLangs() {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(this.api.get<ApiResponse<Lang[]>>('/langs'));
      this.langs.set(res.data);
    } catch {
      this.snackBar.open('Error al cargar los idiomas', 'Cerrar', { duration: 3000 });
    } finally {
      this.loading.set(false);
    }
  }

  getFlagEmoji(isoCode: string): string {
    const code = isoCode.toUpperCase();
    const flags: Record<string, string> = {
      ES: '🇪🇸', EN: '🇬🇧', FR: '🇫🇷', DE: '🇩🇪',
      IT: '🇮🇹', PT: '🇵🇹', CA: '🏴󠁥󠁳󠁣󠁴󠁿', EU: '🏔️',
      ZH: '🇨🇳', JA: '🇯🇵', AR: '🇸🇦', RU: '🇷🇺',
    };
    return flags[code] ?? '🌐';
  }

  openCreateForm() {
    this.editingLang.set(null);
    this.langForm.reset({ name: '', iso_code: '', locale: 'es-ES', localeCustom: '', active: true, is_default: false });
    this.showForm.set(true);
  }

  openEditForm(lang: Lang) {
    this.editingLang.set(lang);
    const isCommon = COMMON_LOCALES.some(l => l.locale === lang.locale);
    this.langForm.setValue({
      name: lang.name,
      iso_code: lang.iso_code,
      locale: isCommon ? lang.locale : '__custom__',
      localeCustom: isCommon ? '' : lang.locale,
      active: lang.active,
      is_default: lang.is_default,
    });
    this.showForm.set(true);
  }

  cancelForm() {
    this.showForm.set(false);
    this.editingLang.set(null);
  }

  private getLocaleValue(): string {
    const locale = this.langForm.get('locale')?.value;
    if (locale === '__custom__') {
      return this.langForm.get('localeCustom')?.value ?? '';
    }
    return locale;
  }

  async saveLang() {
    if (this.langForm.invalid) return;
    this.saving.set(true);

    const { name, iso_code, active, is_default } = this.langForm.value;
    const locale = this.getLocaleValue();
    const payload = { name, iso_code, locale, active, is_default };

    try {
      const editing = this.editingLang();
      if (editing) {
        await firstValueFrom(this.api.put<ApiResponse<Lang>>(`/langs/${editing.id}`, payload));
        this.snackBar.open('Idioma actualizado', 'OK', { duration: 2500 });
      } else {
        await firstValueFrom(this.api.post<ApiResponse<Lang>>('/langs', payload));
        this.snackBar.open('Idioma creado', 'OK', { duration: 2500 });
      }
      this.showForm.set(false);
      this.editingLang.set(null);
      await this.loadLangs();
    } catch (err: any) {
      const msg = err?.error?.message ?? 'Error al guardar el idioma';
      this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
    } finally {
      this.saving.set(false);
    }
  }

  async setDefault(lang: Lang) {
    if (!confirm(`¿Establecer "${lang.name}" como idioma por defecto?`)) return;
    try {
      await firstValueFrom(this.api.put<ApiResponse<Lang>>(`/langs/${lang.id}`, { is_default: true }));
      this.snackBar.open(`"${lang.name}" es ahora el idioma por defecto`, 'OK', { duration: 2500 });
      await this.loadLangs();
    } catch {
      this.snackBar.open('Error al cambiar el idioma por defecto', 'Cerrar', { duration: 3000 });
    }
  }

  async deleteLang(lang: Lang) {
    if (lang.is_default) return;
    if (!confirm(`¿Eliminar el idioma "${lang.name}"? Esto puede afectar a las traducciones existentes.`)) return;
    try {
      await firstValueFrom(this.api.delete(`/langs/${lang.id}`));
      this.snackBar.open('Idioma eliminado', 'OK', { duration: 2500 });
      await this.loadLangs();
    } catch (err: any) {
      const msg = err?.error?.message ?? 'Error al eliminar el idioma';
      this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
    }
  }
}
