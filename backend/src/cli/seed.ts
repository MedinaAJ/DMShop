import '../config/env.js';
import { sequelize } from '../config/database.js';
import { Lang } from '../models/lang.model.js';
import { Currency } from '../models/currency.model.js';
import { Configuration } from '../models/configuration.model.js';
import { Category } from '../models/category.model.js';
import { CategoryLang } from '../models/category-lang.model.js';
import { User } from '../models/user.model.js';
import { Zone } from '../models/zone.model.js';
import { Country } from '../models/country.model.js';
import { State } from '../models/state.model.js';
import { Tax } from '../models/tax.model.js';
import { TaxRulesGroup } from '../models/tax-rules-group.model.js';
import { TaxRule } from '../models/tax-rule.model.js';
import { OrderState } from '../models/order-state.model.js';
import { CustomerGroup } from '../models/customer-group.model.js';
import { CustomerGroupLang } from '../models/customer-group-lang.model.js';
import { UserGroup } from '../models/user-group.model.js';
import { Carrier } from '../models/carrier.model.js';
import { CarrierZone } from '../models/carrier-zone.model.js';
import { CarrierRange } from '../models/carrier-range.model.js';
import { CarrierRangePrice } from '../models/carrier-range-price.model.js';
import bcrypt from 'bcrypt';

