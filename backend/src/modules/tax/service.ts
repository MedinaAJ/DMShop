import { Tax } from '../../models/tax.model.js';
import { TaxRulesGroup } from '../../models/tax-rules-group.model.js';
import { TaxRule } from '../../models/tax-rule.model.js';
import { Country } from '../../models/country.model.js';
import { AppError } from '../../utils/app-error.js';
import { ErrorCode } from '@dmshop/shared';
import type {
  CreateTaxInput,
  UpdateTaxInput,
  CreateTaxRulesGroupInput,
  UpdateTaxRulesGroupInput,
  CreateTaxRuleInput,
  UpdateTaxRuleInput,
} from '@dmshop/shared';

export const taxService = {
  // Taxes
  async listTaxes() {
    return Tax.findAll({ order: [['id', 'ASC']] });
  },

  async createTax(input: CreateTaxInput) {
    return Tax.create({
      rate: input.rate,
      active: input.active ?? true,
      name: input.name,
    });
  },

  async updateTax(id: number, input: UpdateTaxInput) {
    const tax = await Tax.findByPk(id);
    if (!tax) {
      throw AppError.notFound('Impuesto no encontrado', ErrorCode.TAX_NOT_FOUND);
    }

    await tax.update({
      ...(input.rate !== undefined && { rate: input.rate }),
      ...(input.active !== undefined && { active: input.active }),
      ...(input.name !== undefined && { name: input.name }),
    });

    return tax;
  },

  async removeTax(id: number) {
    const tax = await Tax.findByPk(id);
    if (!tax) {
      throw AppError.notFound('Impuesto no encontrado', ErrorCode.TAX_NOT_FOUND);
    }
    await tax.destroy();
  },

  // Tax Rules Groups
  async listGroups() {
    return TaxRulesGroup.findAll({
      include: [{ model: TaxRule, as: 'rules' }],
      order: [['id', 'ASC']],
    });
  },

  async getGroupById(id: number) {
    const group = await TaxRulesGroup.findByPk(id, {
      include: [
        {
          model: TaxRule,
          as: 'rules',
          include: [
            { model: Tax, as: 'tax' },
            { model: Country, as: 'country' },
          ],
        },
      ],
    });

    if (!group) {
      throw AppError.notFound(
        'Grupo de reglas de impuestos no encontrado',
        ErrorCode.TAX_RULES_GROUP_NOT_FOUND,
      );
    }

    return group;
  },

  async createGroup(input: CreateTaxRulesGroupInput) {
    return TaxRulesGroup.create({
      name: input.name,
      active: input.active ?? true,
    });
  },

  async updateGroup(id: number, input: UpdateTaxRulesGroupInput) {
    const group = await TaxRulesGroup.findByPk(id);
    if (!group) {
      throw AppError.notFound(
        'Grupo de reglas de impuestos no encontrado',
        ErrorCode.TAX_RULES_GROUP_NOT_FOUND,
      );
    }

    await group.update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.active !== undefined && { active: input.active }),
    });

    return group;
  },

  async removeGroup(id: number) {
    const group = await TaxRulesGroup.findByPk(id);
    if (!group) {
      throw AppError.notFound(
        'Grupo de reglas de impuestos no encontrado',
        ErrorCode.TAX_RULES_GROUP_NOT_FOUND,
      );
    }
    await group.destroy();
  },

  // Tax Rules
  async listRules(groupId: number) {
    return TaxRule.findAll({
      where: { id_tax_rules_group: groupId },
      include: [
        { model: Tax, as: 'tax' },
        { model: Country, as: 'country' },
      ],
      order: [['id', 'ASC']],
    });
  },

  async createRule(input: CreateTaxRuleInput) {
    return TaxRule.create({
      id_tax_rules_group: input.idTaxRulesGroup,
      id_country: input.idCountry,
      id_state: input.idState ?? 0,
      id_tax: input.idTax,
      behavior: input.behavior ?? 0,
    });
  },

  async updateRule(id: number, input: UpdateTaxRuleInput) {
    const rule = await TaxRule.findByPk(id);
    if (!rule) {
      throw AppError.notFound('Regla de impuestos no encontrada', ErrorCode.TAX_RULE_NOT_FOUND);
    }

    await rule.update({
      ...(input.idTaxRulesGroup !== undefined && { id_tax_rules_group: input.idTaxRulesGroup }),
      ...(input.idCountry !== undefined && { id_country: input.idCountry }),
      ...(input.idState !== undefined && { id_state: input.idState }),
      ...(input.idTax !== undefined && { id_tax: input.idTax }),
      ...(input.behavior !== undefined && { behavior: input.behavior }),
    });

    return rule;
  },

  async removeRule(id: number) {
    const rule = await TaxRule.findByPk(id);
    if (!rule) {
      throw AppError.notFound('Regla de impuestos no encontrada', ErrorCode.TAX_RULE_NOT_FOUND);
    }
    await rule.destroy();
  },
};
