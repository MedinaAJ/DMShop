import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { sendSuccess, sendNoContent } from '../../utils/response.js';
import { themeService } from './theme.service.js';

export const themeRouter = Router();

// ─── Public ───────────────────────────────────────────────────────────────────

/** GET /api/v1/themes/active — public, for the frontend */
themeRouter.get(
  '/active',
  asyncHandler(async (_req, res) => {
    const theme = await themeService.getActive();
    sendSuccess(res, theme);
  }),
);

// ─── Import (admin) — must be before /:slug to avoid conflict ─────────────────

/** POST /api/v1/themes/import — import a .dmshop-theme.json file */
themeRouter.post(
  '/import',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const body = req.body as {
      dmshop_theme_version?: string;
      name?: string;
      slug?: string;
      description?: string;
      preview_image?: string;
      config?: Record<string, unknown>;
    };

    if (!body.dmshop_theme_version) {
      res.status(400).json({ success: false, message: 'Invalid theme file: missing dmshop_theme_version' });
      return;
    }
    if (!body.name || !body.slug || !body.config) {
      res.status(400).json({ success: false, message: 'Invalid theme file: missing name, slug or config' });
      return;
    }

    const theme = await themeService.create({
      name: body.name,
      slug: body.slug,
      description: body.description,
      preview_image: body.preview_image,
      config: body.config as any,
    });
    res.status(201).json({ success: true, data: theme });
  }),
);

// ─── Admin: list all themes ────────────────────────────────────────────────────

/** GET /api/v1/themes — list all themes (admin) */
themeRouter.get(
  '/',
  authenticate,
  authorize('admin'),
  asyncHandler(async (_req, res) => {
    const themes = await themeService.getAll();
    sendSuccess(res, themes);
  }),
);

/** POST /api/v1/themes — create a custom theme (admin) */
themeRouter.post(
  '/',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const theme = await themeService.create(req.body);
    res.status(201).json({ success: true, data: theme });
  }),
);

// ─── Admin: actions on specific theme ─────────────────────────────────────────

/** POST /api/v1/themes/:id/activate — activate a theme */
themeRouter.post(
  '/:id/activate',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    await themeService.activate(Number(req.params.id));
    sendNoContent(res);
  }),
);

/** POST /api/v1/themes/:id/duplicate — duplicate a theme */
themeRouter.post(
  '/:id/duplicate',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const theme = await themeService.duplicate(Number(req.params.id));
    res.status(201).json({ success: true, data: theme });
  }),
);

/** GET /api/v1/themes/:id/export — export a theme as .dmshop-theme.json */
themeRouter.get(
  '/:id/export',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const all = await themeService.getAll();
    const found = all.find((t) => t.id === Number(req.params.id));
    if (!found) {
      res.status(404).json({ success: false, message: 'Theme not found' });
      return;
    }
    const exportData = {
      dmshop_theme_version: '1.0',
      name: found.name,
      slug: found.slug,
      description: found.description,
      preview_image: found.preview_image,
      config: found.config,
    };
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${found.slug}.dmshop-theme.json"`);
    res.json(exportData);
  }),
);

/** PUT /api/v1/themes/:id — edit theme config (admin) */
themeRouter.put(
  '/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const theme = await themeService.update(Number(req.params.id), req.body);
    sendSuccess(res, theme);
  }),
);

/** DELETE /api/v1/themes/:id — delete a non-builtin theme (admin) */
themeRouter.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    await themeService.delete(Number(req.params.id));
    sendNoContent(res);
  }),
);

/** GET /api/v1/themes/:slug — get theme by slug */
themeRouter.get(
  '/:slug',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const theme = await themeService.getBySlug(req.params.slug);
    sendSuccess(res, theme);
  }),
);

// ─── Legacy compatibility ──────────────────────────────────────────────────────
// Keep the old /theme/config endpoint working (registered under /api/v1/theme)
themeRouter.get(
  '/config',
  asyncHandler(async (_req, res) => {
    const theme = await themeService.getActive();
    const c = theme.config;
    // Return in old flat format for backward compatibility
    sendSuccess(res, {
      THEME_NAME: theme.slug,
      THEME_PRIMARY_COLOR: c.primaryColor,
      THEME_SECONDARY_COLOR: c.secondaryColor,
      THEME_FONT: c.font,
      THEME_LOGO_URL: c.logoUrl ?? '',
      THEME_FAVICON_URL: c.faviconUrl ?? '',
      THEME_SHOW_PRICES_WITHOUT_TAX: String(c.showPricesWithoutTax ?? false),
      THEME_PRODUCTS_PER_PAGE: String(c.productsPerPage ?? 12),
      THEME_BANNER_TEXT: c.bannerText ?? '',
      THEME_BANNER_SUBTITLE: c.bannerSubtitle ?? '',
      THEME_BANNER_IMAGE_URL: c.bannerImageUrl ?? '',
    });
  }),
);