async function seed() {
  console.log('Connecting to database...');
  await sequelize.authenticate();

  console.log('Syncing models (force: true)...');
  await sequelize.sync({ force: true });

  // --- Languages ---
  console.log('Seeding languages...');
  await Lang.bulkCreate([
    { name: 'Español', iso_code: 'es', locale: 'es-ES', active: true, is_default: true },
    { name: 'English', iso_code: 'en', locale: 'en-US', active: true, is_default: false },
  ]);

  // --- Currencies ---
  console.log('Seeding currencies...');
  await Currency.bulkCreate([
    {
      name: 'Euro',
      iso_code: 'EUR',
      symbol: '€',
      conversion_rate: 1.0,
      decimals: 2,
      active: true,
      is_default: true,
    },
    {
      name: 'US Dollar',
      iso_code: 'USD',
      symbol: '$',
      conversion_rate: 1.08,
      decimals: 2,
      active: true,
      is_default: false,
    },
  ]);

  // --- Configuration ---
  console.log('Seeding configuration...');
  await Configuration.bulkCreate([
    { key: 'SHOP_NAME', value: 'DMShop' },
    { key: 'SHOP_EMAIL', value: 'info@dmshop.com' },
    { key: 'SHOP_PHONE', value: '' },
    { key: 'SHOP_ADDRESS', value: '' },
    { key: 'PS_TAX', value: '1' },
    { key: 'PS_TAX_DISPLAY', value: '1' },
    { key: 'PS_CURRENCY_DEFAULT', value: '1' },
    { key: 'PS_LANG_DEFAULT', value: '1' },
    { key: 'PS_COUNTRY_DEFAULT', value: '1' },
    { key: 'PS_PRODUCTS_PER_PAGE', value: '20' },
    { key: 'PS_CART_FOLLOWING', value: '1' },
    { key: 'PS_MAINTENANCE_MODE', value: '0' },
  ]);

  // --- Root category ---
  console.log('Seeding root category...');
  const rootCategory = await Category.create({
    id_parent: null,
    position: 0,
    active: true,
  });

  await CategoryLang.bulkCreate([
    {
      id_category: rootCategory.id,
      id_lang: 1,
      name: 'Raíz',
      description: null,
      slug: 'raiz',
      meta_title: null,
      meta_description: null,
    },
    {
      id_category: rootCategory.id,
      id_lang: 2,
      name: 'Root',
      description: null,
      slug: 'root',
      meta_title: null,
      meta_description: null,
    },
  ]);

  // Home category
  const homeCategory = await Category.create({
    id_parent: rootCategory.id,
    position: 0,
    active: true,
  });

  await CategoryLang.bulkCreate([
    {
      id_category: homeCategory.id,
      id_lang: 1,
      name: 'Inicio',
      description: 'Categoría principal de la tienda',
      slug: 'inicio',
      meta_title: 'Inicio',
      meta_description: null,
    },
    {
      id_category: homeCategory.id,
      id_lang: 2,
      name: 'Home',
      description: 'Main store category',
      slug: 'home',
      meta_title: 'Home',
      meta_description: null,
    },
  ]);

  // --- Admin user ---
  console.log('Seeding admin user...');
  const hashedPassword = await bcrypt.hash('Admin123!', 12);
  const adminUser = await User.create({
    email: 'admin@dmshop.com',
    password: hashedPassword,
    first_name: 'Admin',
    last_name: 'DMShop',
    role: 'admin',
    active: true,
    newsletter: false,
  });

  // --- Zones ---
  console.log('Seeding zones...');
  const [zoneEurope, zoneNorthAmerica] = await Zone.bulkCreate([
    { name: 'Europa', active: true },
    { name: 'Norteamérica', active: true },
  ]);

  // --- Countries ---
  console.log('Seeding countries...');
  const countries = await Country.bulkCreate([
    {
      id_zone: zoneEurope.id,
      iso_code: 'ES',
      name: 'España',
      active: true,
      contains_states: true,
      need_zip_code: true,
    },
    {
      id_zone: zoneEurope.id,
      iso_code: 'FR',
      name: 'Francia',
      active: true,
      contains_states: false,
      need_zip_code: true,
    },
    {
      id_zone: zoneEurope.id,
      iso_code: 'DE',
      name: 'Alemania',
      active: true,
      contains_states: true,
      need_zip_code: true,
    },
    {
      id_zone: zoneEurope.id,
      iso_code: 'IT',
      name: 'Italia',
      active: true,
      contains_states: false,
      need_zip_code: true,
    },
    {
      id_zone: zoneEurope.id,
      iso_code: 'PT',
      name: 'Portugal',
      active: true,
      contains_states: false,
      need_zip_code: true,
    },
    {
      id_zone: zoneEurope.id,
      iso_code: 'GB',
      name: 'Reino Unido',
      active: true,
      contains_states: false,
      need_zip_code: true,
    },
    {
      id_zone: zoneNorthAmerica.id,
      iso_code: 'US',
      name: 'Estados Unidos',
      active: true,
      contains_states: true,
      need_zip_code: true,
    },
  ]);
  const spain = countries[0];

  // --- States (Spanish provinces) ---
  console.log('Seeding states...');
  await State.bulkCreate([
    { id_country: spain.id, iso_code: 'C', name: 'A Coruña', active: true },
    { id_country: spain.id, iso_code: 'VI', name: 'Álava', active: true },
    { id_country: spain.id, iso_code: 'AB', name: 'Albacete', active: true },
    { id_country: spain.id, iso_code: 'A', name: 'Alicante', active: true },
    { id_country: spain.id, iso_code: 'AL', name: 'Almería', active: true },
    { id_country: spain.id, iso_code: 'O', name: 'Asturias', active: true },
    { id_country: spain.id, iso_code: 'AV', name: 'Ávila', active: true },
    { id_country: spain.id, iso_code: 'BA', name: 'Badajoz', active: true },
    { id_country: spain.id, iso_code: 'B', name: 'Barcelona', active: true },
    { id_country: spain.id, iso_code: 'BU', name: 'Burgos', active: true },
    { id_country: spain.id, iso_code: 'CC', name: 'Cáceres', active: true },
    { id_country: spain.id, iso_code: 'CA', name: 'Cádiz', active: true },
    { id_country: spain.id, iso_code: 'S', name: 'Cantabria', active: true },
    { id_country: spain.id, iso_code: 'CS', name: 'Castellón', active: true },
    { id_country: spain.id, iso_code: 'CE', name: 'Ceuta', active: true },
    { id_country: spain.id, iso_code: 'CR', name: 'Ciudad Real', active: true },
    { id_country: spain.id, iso_code: 'CO', name: 'Córdoba', active: true },
    { id_country: spain.id, iso_code: 'CU', name: 'Cuenca', active: true },
    { id_country: spain.id, iso_code: 'GI', name: 'Girona', active: true },
    { id_country: spain.id, iso_code: 'GR', name: 'Granada', active: true },
    { id_country: spain.id, iso_code: 'GU', name: 'Guadalajara', active: true },
    { id_country: spain.id, iso_code: 'SS', name: 'Guipúzcoa', active: true },
    { id_country: spain.id, iso_code: 'H', name: 'Huelva', active: true },
    { id_country: spain.id, iso_code: 'HU', name: 'Huesca', active: true },
    { id_country: spain.id, iso_code: 'PM', name: 'Islas Baleares', active: true },
    { id_country: spain.id, iso_code: 'J', name: 'Jaén', active: true },
    { id_country: spain.id, iso_code: 'TF', name: 'Las Palmas', active: true },
    { id_country: spain.id, iso_code: 'LE', name: 'León', active: true },
    { id_country: spain.id, iso_code: 'L', name: 'Lleida', active: true },
    { id_country: spain.id, iso_code: 'LU', name: 'Lugo', active: true },
    { id_country: spain.id, iso_code: 'M', name: 'Madrid', active: true },
    { id_country: spain.id, iso_code: 'MA', name: 'Málaga', active: true },
    { id_country: spain.id, iso_code: 'ML', name: 'Melilla', active: true },
    { id_country: spain.id, iso_code: 'MU', name: 'Murcia', active: true },
    { id_country: spain.id, iso_code: 'NA', name: 'Navarra', active: true },
    { id_country: spain.id, iso_code: 'OR', name: 'Ourense', active: true },
    { id_country: spain.id, iso_code: 'P', name: 'Palencia', active: true },
    { id_country: spain.id, iso_code: 'PO', name: 'Pontevedra', active: true },
    { id_country: spain.id, iso_code: 'LO', name: 'La Rioja', active: true },
    { id_country: spain.id, iso_code: 'SA', name: 'Salamanca', active: true },
    { id_country: spain.id, iso_code: 'GC', name: 'Santa Cruz de Tenerife', active: true },
    { id_country: spain.id, iso_code: 'SG', name: 'Segovia', active: true },
    { id_country: spain.id, iso_code: 'SE', name: 'Sevilla', active: true },
    { id_country: spain.id, iso_code: 'SO', name: 'Soria', active: true },
    { id_country: spain.id, iso_code: 'T', name: 'Tarragona', active: true },
    { id_country: spain.id, iso_code: 'TE', name: 'Teruel', active: true },
    { id_country: spain.id, iso_code: 'TO', name: 'Toledo', active: true },
    { id_country: spain.id, iso_code: 'V', name: 'Valencia', active: true },
    { id_country: spain.id, iso_code: 'VA', name: 'Valladolid', active: true },
    { id_country: spain.id, iso_code: 'BI', name: 'Vizcaya', active: true },
    { id_country: spain.id, iso_code: 'ZA', name: 'Zamora', active: true },
    { id_country: spain.id, iso_code: 'Z', name: 'Zaragoza', active: true },
  ]);

  // --- Taxes ---
  console.log('Seeding taxes...');
  const [taxGeneral, taxReduced, taxSuperReduced] = await Tax.bulkCreate([
    { name: 'IVA 21%', rate: 21.0, active: true },
    { name: 'IVA 10%', rate: 10.0, active: true },
    { name: 'IVA 4%', rate: 4.0, active: true },
  ]);

  // --- Tax Rules Groups ---
  console.log('Seeding tax rules groups...');
  const [trgGeneral, trgReduced, trgSuperReduced] = await TaxRulesGroup.bulkCreate([
    { name: 'IVA General 21%', active: true },
    { name: 'IVA Reducido 10%', active: true },
    { name: 'IVA Superreducido 4%', active: true },
  ]);

  // --- Tax Rules (apply to Spain) ---
  console.log('Seeding tax rules...');
  await TaxRule.bulkCreate([
    {
      id_tax_rules_group: trgGeneral.id,
      id_country: spain.id,
      id_state: null,
      id_tax: taxGeneral.id,
      behavior: 0,
    },
    {
      id_tax_rules_group: trgReduced.id,
      id_country: spain.id,
      id_state: null,
      id_tax: taxReduced.id,
      behavior: 0,
    },
    {
      id_tax_rules_group: trgSuperReduced.id,
      id_country: spain.id,
      id_state: null,
      id_tax: taxSuperReduced.id,
      behavior: 0,
    },
  ]);

  // --- Order States ---
  console.log('Seeding order states...');
  await OrderState.bulkCreate([
    {
      id: 1,
      name: 'Pendiente de pago',
      color: '#4169E1',
      paid: false,
      shipped: false,
      delivery: false,
      template: 'awaiting_payment',
    },
    {
      id: 2,
      name: 'Pago aceptado',
      color: '#32CD32',
      paid: true,
      shipped: false,
      delivery: false,
      template: 'payment_accepted',
    },
    {
      id: 3,
      name: 'En preparación',
      color: '#FF8C00',
      paid: true,
      shipped: false,
      delivery: false,
      template: 'processing',
    },
    {
      id: 4,
      name: 'Enviado',
      color: '#8A2BE2',
      paid: true,
      shipped: true,
      delivery: false,
      template: 'shipped',
    },
    {
      id: 5,
      name: 'Entregado',
      color: '#228B22',
      paid: true,
      shipped: true,
      delivery: true,
      template: 'delivered',
    },
    {
      id: 6,
      name: 'Cancelado',
      color: '#DC143C',
      paid: false,
      shipped: false,
      delivery: false,
      template: 'cancelled',
    },
    {
      id: 7,
      name: 'Reembolsado',
      color: '#EC7063',
      paid: false,
      shipped: false,
      delivery: false,
      template: 'refunded',
    },
    {
      id: 8,
      name: 'Error en el pago',
      color: '#E74C3C',
      paid: false,
      shipped: false,
      delivery: false,
      template: 'payment_error',
    },
    {
      id: 9,
      name: 'En espera',
      color: '#7F8C8D',
      paid: false,
      shipped: false,
      delivery: false,
      template: 'on_hold',
    },
    {
      id: 10,
      name: 'En espera de confirmación de pago',
      color: '#F39C12',
      paid: false,
      shipped: false,
      delivery: false,
      send_email: true,
      template: null,
    },
    {
      id: 11,
      name: 'En espera de contra reembolso',
      color: '#16A085',
      paid: false,
      shipped: false,
      delivery: false,
      send_email: true,
      template: null,
    },
  ]);

  // --- Customer Groups (PrestaShop-style: 1=Visitante, 2=Invitado, 3=Cliente) ---
  console.log('Seeding customer groups...');

  // Use findOrCreate to ensure fixed IDs (1=Visitante, 2=Invitado, 3=Cliente)
  const defaultGroups = [
    { id: 1, reduction: 0, price_display_method: 0, show_prices: true, deleted: false },
    { id: 2, reduction: 0, price_display_method: 0, show_prices: true, deleted: false },
    { id: 3, reduction: 0, price_display_method: 0, show_prices: true, deleted: false },
  ];
  for (const group of defaultGroups) {
    await CustomerGroup.findOrCreate({ where: { id: group.id }, defaults: group });
  }

  const groupNames = [
    { id_customer_group: 1, id_lang: 1, name: 'Visitante' },
    { id_customer_group: 2, id_lang: 1, name: 'Invitado' },
    { id_customer_group: 3, id_lang: 1, name: 'Cliente' },
    { id_customer_group: 1, id_lang: 2, name: 'Visitor' },
    { id_customer_group: 2, id_lang: 2, name: 'Guest' },
    { id_customer_group: 3, id_lang: 2, name: 'Customer' },
  ];
  for (const gn of groupNames) {
    await CustomerGroupLang.findOrCreate({
      where: { id_customer_group: gn.id_customer_group, id_lang: gn.id_lang },
      defaults: gn,
    });
  }

  // Assign admin to Customer group (id=3)
  await UserGroup.findOrCreate({
    where: { id_user: adminUser.id, id_customer_group: 3 },
    defaults: { id_user: adminUser.id, id_customer_group: 3 },
  });

  // --- Carrier ---
  console.log('Seeding default carrier...');
  const carrier = await Carrier.create({
    name: 'Envío estándar',
    id_tax_rules_group: trgGeneral.id,
    active: true,
    is_free: false,
    shipping_method: 'price',
    grade: 0,
    delay: 3,
  });

  await CarrierZone.create({ id_carrier: carrier.id, id_zone: zoneEurope.id });

  const carrierRange = await CarrierRange.create({
    id_carrier: carrier.id,
    delimiter1: 0,
    delimiter2: 10000,
  });

  await CarrierRangePrice.create({
    id_carrier_range: carrierRange.id,
    id_zone: zoneEurope.id,
    price: 4.99,
  });

  console.log('Seed completed successfully!');
  console.log('');
  console.log('Admin credentials:');
  console.log('  Email: admin@dmshop.com');
  console.log('  Password: Admin123!');

  await sequelize.close();
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
