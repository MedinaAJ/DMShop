import { Category } from '../../models/category.model.js';
import { CategoryLang } from '../../models/category-lang.model.js';
import { AppError } from '../../utils/app-error.js';
import { ErrorCode } from '@dmshop/shared';
import type { CreateCategoryInput, UpdateCategoryInput, CategoryTree } from '@dmshop/shared';

export const categoryService = {
  async list(query: Record<string, unknown>) {
    const where: Record<string, unknown> = {};
    if (query.active !== undefined) where.active = query.active === 'true';
    if (query.idParent !== undefined) where.id_parent = Number(query.idParent) || null;

    return Category.findAll({
      where,
      include: [{ model: CategoryLang, as: 'translations' }],
      order: [['position', 'ASC']],
    });
  },

  async getTree(): Promise<CategoryTree[]> {
    const categories = await Category.findAll({
      where: { active: true },
      include: [{ model: CategoryLang, as: 'translations' }],
      order: [['position', 'ASC']],
      raw: false,
    });

    return this.buildTree(categories, null);
  },

  buildTree(categories: Category[], parentId: number | null): CategoryTree[] {
    return categories
      .filter((c) => c.id_parent === parentId)
      .map((c) => {
        const translations = (c as any).translations || [];
        const defaultTrans = translations[0];
        return {
          id: c.id,
          name: defaultTrans?.name || '',
          slug: defaultTrans?.slug || '',
          active: c.active,
          children: this.buildTree(categories, c.id),
        };
      });
  },

  async getById(id: number) {
    const category = await Category.findByPk(id, {
      include: [{ model: CategoryLang, as: 'translations' }],
    });
    if (!category) {
      throw AppError.notFound('Categoría no encontrada', ErrorCode.CATEGORY_NOT_FOUND);
    }
    return category;
  },

  async create(input: CreateCategoryInput) {
    const category = await Category.create({
      id_parent: input.idParent ?? null,
      position: input.position ?? 0,
      active: input.active ?? true,
    });

    if (input.translations) {
      for (const [_langIso, trans] of Object.entries(input.translations)) {
        await CategoryLang.create({
          id_category: category.id,
          id_lang: 1, // TODO: resolve lang id
          name: trans.name,
          description: trans.description ?? null,
          slug: trans.slug,
          meta_title: trans.metaTitle ?? null,
          meta_description: trans.metaDescription ?? null,
        });
      }
    }

    return this.getById(category.id);
  },

  async update(id: number, input: UpdateCategoryInput) {
    const category = await Category.findByPk(id);
    if (!category) {
      throw AppError.notFound('Categoría no encontrada', ErrorCode.CATEGORY_NOT_FOUND);
    }

    await category.update({
      ...(input.idParent !== undefined && { id_parent: input.idParent }),
      ...(input.position !== undefined && { position: input.position }),
      ...(input.active !== undefined && { active: input.active }),
    });

    if (input.translations) {
      for (const [_langIso, trans] of Object.entries(input.translations)) {
        await CategoryLang.upsert({
          id_category: id,
          id_lang: 1,
          name: trans.name,
          description: trans.description ?? null,
          slug: trans.slug,
          meta_title: trans.metaTitle ?? null,
          meta_description: trans.metaDescription ?? null,
        });
      }
    }

    return this.getById(id);
  },

  async remove(id: number) {
    const category = await Category.findByPk(id);
    if (!category) {
      throw AppError.notFound('Categoría no encontrada', ErrorCode.CATEGORY_NOT_FOUND);
    }
    await category.update({ active: false, deleted_at: new Date() });
  },
};
