import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);

  updateTitle(title: string): void {
    this.titleService.setTitle(title);
    this.metaService.updateTag({ property: 'og:title', content: title });
    this.metaService.updateTag({ name: 'twitter:title', content: title });
  }

  updateMeta(description: string, keywords?: string): void {
    this.metaService.updateTag({ name: 'description', content: description });
    this.metaService.updateTag({ property: 'og:description', content: description });
    this.metaService.updateTag({ name: 'twitter:description', content: description });
    if (keywords) {
      this.metaService.updateTag({ name: 'keywords', content: keywords });
    }
  }

  updateOgTags(title: string, description: string, image?: string, url?: string): void {
    this.metaService.updateTag({ property: 'og:title', content: title });
    this.metaService.updateTag({ property: 'og:description', content: description });
    this.metaService.updateTag({ property: 'og:type', content: 'website' });

    if (image) {
      this.metaService.updateTag({ property: 'og:image', content: image });
      this.metaService.updateTag({ name: 'twitter:image', content: image });
      this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    }

    if (url) {
      this.metaService.updateTag({ property: 'og:url', content: url });
    }
  }

  setCanonicalUrl(url: string): void {
    // Remove existing canonical link if any
    const existingLink = this.document.querySelector('link[rel="canonical"]');
    if (existingLink) {
      existingLink.setAttribute('href', url);
    } else {
      const link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', url);
      this.document.head.appendChild(link);
    }
  }

  setProductMeta(opts: {
    name: string;
    description: string | null;
    image?: string;
    url?: string;
  }): void {
    this.updateTitle(opts.name);
    this.updateMeta(opts.description ?? opts.name);
    this.metaService.updateTag({ property: 'og:type', content: 'product' });
    this.updateOgTags(opts.name, opts.description ?? opts.name, opts.image, opts.url);
    if (opts.url) {
      this.setCanonicalUrl(opts.url);
    }
  }

  setCategoryMeta(opts: { name: string; description?: string | null; url?: string }): void {
    const title = opts.name ? `${opts.name} — Catálogo` : 'Catálogo';
    const desc = opts.description ?? `Explora nuestra selección de ${opts.name ?? 'productos'}.`;
    this.updateTitle(title);
    this.updateMeta(desc);
    this.updateOgTags(title, desc, undefined, opts.url);
    if (opts.url) {
      this.setCanonicalUrl(opts.url);
    }
  }

  setHomeMeta(opts: { shopName: string; tagline?: string }): void {
    const title = opts.shopName;
    const desc = opts.tagline ?? `Bienvenido a ${opts.shopName}. Tu tienda online de confianza.`;
    this.updateTitle(title);
    this.updateMeta(desc);
    this.updateOgTags(title, desc);
  }

  setCmsPageMeta(opts: { title: string; description?: string | null; url?: string }): void {
    this.updateTitle(opts.title);
    this.updateMeta(opts.description ?? opts.title);
    this.updateOgTags(opts.title, opts.description ?? opts.title, undefined, opts.url);
    if (opts.url) {
      this.setCanonicalUrl(opts.url);
    }
  }
}
