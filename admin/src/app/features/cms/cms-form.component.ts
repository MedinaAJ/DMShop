import { Component, inject, OnInit, signal, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
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
    MatTooltipModule,
  ],
  styles: [`
    .editor-toolbar { border-bottom: 1px solid #e5e7eb; }
    .editor-toolbar button { padding: 4px 8px; border-radius: 4px; cursor: pointer; background: none; border: none; }
    .editor-toolbar button:hover { background: #f3f4f6; }
    .editor-toolbar button.active { background: #dbeafe; color: #1d4ed8; }
    .editor-content {
      min-height: 300px;
      padding: 12px;
      outline: none;
      font-family: inherit;
      line-height: 1.6;
    }
    .editor-content:empty:before {
      content: attr(data-placeholder);
      color: #9ca3af;
      pointer-events: none;
    }
    .editor-wrapper { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
    .editor-wrapper:focus-within { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.2); }
  `],
  template: `
    <div class="flex items-center gap-3 mb-6">
      <a mat-icon-button routerLink="/cms"><mat-icon>arrow_back</mat-icon></a>
      <h1 class="text-2xl font-bold">{{ isNew() ? 'Nueva página' : 'Editar página' }}</h1>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-12"><mat-spinner diameter="48" /></div>
    } @else {
      <div class="bg-white rounded-lg shadow p-6 max-w-4xl">
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

          <!-- WYSIWYG Editor -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Contenido</label>

            <!-- View mode toggle -->
            <div class="flex gap-2 mb-2">
              <button mat-stroked-button type="button"
                      [class.text-blue-600]="!rawHtmlMode"
                      (click)="rawHtmlMode = false">
                <mat-icon>wysiwyg</mat-icon> Editor visual
              </button>
              <button mat-stroked-button type="button"
                      [class.text-blue-600]="rawHtmlMode"
                      (click)="switchToRaw()">
                <mat-icon>code</mat-icon> HTML
              </button>
              <button mat-stroked-button type="button" (click)="showPreview = !showPreview">
                <mat-icon>{{ showPreview ? 'visibility_off' : 'visibility' }}</mat-icon>
                {{ showPreview ? 'Ocultar preview' : 'Preview' }}
              </button>
            </div>

            @if (!rawHtmlMode) {
              <div class="editor-wrapper">
                <!-- Toolbar -->
                <div class="editor-toolbar p-2 bg-gray-50 flex flex-wrap gap-1">
                  <button type="button" (click)="execCmd('bold')" matTooltip="Negrita (Ctrl+B)">
                    <mat-icon class="!text-lg">format_bold</mat-icon>
                  </button>
                  <button type="button" (click)="execCmd('italic')" matTooltip="Cursiva (Ctrl+I)">
                    <mat-icon class="!text-lg">format_italic</mat-icon>
                  </button>
                  <button type="button" (click)="execCmd('underline')" matTooltip="Subrayado (Ctrl+U)">
                    <mat-icon class="!text-lg">format_underlined</mat-icon>
                  </button>
                  <button type="button" (click)="execCmd('strikeThrough')" matTooltip="Tachado">
                    <mat-icon class="!text-lg">strikethrough_s</mat-icon>
                  </button>
                  <span class="w-px bg-gray-300 mx-1 self-stretch"></span>
                  <button type="button" (click)="insertHeading('h2')" matTooltip="Título H2">H2</button>
                  <button type="button" (click)="insertHeading('h3')" matTooltip="Título H3">H3</button>
                  <span class="w-px bg-gray-300 mx-1 self-stretch"></span>
                  <button type="button" (click)="execCmd('insertUnorderedList')" matTooltip="Lista con viñetas">
                    <mat-icon class="!text-lg">format_list_bulleted</mat-icon>
                  </button>
                  <button type="button" (click)="execCmd('insertOrderedList')" matTooltip="Lista numerada">
                    <mat-icon class="!text-lg">format_list_numbered</mat-icon>
                  </button>
                  <span class="w-px bg-gray-300 mx-1 self-stretch"></span>
                  <button type="button" (click)="insertLink()" matTooltip="Insertar enlace">
                    <mat-icon class="!text-lg">link</mat-icon>
                  </button>
                  <button type="button" (click)="execCmd('removeFormat')" matTooltip="Quitar formato">
                    <mat-icon class="!text-lg">format_clear</mat-icon>
                  </button>
                  <span class="w-px bg-gray-300 mx-1 self-stretch"></span>
                  <button type="button" (click)="execCmd('justifyLeft')" matTooltip="Alinear izquierda">
                    <mat-icon class="!text-lg">format_align_left</mat-icon>
                  </button>
                  <button type="button" (click)="execCmd('justifyCenter')" matTooltip="Centrar">
                    <mat-icon class="!text-lg">format_align_center</mat-icon>
                  </button>
                  <button type="button" (click)="execCmd('justifyRight')" matTooltip="Alinear derecha">
                    <mat-icon class="!text-lg">format_align_right</mat-icon>
                  </button>
                </div>

                <!-- Editable area -->
                <div
                  #editorEl
                  class="editor-content"
                  contenteditable="true"
                  data-placeholder="Escribe el contenido de la página aquí..."
                  (input)="onEditorInput()"
                  (blur)="syncContent()"
                ></div>
              </div>
            } @else {
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Contenido (HTML)</mat-label>
                <textarea
                  matInput
                  [(ngModel)]="content"
                  rows="14"
                  (ngModelChange)="onRawHtmlChange()"
                  placeholder="<p>Contenido de la página...</p>"
                  class="font-mono text-sm"
                ></textarea>
              </mat-form-field>
            }
          </div>

          <!-- Preview -->
          @if (showPreview) {
            <div class="border rounded-lg p-4 bg-gray-50">
              <h3 class="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Vista previa</h3>
              <div class="prose max-w-none" [innerHTML]="sanitizedPreview()"></div>
            </div>
          }

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
export class CmsFormComponent implements OnInit, AfterViewInit {
  @ViewChild('editorEl') editorEl!: ElementRef<HTMLDivElement>;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly sanitizer = inject(DomSanitizer);

  readonly isNew = signal(true);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly slugEditable = signal(false);

  title = '';
  slug = '';
  content = '';
  active = true;
  pageId: number | null = null;
  rawHtmlMode = false;
  showPreview = false;

  sanitizedPreview(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.content);
  }

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

  ngAfterViewInit() {
    this.syncEditorFromContent();
  }

  private syncEditorFromContent() {
    if (this.editorEl?.nativeElement && !this.rawHtmlMode) {
      this.editorEl.nativeElement.innerHTML = this.content;
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
        // Sync editor after loading
        setTimeout(() => this.syncEditorFromContent(), 50);
      }
    } catch {
      this.snackBar.open('Error al cargar la página', 'OK', { duration: 3000 });
    } finally {
      this.loading.set(false);
    }
  }

  execCmd(command: string, value?: string) {
    document.execCommand(command, false, value);
    this.editorEl?.nativeElement.focus();
    this.syncContent();
  }

  insertHeading(tag: string) {
    document.execCommand('formatBlock', false, tag);
    this.editorEl?.nativeElement.focus();
    this.syncContent();
  }

  insertLink() {
    const url = prompt('URL del enlace:');
    if (url) {
      document.execCommand('createLink', false, url);
      // Make it open in new tab
      const links = this.editorEl.nativeElement.querySelectorAll('a:not([target])');
      links.forEach((a) => a.setAttribute('target', '_blank'));
      this.syncContent();
    }
  }

  onEditorInput() {
    this.content = this.editorEl?.nativeElement.innerHTML ?? '';
  }

  syncContent() {
    this.content = this.editorEl?.nativeElement.innerHTML ?? '';
  }

  switchToRaw() {
    this.syncContent();
    this.rawHtmlMode = true;
  }

  onRawHtmlChange() {
    // When in raw mode, update editor on next visual switch
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
