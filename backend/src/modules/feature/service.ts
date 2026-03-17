import { Feature } from '../../models/feature.model.js';
import { FeatureLang } from '../../models/feature-lang.model.js';
import { FeatureValue } from '../../models/feature-value.model.js';
import { FeatureValueLang } from '../../models/feature-value-lang.model.js';
import { AppError } from '../../utils/app-error.js';
import { ErrorCode } from '@dmshop/shared';
import type {
  CreateFeatureInput,
  UpdateFeatureInput,
  CreateFeatureValueInput,
  UpdateFeatureValueInput,
} from '@dmshop/shared';

export const featureService = {
  async list() {
    return Feature.findAll({
      include: [
        { model: FeatureLang, as: 'translations' },
        {
          model: FeatureValue,
          as: 'values',
          include: [{ model: FeatureValueLang, as: 'translations' }],
        },
      ],
      order: [['position', 'ASC']],
    });
  },

  async getById(id: number) {
    const feature = await Feature.findByPk(id, {
      include: [
        { model: FeatureLang, as: 'translations' },
        {
          model: FeatureValue,
          as: 'values',
          include: [{ model: FeatureValueLang, as: 'translations' }],
        },
      ],
    });

    if (!feature) {
      throw AppError.notFound('Característica no encontrada', ErrorCode.FEATURE_NOT_FOUND);
    }

    return feature;
  },

  async create(input: CreateFeatureInput) {
    const feature = await Feature.create({ position: input.position ?? 0 });

    if (input.translations) {
      for (const [, trans] of Object.entries(input.translations)) {
        await FeatureLang.create({
          id_feature: feature.id,
          id_lang: 1,
          name: trans.name,
        });
      }
    }

    return this.getById(feature.id);
  },

  async update(id: number, input: UpdateFeatureInput) {
    const feature = await Feature.findByPk(id);
    if (!feature) {
      throw AppError.notFound('Característica no encontrada', ErrorCode.FEATURE_NOT_FOUND);
    }

    if (input.position !== undefined) {
      await feature.update({ position: input.position });
    }

    if (input.translations) {
      for (const [, trans] of Object.entries(input.translations)) {
        await FeatureLang.upsert({
          id_feature: id,
          id_lang: 1,
          name: trans.name,
        });
      }
    }

    return this.getById(id);
  },

  async remove(id: number) {
    const feature = await Feature.findByPk(id);
    if (!feature) {
      throw AppError.notFound('Característica no encontrada', ErrorCode.FEATURE_NOT_FOUND);
    }
    await feature.destroy();
  },

  // Feature Values
  async listValues(featureId: number) {
    const feature = await Feature.findByPk(featureId);
    if (!feature) {
      throw AppError.notFound('Característica no encontrada', ErrorCode.FEATURE_NOT_FOUND);
    }

    return FeatureValue.findAll({
      where: { id_feature: featureId },
      include: [{ model: FeatureValueLang, as: 'translations' }],
      order: [['id', 'ASC']],
    });
  },

  async createValue(featureId: number, input: CreateFeatureValueInput) {
    const feature = await Feature.findByPk(featureId);
    if (!feature) {
      throw AppError.notFound('Característica no encontrada', ErrorCode.FEATURE_NOT_FOUND);
    }

    const value = await FeatureValue.create({
      id_feature: featureId,
      custom: input.custom ?? false,
    });

    if (input.translations) {
      for (const [, trans] of Object.entries(input.translations)) {
        await FeatureValueLang.create({
          id_feature_value: value.id,
          id_lang: 1,
          value: trans.value,
        });
      }
    }

    return FeatureValue.findByPk(value.id, {
      include: [{ model: FeatureValueLang, as: 'translations' }],
    });
  },

  async updateValue(valueId: number, input: UpdateFeatureValueInput) {
    const value = await FeatureValue.findByPk(valueId);
    if (!value) {
      throw AppError.notFound(
        'Valor de característica no encontrado',
        ErrorCode.FEATURE_VALUE_NOT_FOUND,
      );
    }

    if (input.custom !== undefined) {
      await value.update({ custom: input.custom });
    }

    if (input.translations) {
      for (const [, trans] of Object.entries(input.translations)) {
        await FeatureValueLang.upsert({
          id_feature_value: valueId,
          id_lang: 1,
          value: trans.value,
        });
      }
    }

    return FeatureValue.findByPk(valueId, {
      include: [{ model: FeatureValueLang, as: 'translations' }],
    });
  },

  async removeValue(valueId: number) {
    const value = await FeatureValue.findByPk(valueId);
    if (!value) {
      throw AppError.notFound(
        'Valor de característica no encontrado',
        ErrorCode.FEATURE_VALUE_NOT_FOUND,
      );
    }
    await value.destroy();
  },
};
