import { Request, Response } from 'express';
import { cmsService } from './service.js';
import { sendSuccess, sendNoContent, sendCreated } from '../../utils/response.js';
import { AppError } from '../../utils/app-error.js';

export const cmsController = {
  // Public
  async listPages(req: Request, res: Response) {
    const pages = await cmsService.listPublic();
    sendSuccess(res, pages);
  },

  async getPage(req: Request, res: Response) {
    const page = await cmsService.getBySlug(req.params.slug);
    sendSuccess(res, page);
  },

  // Admin
  async listAdmin(req: Request, res: Response) {
    const result = await cmsService.listAdmin(req.query);
    res.json({ success: true, data: result.pages, meta: result.meta });
  },

  async createPage(req: Request, res: Response) {
    const { title, content, slug, active, id_cms_category } = req.body;
    if (!title) throw AppError.badRequest('El título es obligatorio');
    if (!slug) throw AppError.badRequest('El slug es obligatorio');
    if (!content) throw AppError.badRequest('El contenido es obligatorio');

    const page = await cmsService.createPage({ title, content, slug, active, id_cms_category });
    sendCreated(res, page);
  },

  async updatePage(req: Request, res: Response) {
    const id = Number(req.params.id);
    const page = await cmsService.updatePage(id, req.body);
    sendSuccess(res, page);
  },

  async deletePage(req: Request, res: Response) {
    const id = Number(req.params.id);
    await cmsService.deletePage(id);
    sendNoContent(res);
  },
};
