import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml, Title, Meta } from '@angular/platform-browser';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CmsService, CmsPageFull } from '../../core/services/cms.service';

@Component({
  selector: 'app-cms-page',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    @if (loading()) {
      <div class="flex justify-center py-20">
        <mat-spinner diameter="48" />
      </div>
    } @else if (page()) {
      <div class="max-w-3xl mx-auto px-4 py-10">
        <h1 class="text-3xl font-bold mb-6 text-gray-900">{{ page()!.title }}</h1>
        <div class="prose prose-lg max-w-none text-gray-700" [innerHTML]="safeContent()"></div>
      </div>
    } @else {
      <div class="max-w-xl mx-auto px-4 py-20 text-center text-gray-500">
        <p class="text-2xl font-semibold mb-2">Página no encontrada</p>
        <p>La página que buscas no existe o ha sido eliminada.</p>
      </div>
    }
  `,
})
export class CmsPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cmsService = inject(CmsService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly titleService = inject(Title);
  private readonly meta = inject(Meta);

  readonly loading = signal(true);
  readonly page = signal<CmsPageFull | null>(null);
  readonly safeContent = signal<SafeHtml>('');

  async ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) {
      this.loading.set(false);
      return;
    }

    try {
      const data = await this.cmsService.getPage(slug);
      this.page.set(data);
      this.safeContent.set(
        this.sanitizer.bypassSecurityTrustHtml(data.content ?? ''),
      );

      // SEO
      this.titleService.setTitle(data.meta_title ?? data.title);
      if (data.meta_description) {
        this.meta.updateTag({ name: 'description', content: data.meta_description });
      }
    } catch {
      // page not found - leave page() as null
    } finally {
      this.loading.set(false);
    }
  }
}
