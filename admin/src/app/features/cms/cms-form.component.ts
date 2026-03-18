import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../core/services/api.service';
import { firstValueFrom } from 'rxjs';
@Component({
  selector: 'app-cms-form',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="flex items-center gap-3 mb-6">
      <a mat-icon-button routerLink="/cms"><mat-icon>arrow_back</mat-icon></a>
      <h1 class="text-2xl font-bold">{{ isNew() ? 'Nueva página' : 'Editar página' }}</h1>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-12"><mat-spinner diameter="48" /></div>
    } @else {
      <div class="bg-white rounded-lg shadow p-6 max-w-3xl">
        <div class="space-y-4">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Título</mat-label>
            <input
              matInput
              [(ngModel)]="title"
              (ngModelChange)="onTitleChange($event)"
              placeholder="Ej: Aviso legal"
              required
            />
          </mat-form-field>

          <div class="flex gap-3">
            <mat-form-field appearance="outline" class="flex-1">
              <mat-label>Slug (URL)</mat-label>
              <input
                matInput
                [(ngModel)]="slug"
                [readonly]="!slugEditable()"
                placeholder="aviso-legal"
              />
            </mat-form-field>
            <button
              mat-icon-button
              type="button"
              [title]="slugEditable() ? 'Bloquear slug' : 'Editar slug manualmente'"
              (click)="slugEditable.set(!slugEditable())"
            >
              <mat-icon>{{ slugEditable() ? 'lock_open' : 'edit' }}</mat-icon>
            </button>
          </div>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Contenido (HTML)</mat-label>
            <textarea
              matInput
              [(ngModel)]="content"
              rows="12"
              placeholder="<p>Contenido de la página...</p>"
            ></textarea>
          </mat-form-field>

          <div class="flex items-center gap-3">
            <mat-slide-toggle [(ngModel)]="active">Página activa</mat-slide-toggle>
          </div>

          <div class="flex gap-3 pt-2">
            <button
              mat-flat-button
              color="primary"
              [disabled]="saving() || !title.trim() || !slug.trim() || !content.trim()"
              (click)="save()"
            >
              @if (saving()) {
                <mat-spinner diameter="18" class="inline-block mr-2" />
              }
              Guardar
            </button>
            <a mat-button routerLink="/cms">Cancelar</a>
          </div>
        </div>
      </div>
    }
  `,
})
export class CmsFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly snackBar = inject(MatSnackBar);

  readonly isNew = signal(true);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly slugEditable = signal(false);

  title = '';
  slug = '';
  content = '';
  active = true;
  pageId: number | null = null;

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isNew.set(false);
      this.pageId = Number(id);
      await this.loadPage(this.pageId);
    } else {
      this.slugEditable.set(true);
    }
  }

  async loadPage(id: number) {
    this.loading.set(true);
    try {
      const listRes = await firstValueFrom(this.api.get<any>('/cms/admin/pages', { page: 1, perPage: 200 }));
      const page = (listRes.data ?? []).find((p: any) => p.id === id);
      if (page) {
        this.title = page.title;
        this.slug = page.slug;
        this.content = page.content;
        this.active = page.active;
      }
    } catch {
      this.snackBar.open('Error al cargar la página', 'OK', { duration: 3000 });
    } finally {
      this.loading.set(false);
    }
  }

  onTitleChange(value: string) {
    if (!this.slugEditable() || this.isNew()) {
      this.slug = this.generateSlug(value);
    }
  }

  generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }

  async save() {
    this.saving.set(true);
    try {
      const body = { title: this.title, slug: this.slug, content: this.content, active: this.active };
      if (this.isNew()) {
        await firstValueFrom(this.api.post('/cms/admin/pages', body));
        this.snackBar.open('Página creada', 'OK', { duration: 2000 });
      } else {
        await firstValueFrom(this.api.put(`/cms/admin/pages/${this.pageId}`, body));
        this.snackBar.open('Página actualizada', 'OK', { duration: 2000 });
      }
      this.router.navigate(['/cms']);
    } catch {
      this.snackBar.open('Error al guardar la página', 'OK', { duration: 3000 });
    } finally {
      this.saving.set(false);
    }
  }
}
