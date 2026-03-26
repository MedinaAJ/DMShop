import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { configurationService } from '../configuration/service.js';
import { sendSuccess, sendNoContent } from '../../utils/response.js';

export const themeRouter = Router();

const THEME_KEYS = [
  'THEME_NAME',
  'THEME_PRIMARY_COLOR',
  'THEME_SECONDARY_COLOR',
  'THEME_FONT',
  'THEME_LOGO_URL',
  'THEME_FAVICON_URL',
  'THEME_SHOW_PRICES_WITHOUT_TAX',
  'THEME_PRODUCTS_PER_PAGE',
  'THEME_BANNER_TEXT',
  'THEME_BANNER_SUBTITLE',
  'THEME_BANNER_IMAGE_URL',
];

const THEME_DEFAULTS: Record<string, string> = {
  THEME_NAME: 'default',
  THEME_PRIMARY_COLOR: '#1a56db',
  THEME_SECONDARY_COLOR: '#7e3af2',
  THEME_FONT: 'Inter',
  THEME_LOGO_URL: '',
  THEME_FAVICON_URL: '',
  THEME_SHOW_PRICES_WITHOUT_TAX: 'false',
  THEME_PRODUCTS_PER_PAGE: '12',
  THEME_BANNER_TEXT: 'Bienvenido a DMShop',
  THEME_BANNER_SUBTITLE: 'Descubre nuestra colección',
  THEME_BANNER_IMAGE_URL: '',
};

/** GET /api/v1/theme/config — public */
themeRouter.get(
  '/config',
  asyncHandler(async (_req, res) => {
    const dbConfigs = await configurationService.getByPrefix('THEME_');
    const map = new Map(dbConfigs.map((c) => [c.key, c.value]));
    const result: Record<string, string> = {};
    for (const key of THEME_KEYS) {
      result[key] = map.get(key) ?? THEME_DEFAULTS[key] ?? '';
    }
    sendSuccess(res, result);
  }),
);

/** PUT /api/v1/theme/config — admin */
themeRouter.put(
  '/config',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const payload = req.body as Record<string, string>;
    const configs = Object.entries(payload)
      .filter(([key]) => THEME_KEYS.includes(key))
      .map(([key, value]) => ({ key, value: String(value) }));

    if (configs.length === 0) {
      res.status(400).json({ success: false, message: 'No valid theme keys provided' });
      return;
    }

    await configurationService.bulkUpdate(configs);
    sendNoContent(res);
  }),
);
