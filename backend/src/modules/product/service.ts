import { Product } from '../../models/product.model.js';
import { ProductLang } from '../../models/product-lang.model.js';
import { ProductImage } from '../../models/product-image.model.js';
import { Category } from '../../models/category.model.js';
import { CategoryLang } from '../../models/category-lang.model.js';
import { Manufacturer } from '../../models/manufacturer.model.js';
import { AppError } from '../../utils/app-error.js';
import { ErrorCode } from '@dmshop/shared';
import type { PaginationMeta } from '@dmshop/shared';
import type { CreateProductInput, UpdateProductInput } from '@dmshop/shared';
import { Op } from 'sequelize';

export const productService = {
  async list(query: Record<string, unknown>) {
    const page = Number(query.page) || 1;
    const perPage = Math.min(Number(query.perPage) || 20, 100);
    const lang = (query.lang as string) || 'es';
    const offset = (page - 1) * perPage;

    const where: Record<string, unknown> = { active: true };
    if (query.idCategory) {
      where.id_category_default = Number(query.idCategory);
    }

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [
        {
          model: ProductLang,
          as: 'translations',
          where: { id_lang: 1 }, // TODO: resolve lang id from iso
          required: false,
        },
        {
          model: ProductImage,
          as: 'images',
          where: { cover: true },
          required: false,
        },
      ],
      limit: perPage,
      offset,
      order: [['created_at', 'DESC']],
    });

    const meta: PaginationMeta = {
      page,
      perPage,
      total: count,
      totalPages: Math.ceil(count / perPage),
    };

    return { data: rows, meta };
  },

  async getById(id: number, lang?: string) {
    const product = await Product.findByPk(id, {
      include: [
        { model: ProductLang, as: 'translations' },
        { model: ProductImage, as: 'images', order: [['position', 'ASC']] },
      ],
    });

    if (!product) {
      throw AppError.notFound('Producto no encontrado', ErrorCode.PRODUCT_NOT_FOUND);
    }

    return product;
  },

  async create(input: CreateProductInput) {
    const product = await Product.create({
      id_category_default: input.idCategoryDefault,
      id_manufacturer: input.idManufacturer ?? null,
      id_supplier: input.idSupplier ?? null,
      id_tax_rule_group: input.idTaxRuleGroup,
      reference: input.reference ?? null,
      ean13: input.ean13 ?? null,
      price: input.price,
      wholesale_price: input.wholesalePrice ?? 0,
      weight: input.weight ?? 0,
      quantity: input.quantity ?? 0,
      active: input.active ?? true,
      available_for_order: input.availableForOrder ?? true,
      show_price: input.showPrice ?? true,
      is_virtual: input.isVirtual ?? false,
    });

    // Create translations
    if (input.translations) {
      for (const [langIso, trans] of Object.entries(input.translations)) {
        // TODO: resolve lang id from iso code
        await ProductLang.create({
          id_product: product.id,
          id_lang: 1,
          name: trans.name,
          description: trans.description ?? null,
          description_short: trans.descriptionShort ?? null,
          slug: trans.slug,
          meta_title: trans.metaTitle ?? null,
          meta_description: trans.metaDescription ?? null,
        });
      }
    }

    return this.getById(product.id);
  },

  async update(id: number, input: UpdateProductInput) {
    const product = await Product.findByPk(id);
    if (!product) {
      throw AppError.notFound('Producto no encontrado', ErrorCode.PRODUCT_NOT_FOUND);
    }

    await product.update({
      ...(input.idCategoryDefault !== undefined && {
        id_category_default: input.idCategoryDefault,
      }),
      ...(input.idManufacturer !== undefined && { id_manufacturer: input.idManufacturer }),
      ...(input.idSupplier !== undefined && { id_supplier: input.idSupplier }),
      ...(input.idTaxRuleGroup !== undefined && { id_tax_rule_group: input.idTaxRuleGroup }),
      ...(input.reference !== undefined && { reference: input.reference }),
      ...(input.price !== undefined && { price: input.price }),
      ...(input.active !== undefined && { active: input.active }),
      ...(input.quantity !== undefined && { quantity: input.quantity }),
    });

    if (input.translations) {
      for (const [langIso, trans] of Object.entries(input.translations)) {
        await ProductLang.upsert({
          id_product: id,
          id_lang: 1, // TODO: resolve lang id from iso
          name: trans.name,
          description: trans.description ?? null,
          description_short: trans.descriptionShort ?? null,
          slug: trans.slug,
          meta_title: trans.metaTitle ?? null,
          meta_description: trans.metaDescription ?? null,
        });
      }
    }

    return this.getById(id);
  },

  async remove(id: number) {
    const product = await Product.findByPk(id);
    if (!product) {
      throw AppError.notFound('Producto no encontrado', ErrorCode.PRODUCT_NOT_FOUND);
    }

    // Soft delete
    await product.update({ active: false, deleted_at: new Date() });
  },
};
