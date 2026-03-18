import path from 'path';
import fs from 'fs';
import { Product } from '../../models/product.model.js';
import { ProductLang } from '../../models/product-lang.model.js';
import { ProductImage } from '../../models/product-image.model.js';
import { ProductCategory } from '../../models/product-category.model.js';
import { ProductCombination } from '../../models/product-combination.model.js';
import { CombinationAttributeValue } from '../../models/combination-attribute-value.model.js';
import { AttributeValue } from '../../models/attribute-value.model.js';
import { AttributeValueLang } from '../../models/attribute-value-lang.model.js';
import { AttributeLang } from '../../models/attribute-lang.model.js';
import { Attribute } from '../../models/attribute.model.js';
import { ProductFeature } from '../../models/product-feature.model.js';
import { Feature } from '../../models/feature.model.js';
import { FeatureLang } from '../../models/feature-lang.model.js';
import { FeatureValue } from '../../models/feature-value.model.js';
import { FeatureValueLang } from '../../models/feature-value-lang.model.js';
import { Manufacturer } from '../../models/manufacturer.model.js';
import { SpecificPrice } from '../../models/specific-price.model.js';
import { AppError } from '../../utils/app-error.js';
import { ErrorCode } from '@dmshop/shared';
import type { PaginationMeta } from '@dmshop/shared';
import type { CreateProductInput, UpdateProductInput } from '@dmshop/shared';
import { Op, QueryTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { env } from '../../config/env.js';

// =============== HELPERS ===============

function transformProductListItem(p: any, appUrl: string) {
  const translations: any[] = Array.isArray(p.translations) ? p.translations : [];
  const trans = translations[0] || {};
  const images: any[] = Array.isArray(p.images) ? p.images : [];
  const coverImg = images.find((img: any) => img.cover) || images[0];
  const coverPath = coverImg?.path ?? null;

  return {
    id: p.id,
    reference: p.reference ?? null,
    price: Number(p.price),
    quantity: p.quantity,
    active: p.active,
    name: trans.name ?? '',
    slug: trans.slug ?? '',
    descriptionShort: trans.description_short ?? null,
    coverImage: coverPath
      ? (coverPath.startsWith('http') ? coverPath : `${appUrl}/${coverPath.replace(/^\//, '')}`)
      : null,
    manufacturerName: p.manufacturer?.name ?? null,
    categoryName: null,
  };
}

export const productService = {
  async list(query: Record<string, unknown>) {
    const page = Number(query.page) || 1;
    const perPage = Math.min(Number(query.perPage) || 20, 100);
    const offset = (page - 1) * perPage;

    const where: Record<string | symbol, unknown> = { active: true };
    if (query.idCategory) {
      where.id_category_default = Number(query.idCategory);
    }
    if (query.id_manufacturer) {
      where.id_manufacturer = Number(query.id_manufacturer);
    }
    if (query.min_price !== undefined || query.max_price !== undefined) {
      const priceFilter: Record<symbol, number> = {};
      if (query.min_price !== undefined) priceFilter[Op.gte] = Number(query.min_price);
      if (query.max_price !== undefined) priceFilter[Op.lte] = Number(query.max_price);
      where.price = priceFilter;
    }
    if (query.in_stock === 'true' || query.in_stock === true) {
      where.quantity = { [Op.gt]: 0 };
    }

    // Support both old `q` and new `search` params
    const searchTerm = (query.search || query.q) as string | undefined;

    // Attribute filter: ?attributes=1,3,7 → product must have combination with those attribute_value ids
    const attributeIds = query.attributes
      ? String(query.attributes).split(',').map(Number).filter(Boolean)
      : [];

    if (attributeIds.length > 0) {
      // Find product IDs that have combinations with ALL requested attribute values
      const placeholders = attributeIds.map(() => '?').join(', ');
      const results = await sequelize.query<{ id_product: number }>(
        `SELECT DISTINCT pc.id_product
         FROM product_combinations pc
         INNER JOIN combination_attribute_values cav ON cav.id_combination = pc.id
         WHERE cav.id_attribute_value IN (${placeholders})
         GROUP BY pc.id_product
         HAVING COUNT(DISTINCT cav.id_attribute_value) = ?`,
        {
          replacements: [...attributeIds, attributeIds.length],
          type: QueryTypes.SELECT,
        },
      );

      if (results.length === 0) {
        const meta: PaginationMeta = { page, perPage, total: 0, totalPages: 0 };
        return { data: [], meta };
      }

      const productIds = results.map((r) => r.id_product);
      // Merge with existing id filter if any
      const existingIdFilter = where.id as { [Op.in]: number[] } | undefined;
      if (existingIdFilter?.[Op.in]) {
        const intersection = productIds.filter((id) => existingIdFilter[Op.in].includes(id));
        if (intersection.length === 0) {
          const meta: PaginationMeta = { page, perPage, total: 0, totalPages: 0 };
          return { data: [], meta };
        }
        where.id = { [Op.in]: intersection };
      } else {
        where.id = { [Op.in]: productIds };
      }
    }

    const translationWhere: Record<string | symbol, unknown> = { id_lang: 1 };
    const hasTranslationSearch = !!searchTerm;

    if (searchTerm) {
      translationWhere[Op.or] = [
        { name: { [Op.like]: `%${searchTerm}%` } },
        { description_short: { [Op.like]: `%${searchTerm}%` } },
      ];

      // Also add reference search by including matching product IDs
      const refMatches = await Product.findAll({
        where: { reference: { [Op.like]: `%${searchTerm}%` } },
        attributes: ['id'],
      });
      const refIds = refMatches.map((p) => p.id);

      if (refIds.length > 0) {
        // Get product IDs that match reference
        const existingIdFilter = where.id as { [Op.in]: number[] } | undefined;
        if (existingIdFilter?.[Op.in]) {
          const attrFilteredIds = existingIdFilter[Op.in];
          const refMatchingAttrIds = refIds.filter((id) => attrFilteredIds.includes(id));
          if (refMatchingAttrIds.length > 0) {
            where[Op.or] = [
              { id: { [Op.in]: refMatchingAttrIds } },
            ];
          }
        } else {
          // We need products where EITHER reference matches OR translation matches
          // Since translation filter is in include (not main where), we handle this via OR on id
          where[Op.or] = [{ id: { [Op.in]: refIds } }];
        }
      }
    }

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [
        {
          model: ProductLang,
          as: 'translations',
          where: translationWhere,
          // Required only when searching - but with OR via where[Op.or], we need to handle this carefully
          // If we have ref matches via where[Op.or], don't require translation match
          required: hasTranslationSearch && !(where[Op.or]),
        },
        {
          model: ProductImage,
          as: 'images',
          where: { cover: true },
          required: false,
        },
        {
          model: Manufacturer,
          as: 'manufacturer',
          required: false,
        },
      ],
      limit: perPage,
      offset,
      order: [['created_at', 'DESC']],
      distinct: true,
    });

    const meta: PaginationMeta = {
      page,
      perPage,
      total: count,
      totalPages: Math.ceil(count / perPage),
    };

    const data = rows.map((p) => transformProductListItem(p, env.APP_URL));
    return { data, meta };
  },

  async quickSearch(q: string, limit = 8) {
    const searchTerm = q.trim();
    if (!searchTerm) return [];

    // Get IDs from reference matches
    const refMatches = await Product.findAll({
      where: { active: true, reference: { [Op.like]: `%${searchTerm}%` } },
      attributes: ['id'],
      limit: limit,
    });
    const refIds = refMatches.map((p) => p.id);

    // Get IDs from translation name matches
    const nameLangMatches = await ProductLang.findAll({
      where: {
        id_lang: 1,
        [Op.or]: [
          { name: { [Op.like]: `%${searchTerm}%` } },
        ],
      },
      attributes: ['id_product'],
      limit: limit,
    });
    const nameIds = nameLangMatches.map((pl) => pl.id_product);

    const allIds = [...new Set([...refIds, ...nameIds])];
    if (allIds.length === 0) return [];

    const products = await Product.findAll({
      where: {
        active: true,
        id: { [Op.in]: allIds },
      },
      include: [
        {
          model: ProductLang,
          as: 'translations',
          where: { id_lang: 1 },
          required: false,
        },
        {
          model: ProductImage,
          as: 'images',
          where: { cover: true },
          required: false,
        },
      ],
      limit: limit,
      order: [['created_at', 'DESC']],
    });

    return products.map((p) => transformProductListItem(p, env.APP_URL));
  },

  async getById(id: number, _lang?: string) {
    const product = await Product.findByPk(id, {
      include: [
        { model: ProductLang, as: 'translations' },
        { model: ProductImage, as: 'images', order: [['position', 'ASC']] },
      ],
    });

    if (!product) {
      throw AppError.notFound('Producto no encontrado', ErrorCode.PRODUCT_NOT_FOUND);
    }

    // Fetch available specific prices for this product (for front-end display)
    const now = new Date();
    const specificPrices = await SpecificPrice.findAll({
      where: {
        id_product: id,
        [Op.or]: [
          { date_from: null, date_to: null },
          { date_from: { [Op.lte]: now }, date_to: null },
          { date_from: null, date_to: { [Op.gte]: now } },
          { date_from: { [Op.lte]: now }, date_to: { [Op.gte]: now } },
        ],
      },
      order: [['from_quantity', 'ASC']],
    });

    const productData = product.toJSON() as any;
    productData.specificPrices = specificPrices.map((sp) => ({
      id: sp.id,
      id_combination: sp.id_combination,
      from_quantity: sp.from_quantity,
      price: Number(sp.price),
      reduction: Number(sp.reduction),
      reduction_type: sp.reduction_type,
      date_from: sp.date_from,
      date_to: sp.date_to,
    }));

    return productData;
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
      for (const [_langIso, trans] of Object.entries(input.translations)) {
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
      for (const [_langIso, trans] of Object.entries(input.translations)) {
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

  // =============== COMBINATIONS ===============

  async listCombinations(productId: number) {
    await this.ensureProductExists(productId);

    return ProductCombination.findAll({
      where: { id_product: productId },
      include: [
        {
          model: AttributeValue,
          as: 'attributeValues',
          include: [
            { model: AttributeValueLang, as: 'translations' },
            {
              model: Attribute,
              as: 'attribute',
              include: [{ model: AttributeLang, as: 'translations' }],
            },
          ],
        },
      ],
      order: [['id', 'ASC']],
    });
  },

  async createCombination(
    productId: number,
    input: {
      reference?: string;
      ean13?: string;
      priceImpact?: number;
      weightImpact?: number;
      quantity?: number;
      isDefault?: boolean;
      attributeValueIds: number[];
    },
  ) {
    await this.ensureProductExists(productId);

    if (input.isDefault) {
      await ProductCombination.update({ is_default: false }, { where: { id_product: productId } });
    }

    const combination = await ProductCombination.create({
      id_product: productId,
      reference: input.reference ?? null,
      ean13: input.ean13 ?? null,
      price_impact: input.priceImpact ?? 0,
      weight_impact: input.weightImpact ?? 0,
      quantity: input.quantity ?? 0,
      is_default: input.isDefault ?? false,
    });

    for (const avId of input.attributeValueIds) {
      await CombinationAttributeValue.create({
        id_combination: combination.id,
        id_attribute_value: avId,
      });
    }

    return this.listCombinations(productId);
  },

  async updateCombination(
    productId: number,
    combinationId: number,
    input: {
      reference?: string;
      ean13?: string;
      priceImpact?: number;
      weightImpact?: number;
      quantity?: number;
      isDefault?: boolean;
      attributeValueIds?: number[];
    },
  ) {
    const combination = await ProductCombination.findOne({
      where: { id: combinationId, id_product: productId },
    });
    if (!combination) {
      throw AppError.notFound('Combinación no encontrada', ErrorCode.COMBINATION_NOT_FOUND);
    }

    if (input.isDefault) {
      await ProductCombination.update({ is_default: false }, { where: { id_product: productId } });
    }

    await combination.update({
      ...(input.reference !== undefined && { reference: input.reference }),
      ...(input.ean13 !== undefined && { ean13: input.ean13 }),
      ...(input.priceImpact !== undefined && { price_impact: input.priceImpact }),
      ...(input.weightImpact !== undefined && { weight_impact: input.weightImpact }),
      ...(input.quantity !== undefined && { quantity: input.quantity }),
      ...(input.isDefault !== undefined && { is_default: input.isDefault }),
    });

    if (input.attributeValueIds) {
      await CombinationAttributeValue.destroy({
        where: { id_combination: combinationId },
      });
      for (const avId of input.attributeValueIds) {
        await CombinationAttributeValue.create({
          id_combination: combinationId,
          id_attribute_value: avId,
        });
      }
    }

    return this.listCombinations(productId);
  },

  async removeCombination(productId: number, combinationId: number) {
    const combination = await ProductCombination.findOne({
      where: { id: combinationId, id_product: productId },
    });
    if (!combination) {
      throw AppError.notFound('Combinación no encontrada', ErrorCode.COMBINATION_NOT_FOUND);
    }
    await combination.destroy();
  },

  // =============== FEATURES ===============

  async listProductFeatures(productId: number) {
    await this.ensureProductExists(productId);

    return ProductFeature.findAll({
      where: { id_product: productId },
      include: [
        {
          model: Feature,
          as: 'feature',
          include: [{ model: FeatureLang, as: 'translations' }],
        },
        {
          model: FeatureValue,
          as: 'featureValue',
          include: [{ model: FeatureValueLang, as: 'translations' }],
        },
      ],
    });
  },

  async setProductFeature(productId: number, input: { idFeature: number; idFeatureValue: number }) {
    await this.ensureProductExists(productId);

    await ProductFeature.upsert({
      id_product: productId,
      id_feature: input.idFeature,
      id_feature_value: input.idFeatureValue,
    });

    return this.listProductFeatures(productId);
  },

  async removeProductFeature(productId: number, featureId: number) {
    const pf = await ProductFeature.findOne({
      where: { id_product: productId, id_feature: featureId },
    });
    if (!pf) {
      throw AppError.notFound(
        'Característica de producto no encontrada',
        ErrorCode.FEATURE_NOT_FOUND,
      );
    }
    await pf.destroy();
  },

  // =============== IMAGES ===============

  async listImages(productId: number) {
    await this.ensureProductExists(productId);
    return ProductImage.findAll({
      where: { id_product: productId },
      order: [['position', 'ASC']],
    });
  },

  async addImage(productId: number, imagePath: string, cover: boolean) {
    await this.ensureProductExists(productId);

    const existingImages = await ProductImage.findAll({
      where: { id_product: productId },
    });

    const maxPosition =
      existingImages.length > 0
        ? Math.max(...existingImages.map((img) => img.position))
        : -1;

    // Auto-cover if it's the first image
    const isFirstImage = existingImages.length === 0;
    const shouldBeCover = cover || isFirstImage;

    if (shouldBeCover) {
      await ProductImage.update({ cover: false }, { where: { id_product: productId } });
    }

    return ProductImage.create({
      id_product: productId,
      path: imagePath,
      position: maxPosition + 1,
      cover: shouldBeCover,
    });
  },

  async updateImage(
    productId: number,
    imageId: number,
    input: { cover?: boolean; position?: number },
  ) {
    const image = await ProductImage.findOne({
      where: { id: imageId, id_product: productId },
    });
    if (!image) {
      throw AppError.notFound('Imagen no encontrada', ErrorCode.NOT_FOUND);
    }

    if (input.cover) {
      await ProductImage.update({ cover: false }, { where: { id_product: productId } });
    }

    await image.update({
      ...(input.cover !== undefined && { cover: input.cover }),
      ...(input.position !== undefined && { position: input.position }),
    });

    return image;
  },

  async setCoverImage(productId: number, imageId: number) {
    const image = await ProductImage.findOne({
      where: { id: imageId, id_product: productId },
    });
    if (!image) {
      throw AppError.notFound('Imagen no encontrada', ErrorCode.NOT_FOUND);
    }
    await ProductImage.update({ cover: false }, { where: { id_product: productId } });
    await image.update({ cover: true });
    return image;
  },

  async reorderImages(productId: number, items: Array<{ id: number; position: number }>) {
    await this.ensureProductExists(productId);
    for (const item of items) {
      await ProductImage.update(
        { position: item.position },
        { where: { id: item.id, id_product: productId } },
      );
    }
    return this.listImages(productId);
  },

  async removeImage(productId: number, imageId: number) {
    const image = await ProductImage.findOne({
      where: { id: imageId, id_product: productId },
    });
    if (!image) {
      throw AppError.notFound('Imagen no encontrada', ErrorCode.NOT_FOUND);
    }

    const wasCover = image.cover;

    // Delete file from disk
    const imagePath = image.path;
    // imagePath is like /uploads/products/1/uuid.jpg
    const filePath = path.join(process.cwd(), imagePath.startsWith('/') ? imagePath.slice(1) : imagePath);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.warn(`Could not delete image file: ${filePath}`, err);
    }

    await image.destroy();

    // If it was cover, promote the next image by position
    if (wasCover) {
      const nextImage = await ProductImage.findOne({
        where: { id_product: productId },
        order: [['position', 'ASC']],
      });
      if (nextImage) {
        await nextImage.update({ cover: true });
      }
    }
  },

  // =============== CATEGORIES ===============

  async setCategories(productId: number, categoryIds: number[]) {
    await this.ensureProductExists(productId);

    await ProductCategory.destroy({ where: { id_product: productId } });
    for (const idCat of categoryIds) {
      await ProductCategory.create({
        id_product: productId,
        id_category: idCat,
        position: 0,
      });
    }

    return ProductCategory.findAll({ where: { id_product: productId } });
  },

  // =============== HELPERS ===============

  async ensureProductExists(productId: number) {
    const product = await Product.findByPk(productId);
    if (!product) {
      throw AppError.notFound('Producto no encontrado', ErrorCode.PRODUCT_NOT_FOUND);
    }
    return product;
  },
};
