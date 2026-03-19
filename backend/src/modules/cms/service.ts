import { CmsPage } from '../../models/cms-page.model.js';
import { CmsPageLang } from '../../models/cms-page-lang.model.js';
import { CmsCategory } from '../../models/cms-category.model.js';
import { CmsCategoryLang } from '../../models/cms-category-lang.model.js';
// import { Lang } from '../../models/lang.model.js';
import { AppError } from '../../utils/app-error.js';
import { logger } from '../../config/logger.js';
import type { PaginationMeta } from '@dmshop/shared';

const DEFAULT_LANG_ID = 1;

const DEFAULT_PAGES = [
  { title: 'Aviso legal', slug: 'aviso-legal', content: '<h1>Aviso legal</h1><p>Contenido del aviso legal.</p>' },
  { title: 'Política de privacidad', slug: 'politica-privacidad', content: '<h1>Política de privacidad</h1><p>Contenido de la política de privacidad.</p>' },
  { title: 'Sobre nosotros', slug: 'sobre-nosotros', content: '<h1>Sobre nosotros</h1><p>Información sobre nuestra empresa.</p>' },
];

export const cmsService = {
  async seedDefaultPages() {
    try {
      // Get or create default category
      let category = await CmsCategory.findOne({ where: { id: 1 } });
      if (!category) {
        category = await CmsCategory.create({ position: 0, active: true });
        await CmsCategoryLang.create({
          id_cms_category: category.id,
          id_lang: DEFAULT_LANG_ID,
          name: 'Información',
          slug: 'informacion',
        });
      }

      for (const pageData of DEFAULT_PAGES) {
        const existing = await CmsPageLang.findOne({ where: { slug: pageData.slug } });
        if (!existing) {
          const page = await CmsPage.create({
            id_cms_category: category.id,
            position: 0,
            active: true,
          });
          await CmsPageLang.create({
            id_cms_page: page.id,
            id_lang: DEFAULT_LANG_ID,
            title: pageData.title,
            slug: pageData.slug,
            content: pageData.content,
          });
          logger.info(`CMS: Página "${pageData.title}" creada`);
        }
      }
    } catch (err) {
      logger.warn('CMS seed skipped:', err);
    }
  },

  async listPublic() {
    const pages = await CmsPage.findAll({
      where: { active: true },
      include: [
        { model: CmsPageLang, where: { id_lang: DEFAULT_LANG_ID }, required: false },
      ],
      order: [['position', 'ASC']],
    });

    return pages
      .map((p) => {
        const lang = (p as any).translations?.[0];
        if (!lang) return null;
        return {
          id: p.id,
          title: lang.title,
          slug: lang.slug,
          id_cms_category: p.id_cms_category,
        };
      })
      .filter(Boolean);
  },

  async getBySlug(slug: string) {
    const lang = await CmsPageLang.findOne({
      where: { slug },
      include: [
        {
          model: CmsPage,
          where: { active: true },
          include: [{ model: CmsCategory }],
        },
      ],
    });

    if (!lang) throw AppError.notFound('Página no encontrada');

    const page = (lang as any).page as CmsPage;
    return {
      id: page.id,
      active: page.active,
      id_cms_category: page.id_cms_category,
      title: lang.title,
      slug: lang.slug,
      content: lang.content,
      meta_title: lang.meta_title,
      meta_description: lang.meta_description,
    };
  },

  async listAdmin(query: Record<string, unknown>) {
    const page = Number(query.page) || 1;
    const perPage = Math.min(Number(query.perPage) || 20, 100);
    const offset = (page - 1) * perPage;

    const { count, rows } = await CmsPage.findAndCountAll({
      include: [
        { model: CmsPageLang, where: { id_lang: DEFAULT_LANG_ID }, required: false },
      ],
      limit: perPage,
      offset,
      order: [['id', 'DESC']],
    });

    const meta: PaginationMeta = {
      page,
      perPage,
      total: count,
      totalPages: Math.ceil(count / perPage),
    };

    const pages = rows.map((p) => {
      const lang = (p as any).translations?.[0];
      return {
        id: p.id,
        active: p.active,
        id_cms_category: p.id_cms_category,
        position: p.position,
        title: lang?.title ?? '',
        slug: lang?.slug ?? '',
        meta_title: lang?.meta_title ?? null,
        meta_description: lang?.meta_description ?? null,
        content: lang?.content ?? '',
        created_at: p.created_at,
        updated_at: p.updated_at,
      };
    });

    return { pages, meta };
  },

  async createPage(data: {
    title: string;
    content: string;
    slug: string;
    active?: boolean;
    id_cms_category?: number;
  }) {
    // Ensure category exists
    let categoryId = data.id_cms_category;
    if (!categoryId) {
      const cat = await CmsCategory.findOne();
      categoryId = cat?.id ?? 1;
    }

    const cmsPage = await CmsPage.create({
      id_cms_category: categoryId,
      position: 0,
      active: data.active ?? true,
    });

    await CmsPageLang.create({
      id_cms_page: cmsPage.id,
      id_lang: DEFAULT_LANG_ID,
      title: data.title,
      slug: data.slug,
      content: data.content,
    });

    return this.getPageAdmin(cmsPage.id);
  },

  async updatePage(
    id: number,
    data: Partial<{ title: string; content: string; slug: string; active: boolean; id_cms_category: number }>,
  ) {
    const cmsPage = await CmsPage.findByPk(id);
    if (!cmsPage) throw AppError.notFound('Página no encontrada');

    if (data.active !== undefined) await cmsPage.update({ active: data.active });
    if (data.id_cms_category !== undefined) await cmsPage.update({ id_cms_category: data.id_cms_category });

    let langRow = await CmsPageLang.findOne({ where: { id_cms_page: id, id_lang: DEFAULT_LANG_ID } });
    if (!langRow) {
      langRow = await CmsPageLang.create({
        id_cms_page: id,
        id_lang: DEFAULT_LANG_ID,
        title: data.title ?? '',
        slug: data.slug ?? '',
        content: data.content ?? '',
      });
    } else {
      await langRow.update({
        title: data.title ?? langRow.title,
        slug: data.slug ?? langRow.slug,
        content: data.content ?? langRow.content,
      });
    }

    return this.getPageAdmin(id);
  },

  async deletePage(id: number) {
    const cmsPage = await CmsPage.findByPk(id);
    if (!cmsPage) throw AppError.notFound('Página no encontrada');
    await CmsPageLang.destroy({ where: { id_cms_page: id } });
    await cmsPage.destroy();
  },

  async getPageAdmin(id: number) {
    const cmsPage = await CmsPage.findByPk(id, {
      include: [{ model: CmsPageLang, where: { id_lang: DEFAULT_LANG_ID }, required: false }],
    });
    if (!cmsPage) throw AppError.notFound('Página no encontrada');
    const lang = (cmsPage as any).translations?.[0];
    return {
      id: cmsPage.id,
      active: cmsPage.active,
      id_cms_category: cmsPage.id_cms_category,
      title: lang?.title ?? '',
      slug: lang?.slug ?? '',
      content: lang?.content ?? '',
      meta_title: lang?.meta_title ?? null,
      meta_description: lang?.meta_description ?? null,
    };
  },
};
