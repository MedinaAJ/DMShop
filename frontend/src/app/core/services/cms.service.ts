import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { firstValueFrom } from 'rxjs';

export interface CmsPageSummary {
  id: number;
  title: string;
  slug: string;
  id_cms_category: number;
}

export interface CmsPageFull extends CmsPageSummary {
  content: string;
  active: boolean;
  meta_title: string | null;
  meta_description: string | null;
}

interface CmsPagesResponse {
  success: boolean;
  data: CmsPageSummary[];
}

interface CmsPageResponse {
  success: boolean;
  data: CmsPageFull;
}

@Injectable({ providedIn: 'root' })
export class CmsService {
  private readonly api = inject(ApiService);

  async listPages(): Promise<CmsPageSummary[]> {
    const res = await firstValueFrom(this.api.get<CmsPagesResponse>('/cms/pages'));
    return res.data;
  }

  async getPage(slug: string): Promise<CmsPageFull> {
    const res = await firstValueFrom(this.api.get<CmsPageResponse>(`/cms/pages/${slug}`));
    return res.data;
  }
}
