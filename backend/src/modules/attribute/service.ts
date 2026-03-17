import { Attribute } from '../../models/attribute.model.js';
import { AttributeLang } from '../../models/attribute-lang.model.js';
import { AttributeValue } from '../../models/attribute-value.model.js';
import { AttributeValueLang } from '../../models/attribute-value-lang.model.js';
import { AppError } from '../../utils/app-error.js';
import { ErrorCode } from '@dmshop/shared';
import type {
  CreateAttributeInput,
  UpdateAttributeInput,
  CreateAttributeValueInput,
  UpdateAttributeValueInput,
} from '@dmshop/shared';

export const attributeService = {
  async list() {
    return Attribute.findAll({
      include: [
        { model: AttributeLang, as: 'translations' },
        {
          model: AttributeValue,
          as: 'values',
          include: [{ model: AttributeValueLang, as: 'translations' }],
        },
      ],
      order: [['position', 'ASC']],
    });
  },

  async getById(id: number) {
    const attribute = await Attribute.findByPk(id, {
      include: [
        { model: AttributeLang, as: 'translations' },
        {
          model: AttributeValue,
          as: 'values',
          include: [{ model: AttributeValueLang, as: 'translations' }],
        },
      ],
    });

    if (!attribute) {
      throw AppError.notFound('Atributo no encontrado', ErrorCode.ATTRIBUTE_NOT_FOUND);
    }

    return attribute;
  },

  async create(input: CreateAttributeInput) {
    const attribute = await Attribute.create({ position: input.position ?? 0 });

    if (input.translations) {
      for (const [, trans] of Object.entries(input.translations)) {
        await AttributeLang.create({
          id_attribute: attribute.id,
          id_lang: 1,
          name: trans.name,
        });
      }
    }

    return this.getById(attribute.id);
  },

  async update(id: number, input: UpdateAttributeInput) {
    const attribute = await Attribute.findByPk(id);
    if (!attribute) {
      throw AppError.notFound('Atributo no encontrado', ErrorCode.ATTRIBUTE_NOT_FOUND);
    }

    if (input.position !== undefined) {
      await attribute.update({ position: input.position });
    }

    if (input.translations) {
      for (const [, trans] of Object.entries(input.translations)) {
        await AttributeLang.upsert({
          id_attribute: id,
          id_lang: 1,
          name: trans.name,
        });
      }
    }

    return this.getById(id);
  },

  async remove(id: number) {
    const attribute = await Attribute.findByPk(id);
    if (!attribute) {
      throw AppError.notFound('Atributo no encontrado', ErrorCode.ATTRIBUTE_NOT_FOUND);
    }
    await attribute.destroy();
  },

  // Attribute Values
  async listValues(attributeId: number) {
    const attribute = await Attribute.findByPk(attributeId);
    if (!attribute) {
      throw AppError.notFound('Atributo no encontrado', ErrorCode.ATTRIBUTE_NOT_FOUND);
    }

    return AttributeValue.findAll({
      where: { id_attribute: attributeId },
      include: [{ model: AttributeValueLang, as: 'translations' }],
      order: [['position', 'ASC']],
    });
  },

  async createValue(attributeId: number, input: CreateAttributeValueInput) {
    const attribute = await Attribute.findByPk(attributeId);
    if (!attribute) {
      throw AppError.notFound('Atributo no encontrado', ErrorCode.ATTRIBUTE_NOT_FOUND);
    }

    const value = await AttributeValue.create({
      id_attribute: attributeId,
      color: input.color ?? null,
      position: input.position ?? 0,
    });

    if (input.translations) {
      for (const [, trans] of Object.entries(input.translations)) {
        await AttributeValueLang.create({
          id_attribute_value: value.id,
          id_lang: 1,
          name: trans.name,
        });
      }
    }

    return AttributeValue.findByPk(value.id, {
      include: [{ model: AttributeValueLang, as: 'translations' }],
    });
  },

  async updateValue(valueId: number, input: UpdateAttributeValueInput) {
    const value = await AttributeValue.findByPk(valueId);
    if (!value) {
      throw AppError.notFound(
        'Valor de atributo no encontrado',
        ErrorCode.ATTRIBUTE_VALUE_NOT_FOUND,
      );
    }

    await value.update({
      ...(input.color !== undefined && { color: input.color }),
      ...(input.position !== undefined && { position: input.position }),
    });

    if (input.translations) {
      for (const [, trans] of Object.entries(input.translations)) {
        await AttributeValueLang.upsert({
          id_attribute_value: valueId,
          id_lang: 1,
          name: trans.name,
        });
      }
    }

    return AttributeValue.findByPk(valueId, {
      include: [{ model: AttributeValueLang, as: 'translations' }],
    });
  },

  async removeValue(valueId: number) {
    const value = await AttributeValue.findByPk(valueId);
    if (!value) {
      throw AppError.notFound(
        'Valor de atributo no encontrado',
        ErrorCode.ATTRIBUTE_VALUE_NOT_FOUND,
      );
    }
    await value.destroy();
  },
};
