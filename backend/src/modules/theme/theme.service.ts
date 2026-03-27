import { Theme, ThemeConfig } from '../../models/theme.model.js';
import { configurationService } from '../configuration/service.js';
import { logger } from '../../config/logger.js';

export interface CreateThemeDto {
  name: string;
  slug: string;
  description?: string;
  preview_image?: string;
  config: ThemeConfig;
}

const BUILTIN_THEMES: Array<CreateThemeDto & { is_builtin: boolean; is_active: boolean }> = [
  {
    name: 'Default',
    slug: 'default',
    description: 'Tema predeterminado de DMShop con colores azules y morados',
    preview_image: '',
    is_builtin: true,
    is_active: true,
    config: {
      primaryColor: '#1a56db',
      secondaryColor: '#7e3af2',
      font: 'Inter',
      logoUrl: '',
      faviconUrl: '',
      showPricesWithoutTax: false,
      productsPerPage: 12,
      bannerText: 'Bienvenido a DMShop',
      bannerSubtitle: 'Descubre nuestra colección',
      bannerImageUrl: '',
      headerStyle: 'light',
      productCardStyle: 'classic',
      borderRadius: 'medium',
      buttonStyle: 'filled',
      colorScheme: 'light',
    },
  },
  {
    name: 'Dark',
    slug: 'dark',
    description: 'Tema oscuro con colores índigo y rosa',
    preview_image: '',
    is_builtin: true,
    is_active: false,
    config: {
      primaryColor: '#6366f1',
      secondaryColor: '#ec4899',
      font: 'Inter',
      logoUrl: '',
      faviconUrl: '',
      showPricesWithoutTax: false,
      productsPerPage: 12,
      bannerText: 'Explora lo nuevo',
      bannerSubtitle: 'Tendencias de temporada',
      bannerImageUrl: '',
      headerStyle: 'dark',
      productCardStyle: 'minimal',
      borderRadius: 'large',
      buttonStyle: 'soft',
      colorScheme: 'dark',
    },
  },
  {
    name: 'Minimal',
    slug: 'minimal',
    description: 'Tema minimalista con fuente Playfair Display y bordes rectos',
    preview_image: '',
    is_builtin: true,
    is_active: false,
    config: {
      primaryColor: '#111827',
      secondaryColor: '#6b7280',
      font: 'Playfair Display',
      logoUrl: '',
      faviconUrl: '',
      showPricesWithoutTax: false,
      productsPerPage: 24,
      bannerText: 'Less is more',
      bannerSubtitle: 'Colección cápsula',
      bannerImageUrl: '',
      headerStyle: 'light',
      productCardStyle: 'minimal',
      borderRadius: 'none',
      buttonStyle: 'outlined',
      colorScheme: 'light',
    },
  },
];

