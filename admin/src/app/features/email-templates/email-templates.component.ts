import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { environment } from '../../../environments/environment';

interface EmailTemplate {
  name: string;
  description: string;
  variables: string[];
}

interface EmailConfig {
  headerColor: string;
  logoUrl: string;
  footerText: string;
  fromName: string;
}

@Component({
  selector: 'app-email-templates',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatChipsModule,
  ],
  template: `
    <div class="max-w-4xl mx-auto">
      <h1 class="text-2xl font-bold mb-6">Plantillas de email</h1>

      @if (loadingTemplates()) {
        <div class="flex justify-center py-12"><mat-spinner diameter="40" /></div>
      } @else {
        <!-- Global email config -->
        <mat-card class="mb-6">
          <mat-card-header>
            <mat-card-title>
              <mat-icon class="align-middle mr-2">settings</mat-icon>
              Configuración global de email
            </mat-card-title>
          </mat-card-header>
          <mat-card-content class="pt-4 space-y-3">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">Color de cabecera</label>
                <div class="flex items-center gap-3">
                  <input type="color" [(ngModel)]="emailConfig.headerColor" class="w-10 h-10 rounded cursor-pointer border" />
                  <mat-form-field appearance="outline" subscriptSizing="dynamic" class="flex-1">
                    <input matInput [(ngModel)]="emailConfig.headerColor" />
                  </mat-form-field>
                </div>
              </div>
              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Nombre del remitente</mat-label>
                <input matInput [(ngModel)]="emailConfig.fromName" placeholder="DMShop" />
              </mat-form-field>
            </div>
            <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic">
              <mat-label>URL del logo en emails</mat-label>
              <input matInput [(ngModel)]="emailConfig.logoUrl" placeholder="https://..." />
            </mat-form-field>
            <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic">
              <mat-label>Texto del pie del email</mat-label>
              <input matInput [(ngModel)]="emailConfig.footerText" placeholder="© 2026 DMShop. Todos los derechos reservados." />
            </mat-form-field>
            <div class="flex justify-end">
              <button mat-flat-button color="primary" (click)="saveEmailConfig()" [disabled]="savingConfig()">
                @if (savingConfig()) { <mat-spinner diameter="18" class="inline-block mr-2" /> }
                Guardar configuración
              </button>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Templates list -->
        <div class="space-y-4">
          @for (template of templates(); track template.name) {
            <mat-card>
              <mat-card-content class="py-4">
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <mat-icon class="text-blue-500">email</mat-icon>
                      <span class="font-semibold">{{ template.name }}</span>
                    </div>
                    <p class="text-sm text-gray-600 mb-2">{{ template.description }}</p>
                    <div class="flex flex-wrap gap-1">
                      @for (v of template.variables; track v) {
                        <span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">{{ '{{' }} {{ v }} {{ '}}' }}</span>
                      }
                    </div>
                  </div>
                  <div class="flex gap-2 shrink-0">
                    <button mat-stroked-button (click)="preview(template)" [disabled]="previewLoading() === template.name">
                      @if (previewLoading() === template.name) {
                        <mat-spinner diameter="16" class="inline-block" />
                      } @else {
                        <mat-icon>visibility</mat-icon>
                      }
                      Previsualizar
                    </button>
                    <button mat-stroked-button color="accent" (click)="openTestForm(template)">
                      <mat-icon>send</mat-icon>
                      Prueba
                    </button>
                  </div>
                </div>

                <!-- Test email form (inline toggle) -->
                @if (activeTestTemplate() === template.name) {
                  <mat-divider class="my-4" />
                  <div class="flex gap-3 items-center">
                    <mat-form-field appearance="outline" subscriptSizing="dynamic" class="flex-1">
                      <mat-label>Email de destino</mat-label>
                      <input matInput type="email" [(ngModel)]="testEmail" (keyup.enter)="sendTest(template.name)" />
                    </mat-form-field>
                    <button mat-flat-button color="primary" (click)="sendTest(template.name)" [disabled]="sendingTest()">
                      @if (sendingTest()) { <mat-spinner diameter="16" class="inline-block mr-1" /> }
                      Enviar prueba
                    </button>
                    <button mat-icon-button (click)="activeTestTemplate.set(null)">
                      <mat-icon>close</mat-icon>
                    </button>
                  </div>
                }
              </mat-card-content>
            </mat-card>
          }
        </div>
      }

      <!-- Preview modal -->
      @if (previewHtmlUrl()) {
        <div class="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" (click)="closePreview()">
          <div class="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between px-4 py-3 border-b">
              <h3 class="font-semibold">Previsualización: {{ previewTemplateName() }}</h3>
              <button mat-icon-button (click)="closePreview()"><mat-icon>close</mat-icon></button>
            </div>
            <iframe
              [src]="previewHtmlUrl()!"
              class="flex-1 border-0 rounded-b-lg"
              style="min-height: 500px;"
            ></iframe>
          </div>
        </div>
      }
    </div>
  `,
})
export class EmailTemplatesComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly snack = inject(MatSnackBar);
  private readonly sanitizer = inject(DomSanitizer);

  loadingTemplates = signal(true);
  templates = signal<EmailTemplate[]>([]);
  emailConfig: EmailConfig = { headerColor: '#1a56db', logoUrl: '', footerText: '', fromName: 'DMShop' };
  savingConfig = signal(false);

  previewLoading = signal<string | null>(null);
  previewHtmlUrl = signal<SafeResourceUrl | null>(null);
  previewTemplateName = signal<string>('');

  activeTestTemplate = signal<string | null>(null);
  testEmail = '';
  sendingTest = signal(false);

  ngOnInit(): void {
    this.loadTemplates();
    this.loadEmailConfig();
  }

  async loadTemplates(): Promise<void> {
    try {
      const res = await firstValueFrom(this.api.get<{ success: boolean; data: EmailTemplate[] }>('/admin/email-templates'));
      this.templates.set((res as any).data ?? res);
    } catch {
      this.snack.open('Error al cargar plantillas', 'Cerrar', { duration: 3000 });
    } finally {
      this.loadingTemplates.set(false);
    }
  }

  async loadEmailConfig(): Promise<void> {
    try {
      const res = await firstValueFrom(this.api.get<{ success: boolean; data: EmailConfig }>('/admin/email-templates/config'));
      const data = (res as any).data ?? res;
      this.emailConfig = { ...this.emailConfig, ...data };
    } catch { /* ignore */ }
  }

  async saveEmailConfig(): Promise<void> {
    this.savingConfig.set(true);
    try {
      await firstValueFrom(this.api.put('/admin/email-templates/config', this.emailConfig));
      this.snack.open('Configuración guardada', 'OK', { duration: 2000 });
    } catch {
      this.snack.open('Error al guardar', 'Cerrar', { duration: 3000 });
    } finally {
      this.savingConfig.set(false);
    }
  }

  async preview(template: EmailTemplate): Promise<void> {
    this.previewLoading.set(template.name);
    try {
      // Open in a new URL — the backend renders HTML directly
      const previewUrl = `${environment.apiUrl}/admin/email-templates/${template.name}/preview`;
      const safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(previewUrl);
      this.previewHtmlUrl.set(safeUrl);
      this.previewTemplateName.set(template.name);
    } finally {
      this.previewLoading.set(null);
    }
  }

  closePreview(): void {
    this.previewHtmlUrl.set(null);
    this.previewTemplateName.set('');
  }

  openTestForm(template: EmailTemplate): void {
    this.activeTestTemplate.set(
      this.activeTestTemplate() === template.name ? null : template.name
    );
  }

  async sendTest(templateName: string): Promise<void> {
    if (!this.testEmail.trim()) {
      this.snack.open('Introduce un email de destino', 'OK', { duration: 2000 });
      return;
    }
    this.sendingTest.set(true);
    try {
      await firstValueFrom(this.api.post(`/admin/email-templates/${templateName}/test`, { email: this.testEmail }));
      this.snack.open(`Email de prueba enviado a ${this.testEmail}`, 'OK', { duration: 3000 });
      this.activeTestTemplate.set(null);
      this.testEmail = '';
    } catch {
      this.snack.open('Error al enviar el email', 'Cerrar', { duration: 3000 });
    } finally {
      this.sendingTest.set(false);
    }
  }
}
