import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { ApiService } from '../../core/services/api.service';
import { firstValueFrom } from 'rxjs';
import { catchError, of } from 'rxjs';

interface TranslationEntry {
  key: string;
  value: string;
  dirty: boolean;
}

@Component({
  selector: 'app-translations',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatCardModule,
  ],
  template: `
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Traducciones</h1>
      <div class="flex gap-2">
        <button
          mat-flat-button
          color="primary"
          [disabled]="saving()"
          (click)="saveCurrentLang()"
        >
          <mat-icon>save</mat-icon>
          {{ saving() ? 'Guardando...' : 'Guardar cambios' }}
        </button>
      </div>
    </div>

    <mat-card>
      <mat-card-content>
        <mat-tab-group (selectedTabChange)="onTabChange($event.index)">
          <mat-tab label="Español (es)">
            <ng-container *ngTemplateOutlet="translationTable" />
          </mat-tab>
          <mat-tab label="Inglés (en)">
            <ng-container *ngTemplateOutlet="translationTable" />
          </mat-tab>
        </mat-tab-group>
      </mat-card-content>
    </mat-card>

    <ng-template #translationTable>
      @if (loading()) {
        <div class="flex justify-center py-8">
          <mat-spinner diameter="40" />
        </div>
      } @else {
        <div class="mt-4">
          <!-- Search -->
          <mat-form-field appearance="outline" class="w-full mb-4">
            <mat-label>Buscar clave o valor</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input matInput [(ngModel)]="searchTerm" (ngModelChange)="filterEntries()" placeholder="ej: nav.home" />
          </mat-form-field>

          <!-- Translation list -->
          <div class="space-y-2 max-h-[600px] overflow-y-auto pr-2">
            @for (entry of filteredEntries(); track entry.key) {
              <div class="flex items-center gap-3 py-2 border-b" [class.bg-yellow-50]="entry.dirty">
                <span class="w-48 shrink-0 font-mono text-xs text-gray-500 break-all">{{ entry.key }}</span>
                <mat-form-field appearance="outline" class="flex-1 !mb-0">
                  <input
                    matInput
                    [(ngModel)]="entry.value"
                    (ngModelChange)="markDirty(entry)"
                    [placeholder]="entry.key"
                  />
                </mat-form-field>
                @if (entry.dirty) {
                  <mat-icon class="text-yellow-600 shrink-0">edit</mat-icon>
                }
              </div>
            }
            @if (filteredEntries().length === 0) {
              <p class="text-gray-500 py-8 text-center">No se encontraron traducciones.</p>
            }
          </div>

          <div class="mt-4 text-sm text-gray-400">
            {{ filteredEntries().length }} / {{ entries().length }} claves
          </div>
        </div>
      }
    </ng-template>
  `,
})
export class TranslationsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly snackBar = inject(MatSnackBar);

  readonly entries = signal<TranslationEntry[]>([]);
  readonly filteredEntries = signal<TranslationEntry[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);

  currentLang = 'es';
  searchTerm = '';

  private readonly LANGS = ['es', 'en'];

  ngOnInit(): void {
    this.loadTranslations('es');
  }

  onTabChange(index: number): void {
    this.currentLang = this.LANGS[index] ?? 'es';
    this.searchTerm = '';
    this.loadTranslations(this.currentLang);
  }

  private loadTranslations(lang: string): void {
    this.loading.set(true);
    this.api
      .get<{ success: boolean; data: Record<string, string> }>(`/translations/${lang}`)
      .pipe(catchError(() => of({ success: false, data: {} })))
      .subscribe((res) => {
        const data = res.data ?? {};
        const list: TranslationEntry[] = Object.entries(data).map(([key, value]) => ({
          key,
          value,
          dirty: false,
        }));
        // Sort by key
        list.sort((a, b) => a.key.localeCompare(b.key));
        this.entries.set(list);
        this.filterEntries();
        this.loading.set(false);
      });
  }

  filterEntries(): void {
    const term = this.searchTerm.toLowerCase();
    if (!term) {
      this.filteredEntries.set(this.entries());
      return;
    }
    this.filteredEntries.set(
      this.entries().filter(
        (e) => e.key.toLowerCase().includes(term) || e.value.toLowerCase().includes(term),
      ),
    );
  }

  markDirty(entry: TranslationEntry): void {
    entry.dirty = true;
    this.entries.set([...this.entries()]);
    this.filterEntries();
  }

  async saveCurrentLang(): Promise<void> {
    this.saving.set(true);
    try {
      const translations: Record<string, string> = {};
      for (const entry of this.entries()) {
        translations[entry.key] = entry.value;
      }

      await firstValueFrom(
        this.api.put(`/translations/admin/${this.currentLang}`, { translations }),
      );

      // Mark all as clean
      this.entries.update((entries) => entries.map((e) => ({ ...e, dirty: false })));
      this.filterEntries();
      this.snackBar.open('Traducciones guardadas', 'OK', { duration: 3000 });
    } catch {
      this.snackBar.open('Error al guardar las traducciones', 'OK', { duration: 4000 });
    } finally {
      this.saving.set(false);
    }
  }
}