export const themeService = {
  async getAll(): Promise<Theme[]> {
    return Theme.findAll({ order: [['id', 'ASC']] });
  },

  async getActive(): Promise<Theme> {
    const theme = await Theme.findOne({ where: { is_active: 1 } });
    if (!theme) {
      // Return default config as a virtual theme
      const defaultBuiltin = BUILTIN_THEMES[0];
      return {
        id: 0,
        name: defaultBuiltin.name,
        slug: defaultBuiltin.slug,
        description: defaultBuiltin.description ?? null,
        preview_image: defaultBuiltin.preview_image ?? null,
        is_active: 1,
        is_builtin: 1,
        config: defaultBuiltin.config,
      } as unknown as Theme;
    }
    return theme;
  },

  async getBySlug(slug: string): Promise<Theme> {
    const theme = await Theme.findOne({ where: { slug } });
    if (!theme) throw new Error(`Theme with slug "${slug}" not found`);
    return theme;
  },

  async activate(id: number): Promise<void> {
    const theme = await Theme.findByPk(id);
    if (!theme) throw new Error(`Theme with id ${id} not found`);
    await Theme.update({ is_active: 0 }, { where: {} });
    await theme.update({ is_active: 1 });
  },

  async update(id: number, data: Partial<ThemeConfig>): Promise<Theme> {
    const theme = await Theme.findByPk(id);
    if (!theme) throw new Error(`Theme with id ${id} not found`);
    const merged = { ...theme.config, ...data };
    await theme.update({ config: merged });
    return theme.reload();
  },

  async create(data: CreateThemeDto): Promise<Theme> {
    // Check slug uniqueness
    const existing = await Theme.findOne({ where: { slug: data.slug } });
    if (existing) throw new Error(`A theme with slug "${data.slug}" already exists`);
    return Theme.create({
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
      preview_image: data.preview_image ?? null,
      is_active: 0,
      is_builtin: 0,
      config: data.config,
    } as any);
  },

  async delete(id: number): Promise<void> {
    const theme = await Theme.findByPk(id);
    if (!theme) throw new Error(`Theme with id ${id} not found`);
    if (theme.is_builtin) throw new Error('Cannot delete a builtin theme');
    if (theme.is_active) throw new Error('Cannot delete the active theme');
    await theme.destroy();
  },

  async duplicate(id: number): Promise<Theme> {
    const theme = await Theme.findByPk(id);
    if (!theme) throw new Error(`Theme with id ${id} not found`);

    const baseSlug = `${theme.slug}-copy`;
    let slug = baseSlug;
    let counter = 1;
    while (await Theme.findOne({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    return Theme.create({
      name: `${theme.name} (copia)`,
      slug,
      description: theme.description,
      preview_image: theme.preview_image,
      is_active: 0,
      is_builtin: 0,
      config: { ...theme.config },
    } as any);
  },

  async seedBuiltinThemes(): Promise<void> {
    for (const themeData of BUILTIN_THEMES) {
      const existing = await Theme.findOne({ where: { slug: themeData.slug } });
      if (!existing) {
        await Theme.create({
          name: themeData.name,
          slug: themeData.slug,
          description: themeData.description ?? null,
          preview_image: themeData.preview_image ?? null,
          is_active: themeData.is_active ? 1 : 0,
          is_builtin: 1,
          config: themeData.config,
        } as any);
        logger.info(`Created builtin theme: ${themeData.slug}`);
      }
    }

    // Migrate THEME_* config keys into the default theme if it exists
    try {
      const defaultTheme = await Theme.findOne({ where: { slug: 'default' } });
      if (defaultTheme) {
        const dbConfigs = await configurationService.getByPrefix('THEME_');
        if (dbConfigs.length > 0) {
          const map = new Map(dbConfigs.map((c) => [c.key, c.value]));
          const merged: Partial<ThemeConfig> = { ...defaultTheme.config };
          if (map.has('THEME_PRIMARY_COLOR')) merged.primaryColor = map.get('THEME_PRIMARY_COLOR')!;
          if (map.has('THEME_SECONDARY_COLOR')) merged.secondaryColor = map.get('THEME_SECONDARY_COLOR')!;
          if (map.has('THEME_FONT')) merged.font = map.get('THEME_FONT')!;
          if (map.has('THEME_LOGO_URL')) merged.logoUrl = map.get('THEME_LOGO_URL')!;
          if (map.has('THEME_FAVICON_URL')) merged.faviconUrl = map.get('THEME_FAVICON_URL')!;
          if (map.has('THEME_PRODUCTS_PER_PAGE')) merged.productsPerPage = parseInt(map.get('THEME_PRODUCTS_PER_PAGE')!, 10);
          if (map.has('THEME_BANNER_TEXT')) merged.bannerText = map.get('THEME_BANNER_TEXT')!;
          if (map.has('THEME_BANNER_SUBTITLE')) merged.bannerSubtitle = map.get('THEME_BANNER_SUBTITLE')!;
          if (map.has('THEME_BANNER_IMAGE_URL')) merged.bannerImageUrl = map.get('THEME_BANNER_IMAGE_URL')!;
          if (map.has('THEME_SHOW_PRICES_WITHOUT_TAX'))
            merged.showPricesWithoutTax = map.get('THEME_SHOW_PRICES_WITHOUT_TAX') === 'true';
          await defaultTheme.update({ config: merged });
          logger.info('Migrated THEME_* configuration keys to default theme');
        }
      }
    } catch (err) {
      logger.warn('Could not migrate THEME_* config keys:', err);
    }
  },
};
