import { Router, Request, Response } from 'express';
import { seoService } from './seo.service.js';
import { asyncHandler } from '../../middleware/async-handler.js';

export const seoRouter = Router();

seoRouter.get(
  '/sitemap.xml',
  asyncHandler(async (_req: Request, res: Response) => {
    const xml = await seoService.generateSitemap();
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  }),
);

seoRouter.get(
  '/robots.txt',
  asyncHandler(async (_req: Request, res: Response) => {
    const txt = await seoService.generateRobotsTxt();
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(txt);
  }),
);
