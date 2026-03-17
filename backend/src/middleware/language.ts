import { Request, Response, NextFunction } from 'express';
import { Lang } from '../models/lang.model.js';

let langCache: Map<string, number> | null = null;

async function loadLangs(): Promise<Map<string, number>> {
  if (langCache) return langCache;
  const langs = await Lang.findAll({ where: { active: true } });
  langCache = new Map(langs.map((l) => [l.iso_code, l.id]));
  return langCache;
}

/** Clears the language cache (call after adding/modifying languages) */
export function clearLangCache() {
  langCache = null;
}

declare global {
  namespace Express {
    interface Request {
      langId?: number;
      langIso?: string;
    }
  }
}

/**
 * Resolves the language from:
 * 1. Query param `?lang=es`
 * 2. Accept-Language header
 * Falls back to id_lang=1 (default)
 */
export async function resolveLanguage(req: Request, _res: Response, next: NextFunction) {
  const langs = await loadLangs();
  let iso: string | undefined;

  // 1. query param
  if (typeof req.query.lang === 'string' && req.query.lang.length === 2) {
    iso = req.query.lang.toLowerCase();
  }

  // 2. Accept-Language header
  if (!iso) {
    const acceptLang = req.headers['accept-language'];
    if (acceptLang) {
      const primary = acceptLang.split(',')[0].trim().substring(0, 2).toLowerCase();
      if (langs.has(primary)) {
        iso = primary;
      }
    }
  }

  if (iso && langs.has(iso)) {
    req.langId = langs.get(iso)!;
    req.langIso = iso;
  } else {
    req.langId = 1;
    req.langIso = 'es';
  }

  next();
}
