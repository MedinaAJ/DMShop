import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { sendSuccess } from '../../utils/response.js';
import { configurationService } from '../configuration/service.js';

export const langsRouter = Router();

/** GET /api/v1/langs/active — public, returns active languages */
langsRouter.get(
  '/active',
  asyncHandler(async (_req, res) => {
    // Try to read from configuration, fall back to defaults
    try {
      const configs = await configurationService.getByPrefix('LANG_');
      const map = new Map(configs.map((c) => [c.key, c.value]));
      const langsJson = map.get('LANG_ACTIVE_LIST');
      if (langsJson) {
        const langs = JSON.parse(langsJson);
        sendSuccess(res, langs);
        return;
      }
    } catch {
      // ignore
    }
    // Default: Spanish + English
    sendSuccess(res, [
      { iso_code: 'es', name: 'Español', flag: '🇪🇸' },
      { iso_code: 'en', name: 'English', flag: '🇬🇧' },
    ]);
  }),
);
