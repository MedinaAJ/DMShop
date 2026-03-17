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
    const offset = (page - 1) * perPage;

    const where: Record<string, unknown> = { active: true };
    if (query.idCategory) {
      where.id_category_default = Number(query.idCategory);
    }

    const translationWhere: Record<string, unknown> = { id_lang: 1 };
    if (query.q) {
      translationWhere.name = { [Op.like]: `%${query.q}%` };
    }

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [
        {
          model: ProductLang,
          as: 'translations',
          where: translationWhere,
          required: !!query.q,
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

  async addImage(productId: number, path: string, cover: boolean) {
    await this.ensureProductExists(productId);

    const maxPosition = await ProductImage.max<number, ProductImage>('position', {
      where: { id_product: productId },
    });

    if (cover) {
      await ProductImage.update({ cover: false }, { where: { id_product: productId } });
    }

    return ProductImage.create({
      id_product: productId,
      path,
      position: (maxPosition ?? -1) + 1,
      cover,
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

  async removeImage(productId: number, imageId: number) {
    const image = await ProductImage.findOne({
      where: { id: imageId, id_product: productId },
    });
    if (!image) {
      throw AppError.notFound('Imagen no encontrada', ErrorCode.NOT_FOUND);
    }
    await image.destroy();
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
