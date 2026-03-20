import '../config/env.js';
import { sequelize } from '../config/database.js';

// Core
import { Lang } from '../models/lang.model.js';
import { Currency } from '../models/currency.model.js';
import { Configuration } from '../models/configuration.model.js';

// Catalog
import { Category } from '../models/category.model.js';
import { CategoryLang } from '../models/category-lang.model.js';
import { Manufacturer } from '../models/manufacturer.model.js';
import { Supplier } from '../models/supplier.model.js';
import { Product } from '../models/product.model.js';
import { ProductLang } from '../models/product-lang.model.js';
import { ProductImage } from '../models/product-image.model.js';
import { ProductCategory } from '../models/product-category.model.js';

// Attributes & Combinations
import { Attribute } from '../models/attribute.model.js';
import { AttributeLang } from '../models/attribute-lang.model.js';
import { AttributeValue } from '../models/attribute-value.model.js';
import { AttributeValueLang } from '../models/attribute-value-lang.model.js';
import { ProductCombination } from '../models/product-combination.model.js';
import { CombinationAttributeValue } from '../models/combination-attribute-value.model.js';

// Features
import { Feature } from '../models/feature.model.js';
import { FeatureLang } from '../models/feature-lang.model.js';
import { FeatureValue } from '../models/feature-value.model.js';
import { FeatureValueLang } from '../models/feature-value-lang.model.js';
import { ProductFeature } from '../models/product-feature.model.js';

// Geography
import { Zone } from '../models/zone.model.js';
import { Country } from '../models/country.model.js';
import { State } from '../models/state.model.js';
import { Address } from '../models/address.model.js';

// Tax
import { Tax } from '../models/tax.model.js';
import { TaxRulesGroup } from '../models/tax-rules-group.model.js';
import { TaxRule } from '../models/tax-rule.model.js';

// Customer groups
import { CustomerGroup } from '../models/customer-group.model.js';
import { CustomerGroupLang } from '../models/customer-group-lang.model.js';
import { UserGroup } from '../models/user-group.model.js';

// Users
import { User } from '../models/user.model.js';

// Cart
import { Cart } from '../models/cart.model.js';
import { CartItem } from '../models/cart-item.model.js';
import { CartRule } from '../models/cart-rule.model.js';
import { CartCartRule } from '../models/cart-cart-rule.model.js';

// Carriers
import { Carrier } from '../models/carrier.model.js';
import { CarrierLang } from '../models/carrier-lang.model.js';
import { CarrierZone } from '../models/carrier-zone.model.js';
import { CarrierRange } from '../models/carrier-range.model.js';
import { CarrierRangePrice } from '../models/carrier-range-price.model.js';

// Orders
import { OrderState } from '../models/order-state.model.js';
import { OrderStateLang } from '../models/order-state-lang.model.js';
import { Order } from '../models/order.model.js';
import { OrderItem } from '../models/order-item.model.js';
import { OrderHistory } from '../models/order-history.model.js';
import { OrderPayment } from '../models/order-payment.model.js';
import { OrderCarrier } from '../models/order-carrier.model.js';

// Pricing
import { SpecificPrice } from '../models/specific-price.model.js';

// Stock
import { StockMovement } from '../models/stock-movement.model.js';

// Wishlist
import { Wishlist } from '../models/wishlist.model.js';
import { WishlistItem } from '../models/wishlist-item.model.js';

// Reviews
import { ProductReview } from '../models/product-review.model.js';

// CMS
import { CmsCategory } from '../models/cms-category.model.js';
import { CmsCategoryLang } from '../models/cms-category-lang.model.js';
import { CmsPage } from '../models/cms-page.model.js';
import { CmsPageLang } from '../models/cms-page-lang.model.js';

import bcrypt from 'bcrypt';

// ─── Helpers ───────────────────────────────────────────────────────────
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDecimal(min: number, max: number, decimals = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateReference(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let ref = '';
  for (let i = 0; i < 9; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ─── Main seed ──────────────────────────────────────────────────────────
async function seedDummy() {
  console.log('🔌 Connecting to database...');
  await sequelize.authenticate();

  console.log('🗑️  Syncing models (force: true) — this will DROP all tables...');
  await sequelize.sync({ force: true });

  // ═══════════════════════════════════════════════════════════════════════
  // 1. BASE DATA (same as seed.ts)
  // ═══════════════════════════════════════════════════════════════════════

  // --- Languages ---
  console.log('🌐 Seeding languages...');
  const [langEs, langEn] = await Lang.bulkCreate([
    { name: 'Español', iso_code: 'es', locale: 'es-ES', active: true, is_default: true },
    { name: 'English', iso_code: 'en', locale: 'en-US', active: true, is_default: false },
  ]);

  // --- Currencies ---
  console.log('💱 Seeding currencies...');
  const [currEur, currUsd] = await Currency.bulkCreate([
    { name: 'Euro', iso_code: 'EUR', symbol: '€', conversion_rate: 1.0, decimals: 2, active: true, is_default: true },
    { name: 'US Dollar', iso_code: 'USD', symbol: '$', conversion_rate: 1.08, decimals: 2, active: true, is_default: false },
  ]);

  // --- Configuration ---
  console.log('⚙️  Seeding configuration...');
  await Configuration.bulkCreate([
    { key: 'SHOP_NAME', value: 'DMShop' },
    { key: 'SHOP_EMAIL', value: 'info@dmshop.com' },
    { key: 'SHOP_PHONE', value: '+34 912 345 678' },
    { key: 'SHOP_ADDRESS', value: 'Calle Gran Vía 1, 28013 Madrid, España' },
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
  console.log('📁 Seeding categories...');
  const rootCategory = await Category.create({ id_parent: null, position: 0, active: true });
  await CategoryLang.bulkCreate([
    { id_category: rootCategory.id, id_lang: langEs.id, name: 'Raíz', description: null, slug: 'raiz', meta_title: null, meta_description: null },
    { id_category: rootCategory.id, id_lang: langEn.id, name: 'Root', description: null, slug: 'root', meta_title: null, meta_description: null },
  ]);

  const homeCategory = await Category.create({ id_parent: rootCategory.id, position: 0, active: true });
  await CategoryLang.bulkCreate([
    { id_category: homeCategory.id, id_lang: langEs.id, name: 'Inicio', description: 'Categoría principal de la tienda', slug: 'inicio', meta_title: 'Inicio', meta_description: null },
    { id_category: homeCategory.id, id_lang: langEn.id, name: 'Home', description: 'Main store category', slug: 'home', meta_title: 'Home', meta_description: null },
  ]);

  // --- Admin user ---
  console.log('👤 Seeding admin user...');
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
  console.log('🌍 Seeding zones...');
  const [zoneEurope, zoneNorthAmerica] = await Zone.bulkCreate([
    { name: 'Europa', active: true },
    { name: 'Norteamérica', active: true },
  ]);

  // --- Countries ---
  console.log('🏳️  Seeding countries...');
  const countries = await Country.bulkCreate([
    { id_zone: zoneEurope.id, iso_code: 'ES', name: 'España', active: true, contains_states: true, need_zip_code: true },
    { id_zone: zoneEurope.id, iso_code: 'FR', name: 'Francia', active: true, contains_states: false, need_zip_code: true },
    { id_zone: zoneEurope.id, iso_code: 'DE', name: 'Alemania', active: true, contains_states: true, need_zip_code: true },
    { id_zone: zoneEurope.id, iso_code: 'IT', name: 'Italia', active: true, contains_states: false, need_zip_code: true },
    { id_zone: zoneEurope.id, iso_code: 'PT', name: 'Portugal', active: true, contains_states: false, need_zip_code: true },
    { id_zone: zoneEurope.id, iso_code: 'GB', name: 'Reino Unido', active: true, contains_states: false, need_zip_code: true },
    { id_zone: zoneNorthAmerica.id, iso_code: 'US', name: 'Estados Unidos', active: true, contains_states: true, need_zip_code: true },
  ]);
  const spain = countries[0];

  // --- States (Spanish provinces) ---
  console.log('🏘️  Seeding states...');
  const statesData = [
    { iso: 'C', name: 'A Coruña' }, { iso: 'VI', name: 'Álava' }, { iso: 'AB', name: 'Albacete' },
    { iso: 'A', name: 'Alicante' }, { iso: 'AL', name: 'Almería' }, { iso: 'O', name: 'Asturias' },
    { iso: 'AV', name: 'Ávila' }, { iso: 'BA', name: 'Badajoz' }, { iso: 'B', name: 'Barcelona' },
    { iso: 'BU', name: 'Burgos' }, { iso: 'CC', name: 'Cáceres' }, { iso: 'CA', name: 'Cádiz' },
    { iso: 'S', name: 'Cantabria' }, { iso: 'CS', name: 'Castellón' }, { iso: 'CE', name: 'Ceuta' },
    { iso: 'CR', name: 'Ciudad Real' }, { iso: 'CO', name: 'Córdoba' }, { iso: 'CU', name: 'Cuenca' },
    { iso: 'GI', name: 'Girona' }, { iso: 'GR', name: 'Granada' }, { iso: 'GU', name: 'Guadalajara' },
    { iso: 'SS', name: 'Guipúzcoa' }, { iso: 'H', name: 'Huelva' }, { iso: 'HU', name: 'Huesca' },
    { iso: 'PM', name: 'Islas Baleares' }, { iso: 'J', name: 'Jaén' }, { iso: 'TF', name: 'Las Palmas' },
    { iso: 'LE', name: 'León' }, { iso: 'L', name: 'Lleida' }, { iso: 'LU', name: 'Lugo' },
    { iso: 'M', name: 'Madrid' }, { iso: 'MA', name: 'Málaga' }, { iso: 'ML', name: 'Melilla' },
    { iso: 'MU', name: 'Murcia' }, { iso: 'NA', name: 'Navarra' }, { iso: 'OR', name: 'Ourense' },
    { iso: 'P', name: 'Palencia' }, { iso: 'PO', name: 'Pontevedra' }, { iso: 'LO', name: 'La Rioja' },
    { iso: 'SA', name: 'Salamanca' }, { iso: 'GC', name: 'Santa Cruz de Tenerife' },
    { iso: 'SG', name: 'Segovia' }, { iso: 'SE', name: 'Sevilla' }, { iso: 'SO', name: 'Soria' },
    { iso: 'T', name: 'Tarragona' }, { iso: 'TE', name: 'Teruel' }, { iso: 'TO', name: 'Toledo' },
    { iso: 'V', name: 'Valencia' }, { iso: 'VA', name: 'Valladolid' }, { iso: 'BI', name: 'Vizcaya' },
    { iso: 'ZA', name: 'Zamora' }, { iso: 'Z', name: 'Zaragoza' },
  ];
  const spanishStates = await State.bulkCreate(
    statesData.map((s) => ({ id_country: spain.id, iso_code: s.iso, name: s.name, active: true })),
  );
  // Madrid index = 30 (0-based)
  const madridState = spanishStates[30];
  const barcelonaState = spanishStates[8];
  const valenciaState = spanishStates[47];
  const sevillaState = spanishStates[42];

  // --- Taxes ---
  console.log('💰 Seeding taxes...');
  const [taxGeneral, taxReduced, taxSuperReduced] = await Tax.bulkCreate([
    { name: 'IVA 21%', rate: 21.0, active: true },
    { name: 'IVA 10%', rate: 10.0, active: true },
    { name: 'IVA 4%', rate: 4.0, active: true },
  ]);

  const [trgGeneral, trgReduced, trgSuperReduced] = await TaxRulesGroup.bulkCreate([
    { name: 'IVA General 21%', active: true },
    { name: 'IVA Reducido 10%', active: true },
    { name: 'IVA Superreducido 4%', active: true },
  ]);

  await TaxRule.bulkCreate([
    { id_tax_rules_group: trgGeneral.id, id_country: spain.id, id_state: null, id_tax: taxGeneral.id, behavior: 0 },
    { id_tax_rules_group: trgReduced.id, id_country: spain.id, id_state: null, id_tax: taxReduced.id, behavior: 0 },
    { id_tax_rules_group: trgSuperReduced.id, id_country: spain.id, id_state: null, id_tax: taxSuperReduced.id, behavior: 0 },
  ]);

  // --- Order States ---
  console.log('📋 Seeding order states...');
  const orderStatesData = [
    { id: 1, name: 'Pendiente de pago', color: '#4169E1', paid: false, shipped: false, delivery: false, template: 'awaiting_payment' },
    { id: 2, name: 'Pago aceptado', color: '#32CD32', paid: true, shipped: false, delivery: false, template: 'payment_accepted' },
    { id: 3, name: 'En preparación', color: '#FF8C00', paid: true, shipped: false, delivery: false, template: 'processing' },
    { id: 4, name: 'Enviado', color: '#8A2BE2', paid: true, shipped: true, delivery: false, template: 'shipped' },
    { id: 5, name: 'Entregado', color: '#228B22', paid: true, shipped: true, delivery: true, template: 'delivered' },
    { id: 6, name: 'Cancelado', color: '#DC143C', paid: false, shipped: false, delivery: false, template: 'cancelled' },
    { id: 7, name: 'Reembolsado', color: '#EC7063', paid: false, shipped: false, delivery: false, template: 'refunded' },
    { id: 8, name: 'Error en el pago', color: '#E74C3C', paid: false, shipped: false, delivery: false, template: 'payment_error' },
    { id: 9, name: 'En espera', color: '#7F8C8D', paid: false, shipped: false, delivery: false, template: 'on_hold' },
    { id: 10, name: 'En espera de confirmación de pago', color: '#F39C12', paid: false, shipped: false, delivery: false, send_email: true, template: null },
    { id: 11, name: 'En espera de contra reembolso', color: '#16A085', paid: false, shipped: false, delivery: false, send_email: true, template: null },
  ];
  await OrderState.bulkCreate(orderStatesData);

  // Order State Lang translations
  const orderStateLangData: { id_order_state: number; id_lang: number; name: string }[] = [];
  const orderStateEnNames: Record<number, string> = {
    1: 'Awaiting payment', 2: 'Payment accepted', 3: 'Processing',
    4: 'Shipped', 5: 'Delivered', 6: 'Cancelled', 7: 'Refunded',
    8: 'Payment error', 9: 'On hold', 10: 'Awaiting payment confirmation',
    11: 'Awaiting cash on delivery',
  };
  for (const os of orderStatesData) {
    orderStateLangData.push({ id_order_state: os.id, id_lang: langEs.id, name: os.name });
    orderStateLangData.push({ id_order_state: os.id, id_lang: langEn.id, name: orderStateEnNames[os.id] });
  }
  await OrderStateLang.bulkCreate(orderStateLangData);

  // --- Customer Groups ---
  console.log('👥 Seeding customer groups...');
  const defaultGroups = [
    { id: 1, reduction: 0, price_display_method: 0, show_prices: true, deleted: false },
    { id: 2, reduction: 0, price_display_method: 0, show_prices: true, deleted: false },
    { id: 3, reduction: 0, price_display_method: 0, show_prices: true, deleted: false },
  ];
  for (const group of defaultGroups) {
    await CustomerGroup.findOrCreate({ where: { id: group.id }, defaults: group });
  }
  const groupNames = [
    { id_customer_group: 1, id_lang: langEs.id, name: 'Visitante' },
    { id_customer_group: 2, id_lang: langEs.id, name: 'Invitado' },
    { id_customer_group: 3, id_lang: langEs.id, name: 'Cliente' },
    { id_customer_group: 1, id_lang: langEn.id, name: 'Visitor' },
    { id_customer_group: 2, id_lang: langEn.id, name: 'Guest' },
    { id_customer_group: 3, id_lang: langEn.id, name: 'Customer' },
  ];
  for (const gn of groupNames) {
    await CustomerGroupLang.findOrCreate({
      where: { id_customer_group: gn.id_customer_group, id_lang: gn.id_lang },
      defaults: gn,
    });
  }
  await UserGroup.findOrCreate({
    where: { id_user: adminUser.id, id_customer_group: 3 },
    defaults: { id_user: adminUser.id, id_customer_group: 3 },
  });

  // --- Carriers ---
  console.log('🚚 Seeding carriers...');
  const carrierStd = await Carrier.create({
    name: 'Envío estándar',
    id_tax_rules_group: trgGeneral.id,
    active: true,
    is_free: false,
    shipping_method: 'price',
    grade: 0,
    delay: 3,
  });
  await CarrierZone.create({ id_carrier: carrierStd.id, id_zone: zoneEurope.id });
  const carrierStdRange = await CarrierRange.create({ id_carrier: carrierStd.id, delimiter1: 0, delimiter2: 10000 });
  await CarrierRangePrice.create({ id_carrier_range: carrierStdRange.id, id_zone: zoneEurope.id, price: 4.99 });

  const carrierExpress = await Carrier.create({
    name: 'Envío express',
    id_tax_rules_group: trgGeneral.id,
    active: true,
    is_free: false,
    shipping_method: 'price',
    grade: 1,
    delay: 1,
  });
  await CarrierZone.create({ id_carrier: carrierExpress.id, id_zone: zoneEurope.id });
  const carrierExpRange = await CarrierRange.create({ id_carrier: carrierExpress.id, delimiter1: 0, delimiter2: 10000 });
  await CarrierRangePrice.create({ id_carrier_range: carrierExpRange.id, id_zone: zoneEurope.id, price: 9.99 });

  const carrierFree = await Carrier.create({
    name: 'Envío gratuito',
    id_tax_rules_group: null,
    active: true,
    is_free: true,
    shipping_method: 'price',
    grade: 2,
    delay: 5,
  });
  await CarrierZone.create({ id_carrier: carrierFree.id, id_zone: zoneEurope.id });

  // Carrier Lang
  await CarrierLang.bulkCreate([
    { id_carrier: carrierStd.id, id_lang: langEs.id, name: 'Envío estándar', delay: '3-5 días laborables' },
    { id_carrier: carrierStd.id, id_lang: langEn.id, name: 'Standard shipping', delay: '3-5 business days' },
    { id_carrier: carrierExpress.id, id_lang: langEs.id, name: 'Envío express', delay: '24 horas' },
    { id_carrier: carrierExpress.id, id_lang: langEn.id, name: 'Express shipping', delay: '24 hours' },
    { id_carrier: carrierFree.id, id_lang: langEs.id, name: 'Envío gratuito', delay: '5-7 días laborables' },
    { id_carrier: carrierFree.id, id_lang: langEn.id, name: 'Free shipping', delay: '5-7 business days' },
  ]);

  // ═══════════════════════════════════════════════════════════════════════
  // 2. DUMMY DATA — Manufacturers & Suppliers
  // ═══════════════════════════════════════════════════════════════════════

  console.log('🏭 Seeding manufacturers...');
  const manufacturers = await Manufacturer.bulkCreate([
    { name: 'TechVision', active: true },
    { name: 'SoundWave Audio', active: true },
    { name: 'UrbanStyle', active: true },
    { name: 'EcoHome', active: true },
    { name: 'FitPro Sports', active: true },
    { name: 'NordicDesign', active: true },
    { name: 'GameForce', active: true },
    { name: 'LuxWatch', active: true },
  ]);

  console.log('📦 Seeding suppliers...');
  const suppliers = await Supplier.bulkCreate([
    { name: 'DistribExpress España', active: true },
    { name: 'GlobalTech Supply', active: true },
    { name: 'EuroLogistics', active: true },
  ]);

  // ═══════════════════════════════════════════════════════════════════════
  // 3. DUMMY DATA — Categories (tree under Home)
  // ═══════════════════════════════════════════════════════════════════════

  console.log('📂 Seeding product categories...');

  interface CatDef {
    es: string; en: string; descEs?: string; descEn?: string;
    children?: CatDef[];
  }
  const categoryTree: CatDef[] = [
    {
      es: 'Electrónica', en: 'Electronics',
      descEs: 'Productos electrónicos y tecnología', descEn: 'Electronics and technology products',
      children: [
        { es: 'Smartphones', en: 'Smartphones', descEs: 'Teléfonos inteligentes', descEn: 'Smart phones' },
        { es: 'Portátiles', en: 'Laptops', descEs: 'Ordenadores portátiles', descEn: 'Laptop computers' },
        { es: 'Auriculares', en: 'Headphones', descEs: 'Auriculares y cascos', descEn: 'Headphones and earbuds' },
        { es: 'Accesorios', en: 'Accessories', descEs: 'Accesorios electrónicos', descEn: 'Electronic accessories' },
      ],
    },
    {
      es: 'Moda', en: 'Fashion',
      descEs: 'Ropa y complementos', descEn: 'Clothing and accessories',
      children: [
        { es: 'Camisetas', en: 'T-Shirts', descEs: 'Camisetas y tops', descEn: 'T-shirts and tops' },
        { es: 'Pantalones', en: 'Pants', descEs: 'Pantalones y jeans', descEn: 'Pants and jeans' },
        { es: 'Zapatillas', en: 'Sneakers', descEs: 'Zapatillas deportivas', descEn: 'Sneakers and trainers' },
        { es: 'Relojes', en: 'Watches', descEs: 'Relojes y smartwatches', descEn: 'Watches and smartwatches' },
      ],
    },
    {
      es: 'Hogar', en: 'Home',
      descEs: 'Productos para el hogar', descEn: 'Home products',
      children: [
        { es: 'Decoración', en: 'Decoration', descEs: 'Decoración del hogar', descEn: 'Home decoration' },
        { es: 'Cocina', en: 'Kitchen', descEs: 'Utensilios de cocina', descEn: 'Kitchen utensils' },
        { es: 'Iluminación', en: 'Lighting', descEs: 'Lámparas y bombillas', descEn: 'Lamps and bulbs' },
      ],
    },
    {
      es: 'Deportes', en: 'Sports',
      descEs: 'Artículos deportivos', descEn: 'Sporting goods',
      children: [
        { es: 'Fitness', en: 'Fitness', descEs: 'Equipamiento fitness', descEn: 'Fitness equipment' },
        { es: 'Ciclismo', en: 'Cycling', descEs: 'Bicicletas y accesorios', descEn: 'Bikes and accessories' },
      ],
    },
    {
      es: 'Gaming', en: 'Gaming',
      descEs: 'Videojuegos y accesorios', descEn: 'Video games and accessories',
      children: [
        { es: 'Consolas', en: 'Consoles', descEs: 'Consolas de videojuegos', descEn: 'Game consoles' },
        { es: 'Periféricos Gaming', en: 'Gaming Peripherals', descEs: 'Teclados, ratones y alfombrillas', descEn: 'Keyboards, mice and pads' },
      ],
    },
  ];

  // category id → model for later use
  const catMap: Record<string, Category> = {};

  let catPos = 0;
  for (const topCat of categoryTree) {
    const parent = await Category.create({ id_parent: homeCategory.id, position: catPos++, active: true });
    catMap[topCat.en] = parent;
    await CategoryLang.bulkCreate([
      { id_category: parent.id, id_lang: langEs.id, name: topCat.es, description: topCat.descEs ?? null, slug: slugify(topCat.es), meta_title: topCat.es, meta_description: topCat.descEs ?? null },
      { id_category: parent.id, id_lang: langEn.id, name: topCat.en, description: topCat.descEn ?? null, slug: slugify(topCat.en), meta_title: topCat.en, meta_description: topCat.descEn ?? null },
    ]);

    if (topCat.children) {
      let childPos = 0;
      for (const child of topCat.children) {
        const sub = await Category.create({ id_parent: parent.id, position: childPos++, active: true });
        catMap[child.en] = sub;
        await CategoryLang.bulkCreate([
          { id_category: sub.id, id_lang: langEs.id, name: child.es, description: child.descEs ?? null, slug: slugify(child.es), meta_title: child.es, meta_description: child.descEs ?? null },
          { id_category: sub.id, id_lang: langEn.id, name: child.en, description: child.descEn ?? null, slug: slugify(child.en), meta_title: child.en, meta_description: child.descEn ?? null },
        ]);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 4. DUMMY DATA — Attributes (Color, Size)
  // ═══════════════════════════════════════════════════════════════════════

  console.log('🎨 Seeding attributes...');

  const attrColor = await Attribute.create({ position: 0 });
  await AttributeLang.bulkCreate([
    { id_attribute: attrColor.id, id_lang: langEs.id, name: 'Color' },
    { id_attribute: attrColor.id, id_lang: langEn.id, name: 'Color' },
  ]);

  const colorDefs = [
    { color: '#000000', es: 'Negro', en: 'Black' },
    { color: '#FFFFFF', es: 'Blanco', en: 'White' },
    { color: '#FF0000', es: 'Rojo', en: 'Red' },
    { color: '#0000FF', es: 'Azul', en: 'Blue' },
    { color: '#008000', es: 'Verde', en: 'Green' },
    { color: '#808080', es: 'Gris', en: 'Grey' },
  ];
  const colorValues: AttributeValue[] = [];
  for (let i = 0; i < colorDefs.length; i++) {
    const av = await AttributeValue.create({ id_attribute: attrColor.id, color: colorDefs[i].color, position: i });
    await AttributeValueLang.bulkCreate([
      { id_attribute_value: av.id, id_lang: langEs.id, name: colorDefs[i].es },
      { id_attribute_value: av.id, id_lang: langEn.id, name: colorDefs[i].en },
    ]);
    colorValues.push(av);
  }

  const attrSize = await Attribute.create({ position: 1 });
  await AttributeLang.bulkCreate([
    { id_attribute: attrSize.id, id_lang: langEs.id, name: 'Talla' },
    { id_attribute: attrSize.id, id_lang: langEn.id, name: 'Size' },
  ]);

  const sizeDefs = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const sizeValues: AttributeValue[] = [];
  for (let i = 0; i < sizeDefs.length; i++) {
    const av = await AttributeValue.create({ id_attribute: attrSize.id, color: null, position: i });
    await AttributeValueLang.bulkCreate([
      { id_attribute_value: av.id, id_lang: langEs.id, name: sizeDefs[i] },
      { id_attribute_value: av.id, id_lang: langEn.id, name: sizeDefs[i] },
    ]);
    sizeValues.push(av);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 5. DUMMY DATA — Features (Material, Brand, Warranty)
  // ═══════════════════════════════════════════════════════════════════════

  console.log('🔧 Seeding features...');

  interface FeatDef { es: string; en: string; values: { es: string; en: string }[] }
  const featureDefs: FeatDef[] = [
    {
      es: 'Material', en: 'Material',
      values: [
        { es: 'Algodón', en: 'Cotton' }, { es: 'Poliéster', en: 'Polyester' },
        { es: 'Cuero', en: 'Leather' }, { es: 'Aluminio', en: 'Aluminum' },
        { es: 'Plástico ABS', en: 'ABS Plastic' }, { es: 'Acero inoxidable', en: 'Stainless Steel' },
      ],
    },
    {
      es: 'Garantía', en: 'Warranty',
      values: [
        { es: '6 meses', en: '6 months' }, { es: '1 año', en: '1 year' },
        { es: '2 años', en: '2 years' }, { es: '3 años', en: '3 years' },
      ],
    },
    {
      es: 'Conectividad', en: 'Connectivity',
      values: [
        { es: 'Bluetooth 5.0', en: 'Bluetooth 5.0' }, { es: 'WiFi 6', en: 'WiFi 6' },
        { es: 'USB-C', en: 'USB-C' }, { es: 'NFC', en: 'NFC' },
      ],
    },
  ];

  const featureMap: Record<string, { feature: Feature; values: FeatureValue[] }> = {};
  for (let fi = 0; fi < featureDefs.length; fi++) {
    const fd = featureDefs[fi];
    const feature = await Feature.create({ position: fi });
    await FeatureLang.bulkCreate([
      { id_feature: feature.id, id_lang: langEs.id, name: fd.es },
      { id_feature: feature.id, id_lang: langEn.id, name: fd.en },
    ]);
    const fvs: FeatureValue[] = [];
    for (const v of fd.values) {
      const fv = await FeatureValue.create({ id_feature: feature.id, custom: false });
      await FeatureValueLang.bulkCreate([
        { id_feature_value: fv.id, id_lang: langEs.id, value: v.es },
        { id_feature_value: fv.id, id_lang: langEn.id, value: v.en },
      ]);
      fvs.push(fv);
    }
    featureMap[fd.en] = { feature, values: fvs };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 6. DUMMY DATA — Products (20 products)
  // ═══════════════════════════════════════════════════════════════════════

  console.log('🛍️  Seeding products...');

  interface ProdDef {
    es: string; en: string;
    descEs: string; descEn: string;
    shortEs: string; shortEn: string;
    price: number; weight: number; quantity: number;
    category: string; extraCategories?: string[];
    manufacturer: number;
    reference: string;
    hasCombinations?: boolean;
    features?: { feature: string; valueIdx: number }[];
  }

  const productDefs: ProdDef[] = [
    {
      es: 'Smartphone ProMax 15', en: 'Smartphone ProMax 15',
      descEs: 'Smartphone de última generación con pantalla AMOLED de 6.7 pulgadas, procesador octa-core y cámara triple de 108MP. Batería de 5000mAh con carga rápida de 67W.',
      descEn: 'Latest generation smartphone with 6.7-inch AMOLED display, octa-core processor and 108MP triple camera. 5000mAh battery with 67W fast charging.',
      shortEs: 'Smartphone con pantalla AMOLED 6.7" y cámara 108MP', shortEn: 'Smartphone with 6.7" AMOLED display and 108MP camera',
      price: 899.99, weight: 0.195, quantity: 150,
      category: 'Smartphones', manufacturer: 0, reference: 'TV-SPM15',
      hasCombinations: true,
      features: [{ feature: 'Warranty', valueIdx: 2 }, { feature: 'Connectivity', valueIdx: 0 }],
    },
    {
      es: 'Smartphone Lite 8', en: 'Smartphone Lite 8',
      descEs: 'Smartphone asequible con pantalla IPS de 6.5 pulgadas, 128GB de almacenamiento y batería de 4500mAh. Ideal para uso diario.',
      descEn: 'Affordable smartphone with 6.5-inch IPS display, 128GB storage and 4500mAh battery. Ideal for daily use.',
      shortEs: 'Smartphone accesible con 128GB', shortEn: 'Affordable smartphone with 128GB',
      price: 249.99, weight: 0.180, quantity: 300,
      category: 'Smartphones', manufacturer: 0, reference: 'TV-SL8',
      hasCombinations: true,
      features: [{ feature: 'Warranty', valueIdx: 1 }, { feature: 'Connectivity', valueIdx: 3 }],
    },
    {
      es: 'Portátil UltraBook Pro 14', en: 'UltraBook Pro 14 Laptop',
      descEs: 'Portátil ultraligero de 14 pulgadas con procesador Intel i7-13700H, 16GB RAM DDR5 y SSD NVMe de 512GB. Pantalla 2.8K OLED.',
      descEn: 'Ultra-light 14-inch laptop with Intel i7-13700H processor, 16GB DDR5 RAM and 512GB NVMe SSD. 2.8K OLED display.',
      shortEs: 'Portátil ultraligero 14" con pantalla OLED', shortEn: 'Ultra-light 14" laptop with OLED display',
      price: 1299.99, weight: 1.400, quantity: 75,
      category: 'Laptops', manufacturer: 0, reference: 'TV-UBP14',
      features: [{ feature: 'Material', valueIdx: 3 }, { feature: 'Warranty', valueIdx: 3 }, { feature: 'Connectivity', valueIdx: 1 }],
    },
    {
      es: 'Portátil Gaming Beast 16', en: 'Gaming Beast 16 Laptop',
      descEs: 'Portátil gaming con pantalla IPS de 16 pulgadas a 165Hz, RTX 4070, 32GB RAM y SSD de 1TB. Teclado RGB mecánico.',
      descEn: 'Gaming laptop with 16-inch 165Hz IPS display, RTX 4070, 32GB RAM and 1TB SSD. Mechanical RGB keyboard.',
      shortEs: 'Portátil gaming 16" con RTX 4070', shortEn: 'Gaming laptop 16" with RTX 4070',
      price: 1899.99, weight: 2.500, quantity: 40,
      category: 'Laptops', extraCategories: ['Gaming'],
      manufacturer: 6, reference: 'GF-GB16',
      features: [{ feature: 'Warranty', valueIdx: 2 }, { feature: 'Connectivity', valueIdx: 1 }],
    },
    {
      es: 'Auriculares Noise Pro ANC', en: 'Noise Pro ANC Headphones',
      descEs: 'Auriculares over-ear con cancelación activa de ruido, sonido Hi-Res, 40 horas de batería y conectividad multipoint Bluetooth 5.3.',
      descEn: 'Over-ear headphones with active noise cancellation, Hi-Res sound, 40h battery and multipoint Bluetooth 5.3 connectivity.',
      shortEs: 'Auriculares con cancelación de ruido ANC', shortEn: 'ANC noise cancelling headphones',
      price: 179.99, weight: 0.260, quantity: 200,
      category: 'Headphones', manufacturer: 1, reference: 'SW-NPA',
      hasCombinations: true,
      features: [{ feature: 'Material', valueIdx: 4 }, { feature: 'Warranty', valueIdx: 1 }, { feature: 'Connectivity', valueIdx: 0 }],
    },
    {
      es: 'Auriculares True Wireless Sport', en: 'True Wireless Sport Earbuds',
      descEs: 'Auriculares in-ear true wireless con certificación IP67, 8 horas de batería y estuche de carga inalámbrica.',
      descEn: 'True wireless in-ear earbuds with IP67 rating, 8h battery and wireless charging case.',
      shortEs: 'Auriculares inalámbricos deportivos IP67', shortEn: 'IP67 wireless sports earbuds',
      price: 89.99, weight: 0.058, quantity: 500,
      category: 'Headphones', manufacturer: 1, reference: 'SW-TWS',
      features: [{ feature: 'Warranty', valueIdx: 1 }, { feature: 'Connectivity', valueIdx: 0 }],
    },
    {
      es: 'Funda de Silicona Universal', en: 'Universal Silicone Case',
      descEs: 'Funda protectora de silicona premium con diseño antideslizante, compatible con la mayoría de smartphones.',
      descEn: 'Premium silicone protective case with anti-slip design, compatible with most smartphones.',
      shortEs: 'Funda de silicona antideslizante', shortEn: 'Anti-slip silicone case',
      price: 12.99, weight: 0.040, quantity: 1000,
      category: 'Accessories', manufacturer: 0, reference: 'TV-FSU',
      hasCombinations: true,
      features: [{ feature: 'Material', valueIdx: 4 }],
    },
    {
      es: 'Camiseta Premium Algodón Orgánico', en: 'Premium Organic Cotton T-Shirt',
      descEs: 'Camiseta de algodón orgánico 100% certificado GOTS. Corte regular, tacto suave y resistente a múltiples lavados.',
      descEn: '100% GOTS certified organic cotton t-shirt. Regular fit, soft touch and resistant to multiple washes.',
      shortEs: 'Camiseta algodón orgánico GOTS', shortEn: 'GOTS organic cotton t-shirt',
      price: 29.99, weight: 0.200, quantity: 800,
      category: 'T-Shirts', manufacturer: 2, reference: 'US-CPO',
      hasCombinations: true,
      features: [{ feature: 'Material', valueIdx: 0 }],
    },
    {
      es: 'Camiseta Técnica Deportiva', en: 'Sports Technical T-Shirt',
      descEs: 'Camiseta técnica con tejido transpirable DryFit, ideal para running y entrenamiento. Secado ultrarrápido.',
      descEn: 'Technical t-shirt with breathable DryFit fabric, ideal for running and training. Ultra-fast drying.',
      shortEs: 'Camiseta técnica DryFit', shortEn: 'DryFit technical t-shirt',
      price: 24.99, weight: 0.150, quantity: 600,
      category: 'T-Shirts', extraCategories: ['Fitness'],
      manufacturer: 4, reference: 'FP-CTD',
      hasCombinations: true,
      features: [{ feature: 'Material', valueIdx: 1 }],
    },
    {
      es: 'Pantalón Vaquero Slim Fit', en: 'Slim Fit Jeans',
      descEs: 'Vaquero slim fit con tejido elástico para mayor comodidad. Disponible en varios lavados.',
      descEn: 'Slim fit jeans with stretch fabric for comfort. Available in several washes.',
      shortEs: 'Vaquero slim fit elástico', shortEn: 'Stretch slim fit jeans',
      price: 49.99, weight: 0.500, quantity: 400,
      category: 'Pants', manufacturer: 2, reference: 'US-PSF',
      hasCombinations: true,
      features: [{ feature: 'Material', valueIdx: 0 }],
    },
    {
      es: 'Zapatillas Running Flow 3.0', en: 'Running Flow 3.0 Sneakers',
      descEs: 'Zapatillas de running con mediasuela de espuma reactiva, upper de malla transpirable y suela de goma Vibram.',
      descEn: 'Running sneakers with reactive foam midsole, breathable mesh upper and Vibram rubber outsole.',
      shortEs: 'Zapatillas running con espuma reactiva', shortEn: 'Running sneakers with reactive foam',
      price: 119.99, weight: 0.320, quantity: 250,
      category: 'Sneakers', extraCategories: ['Fitness'],
      manufacturer: 4, reference: 'FP-RF3',
      hasCombinations: true,
      features: [{ feature: 'Material', valueIdx: 1 }, { feature: 'Warranty', valueIdx: 0 }],
    },
    {
      es: 'Reloj Inteligente SportWatch Pro', en: 'SportWatch Pro Smartwatch',
      descEs: 'Smartwatch con pantalla AMOLED de 1.43", GPS integrado, monitor de frecuencia cardíaca y SpO2. Resistencia al agua 5ATM.',
      descEn: 'Smartwatch with 1.43" AMOLED display, built-in GPS, heart rate and SpO2 monitor. 5ATM water resistance.',
      shortEs: 'Smartwatch deportivo con GPS y AMOLED', shortEn: 'Sports smartwatch with GPS and AMOLED',
      price: 199.99, weight: 0.050, quantity: 180,
      category: 'Watches', manufacturer: 7, reference: 'LW-SWP',
      hasCombinations: true,
      features: [{ feature: 'Material', valueIdx: 3 }, { feature: 'Warranty', valueIdx: 2 }, { feature: 'Connectivity', valueIdx: 0 }],
    },
    {
      es: 'Lámpara de Mesa LED Nordic', en: 'Nordic LED Table Lamp',
      descEs: 'Lámpara de mesa LED con diseño nórdico minimalista, 3 niveles de brillo y temperatura de color ajustable.',
      descEn: 'LED table lamp with minimalist Nordic design, 3 brightness levels and adjustable color temperature.',
      shortEs: 'Lámpara nórdica LED regulable', shortEn: 'Dimmable Nordic LED lamp',
      price: 59.99, weight: 1.200, quantity: 120,
      category: 'Lighting', manufacturer: 5, reference: 'ND-LMN',
      features: [{ feature: 'Material', valueIdx: 3 }, { feature: 'Warranty', valueIdx: 1 }],
    },
    {
      es: 'Jarrón Decorativo Cerámica Artesanal', en: 'Handcrafted Ceramic Decorative Vase',
      descEs: 'Jarrón de cerámica artesanal con acabado mate. Diseño contemporáneo que combina con cualquier estilo decorativo.',
      descEn: 'Handcrafted ceramic vase with matte finish. Contemporary design that matches any decorative style.',
      shortEs: 'Jarrón cerámica artesanal mate', shortEn: 'Handcrafted matte ceramic vase',
      price: 39.99, weight: 0.800, quantity: 90,
      category: 'Decoration', manufacturer: 5, reference: 'ND-JDC',
      features: [{ feature: 'Warranty', valueIdx: 0 }],
    },
    {
      es: 'Set de Cuchillos Chef Profesional', en: 'Professional Chef Knife Set',
      descEs: 'Set de 5 cuchillos de acero inoxidable alemán con bloque magnético de madera de acacia.',
      descEn: 'Set of 5 German stainless steel knives with acacia wood magnetic block.',
      shortEs: 'Set 5 cuchillos acero inoxidable', shortEn: '5-piece stainless steel knife set',
      price: 89.99, weight: 2.100, quantity: 60,
      category: 'Kitchen', manufacturer: 3, reference: 'EH-SCP',
      features: [{ feature: 'Material', valueIdx: 5 }, { feature: 'Warranty', valueIdx: 3 }],
    },
    {
      es: 'Mancuernas Ajustables 2-24kg', en: 'Adjustable Dumbbells 2-24kg',
      descEs: 'Par de mancuernas ajustables de 2 a 24 kg con sistema de ajuste rápido por dial. Recubrimiento de goma antideslizante.',
      descEn: 'Pair of adjustable dumbbells from 2 to 24 kg with quick dial adjustment system. Anti-slip rubber coating.',
      shortEs: 'Mancuernas ajustables 2-24kg con dial', shortEn: 'Adjustable dumbbells 2-24kg with dial',
      price: 199.99, weight: 48.0, quantity: 45,
      category: 'Fitness', manufacturer: 4, reference: 'FP-MA24',
      features: [{ feature: 'Material', valueIdx: 5 }, { feature: 'Warranty', valueIdx: 2 }],
    },
    {
      es: 'Bicicleta de Montaña Trail 29"', en: 'Trail 29" Mountain Bike',
      descEs: 'Bicicleta de montaña con cuadro de aluminio, horquilla de suspensión de 120mm, frenos de disco hidráulicos y transmisión Shimano Deore.',
      descEn: 'Mountain bike with aluminum frame, 120mm suspension fork, hydraulic disc brakes and Shimano Deore drivetrain.',
      shortEs: 'MTB 29" aluminio con Shimano Deore', shortEn: '29" aluminum MTB with Shimano Deore',
      price: 799.99, weight: 13.5, quantity: 25,
      category: 'Cycling', manufacturer: 4, reference: 'FP-BT29',
      features: [{ feature: 'Material', valueIdx: 3 }, { feature: 'Warranty', valueIdx: 2 }],
    },
    {
      es: 'Mando Inalámbrico Pro Controller', en: 'Pro Controller Wireless Gamepad',
      descEs: 'Mando inalámbrico con vibración háptica, giroscopio de 6 ejes, gatillos analógicos y batería de 20 horas. Compatible con PC y consolas.',
      descEn: 'Wireless gamepad with haptic vibration, 6-axis gyroscope, analog triggers and 20h battery. Compatible with PC and consoles.',
      shortEs: 'Mando pro inalámbrico con háptica', shortEn: 'Wireless pro gamepad with haptics',
      price: 69.99, weight: 0.280, quantity: 350,
      category: 'Gaming Peripherals', manufacturer: 6, reference: 'GF-MPC',
      hasCombinations: true,
      features: [{ feature: 'Material', valueIdx: 4 }, { feature: 'Warranty', valueIdx: 1 }, { feature: 'Connectivity', valueIdx: 0 }],
    },
    {
      es: 'Teclado Mecánico RGB 65%', en: 'RGB Mechanical Keyboard 65%',
      descEs: 'Teclado mecánico compacto 65% con switches intercambiables hot-swap, iluminación RGB por tecla y carcasa de aluminio CNC.',
      descEn: 'Compact 65% mechanical keyboard with hot-swap switches, per-key RGB lighting and CNC aluminum case.',
      shortEs: 'Teclado mecánico 65% hot-swap RGB', shortEn: '65% hot-swap RGB mechanical keyboard',
      price: 109.99, weight: 0.720, quantity: 160,
      category: 'Gaming Peripherals', manufacturer: 6, reference: 'GF-TM65',
      features: [{ feature: 'Material', valueIdx: 3 }, { feature: 'Warranty', valueIdx: 2 }, { feature: 'Connectivity', valueIdx: 2 }],
    },
    {
      es: 'Consola RetroStation Mini', en: 'RetroStation Mini Console',
      descEs: 'Consola retro con 500 juegos clásicos preinstalados, salida HDMI, 2 mandos incluidos y posibilidad de añadir juegos vía USB.',
      descEn: 'Retro console with 500 pre-installed classic games, HDMI output, 2 controllers included and add games via USB.',
      shortEs: 'Consola retro con 500 juegos', shortEn: 'Retro console with 500 games',
      price: 59.99, weight: 0.350, quantity: 200,
      category: 'Consoles', manufacturer: 6, reference: 'GF-RSM',
      features: [{ feature: 'Material', valueIdx: 4 }, { feature: 'Warranty', valueIdx: 1 }],
    },
  ];

  const products: Product[] = [];

  for (const pd of productDefs) {
    const cat = catMap[pd.category];
    const product = await Product.create({
      id_category_default: cat.id,
      id_manufacturer: manufacturers[pd.manufacturer].id,
      id_supplier: randomElement(suppliers).id,
      id_tax_rule_group: trgGeneral.id,
      reference: pd.reference,
      ean13: null,
      price: pd.price,
      wholesale_price: parseFloat((pd.price * 0.5).toFixed(2)),
      weight: pd.weight,
      quantity: pd.quantity,
      active: true,
      available_for_order: true,
      show_price: true,
      is_virtual: false,
      low_stock_alert: 5,
    });

    await ProductLang.bulkCreate([
      {
        id_product: product.id, id_lang: langEs.id,
        name: pd.es, description: pd.descEs, description_short: pd.shortEs,
        slug: slugify(pd.es), meta_title: pd.es, meta_description: pd.shortEs,
      },
      {
        id_product: product.id, id_lang: langEn.id,
        name: pd.en, description: pd.descEn, description_short: pd.shortEn,
        slug: slugify(pd.en), meta_title: pd.en, meta_description: pd.shortEn,
      },
    ]);

    // Product images (dummy paths)
    await ProductImage.bulkCreate([
      { id_product: product.id, position: 0, cover: true, path: `products/${product.id}/1.jpg` },
      { id_product: product.id, position: 1, cover: false, path: `products/${product.id}/2.jpg` },
      { id_product: product.id, position: 2, cover: false, path: `products/${product.id}/3.jpg` },
    ]);

    // Product categories
    await ProductCategory.create({ id_product: product.id, id_category: cat.id, position: 0 });
    if (pd.extraCategories) {
      for (let ei = 0; ei < pd.extraCategories.length; ei++) {
        const extraCat = catMap[pd.extraCategories[ei]];
        if (extraCat) {
          await ProductCategory.create({ id_product: product.id, id_category: extraCat.id, position: ei + 1 });
        }
      }
    }

    // Product features
    if (pd.features) {
      for (const pf of pd.features) {
        const feat = featureMap[pf.feature];
        if (feat) {
          await ProductFeature.create({
            id_product: product.id,
            id_feature: feat.feature.id,
            id_feature_value: feat.values[pf.valueIdx].id,
          });
        }
      }
    }

    products.push(product);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 7. DUMMY DATA — Combinations (for products that have them)
  // ═══════════════════════════════════════════════════════════════════════

  console.log('🔀 Seeding product combinations...');

  for (let pi = 0; pi < productDefs.length; pi++) {
    const pd = productDefs[pi];
    const product = products[pi];
    if (!pd.hasCombinations) continue;

    const cat = pd.category;
    const isClothing = ['T-Shirts', 'Pants', 'Sneakers'].includes(cat);
    const isWatch = cat === 'Watches';

    let combColors = [colorValues[0], colorValues[1], colorValues[5]]; // Black, White, Grey
    let combSizes: AttributeValue[] | null = null;

    if (isClothing) {
      combColors = [colorValues[0], colorValues[1], colorValues[2], colorValues[3]]; // Black, White, Red, Blue
      combSizes = [sizeValues[1], sizeValues[2], sizeValues[3], sizeValues[4]]; // S, M, L, XL
    } else if (isWatch) {
      combColors = [colorValues[0], colorValues[1], colorValues[5]]; // Black, White, Grey
    }

    let isFirst = true;
    if (isClothing && combSizes) {
      // Color × Size
      for (const color of combColors) {
        for (const size of combSizes) {
          const combo = await ProductCombination.create({
            id_product: product.id,
            reference: `${pd.reference}-${color.id}-${size.id}`,
            ean13: null,
            price_impact: 0,
            weight_impact: 0,
            quantity: randomInt(5, 50),
            is_default: isFirst,
          });
          await CombinationAttributeValue.bulkCreate([
            { id_combination: combo.id, id_attribute_value: color.id },
            { id_combination: combo.id, id_attribute_value: size.id },
          ]);
          isFirst = false;
        }
      }
    } else {
      // Color only
      for (const color of combColors) {
        const priceImpact = color === colorValues[0] ? 0 : randomDecimal(-10, 20, 2);
        const combo = await ProductCombination.create({
          id_product: product.id,
          reference: `${pd.reference}-${color.id}`,
          ean13: null,
          price_impact: priceImpact,
          weight_impact: 0,
          quantity: randomInt(10, 80),
          is_default: isFirst,
        });
        await CombinationAttributeValue.create({
          id_combination: combo.id,
          id_attribute_value: color.id,
        });
        isFirst = false;
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 8. DUMMY DATA — Customer Users + Addresses
  // ═══════════════════════════════════════════════════════════════════════

  console.log('👤 Seeding customer users...');

  const customerPassword = await bcrypt.hash('Customer123!', 12);

  interface CustomerDef {
    email: string; first_name: string; last_name: string; newsletter: boolean;
    addresses: {
      alias: string; address1: string; city: string; postcode: string;
      stateIdx: number; phone: string;
    }[];
  }

  const customerDefs: CustomerDef[] = [
    {
      email: 'maria.garcia@example.com', first_name: 'María', last_name: 'García López', newsletter: true,
      addresses: [
        { alias: 'Casa', address1: 'Calle Mayor 15, 2ºB', city: 'Madrid', postcode: '28013', stateIdx: 30, phone: '+34 612345001' },
        { alias: 'Trabajo', address1: 'Paseo de la Castellana 50', city: 'Madrid', postcode: '28046', stateIdx: 30, phone: '+34 612345002' },
      ],
    },
    {
      email: 'carlos.martinez@example.com', first_name: 'Carlos', last_name: 'Martínez Ruiz', newsletter: true,
      addresses: [
        { alias: 'Mi casa', address1: 'Avinguda Diagonal 450, 3º1ª', city: 'Barcelona', postcode: '08006', stateIdx: 8, phone: '+34 612345003' },
      ],
    },
    {
      email: 'laura.fernandez@example.com', first_name: 'Laura', last_name: 'Fernández Sánchez', newsletter: false,
      addresses: [
        { alias: 'Domicilio', address1: 'Carrer de Colón 22', city: 'Valencia', postcode: '46004', stateIdx: 47, phone: '+34 612345004' },
      ],
    },
    {
      email: 'javier.lopez@example.com', first_name: 'Javier', last_name: 'López Torres', newsletter: true,
      addresses: [
        { alias: 'Casa', address1: 'Avenida de la Constitución 8', city: 'Sevilla', postcode: '41001', stateIdx: 42, phone: '+34 612345005' },
      ],
    },
    {
      email: 'ana.rodriguez@example.com', first_name: 'Ana', last_name: 'Rodríguez Pérez', newsletter: false,
      addresses: [
        { alias: 'Hogar', address1: 'Calle Alcalá 100, 5ºA', city: 'Madrid', postcode: '28009', stateIdx: 30, phone: '+34 612345006' },
      ],
    },
    {
      email: 'pablo.sanchez@example.com', first_name: 'Pablo', last_name: 'Sánchez Moreno', newsletter: true,
      addresses: [
        { alias: 'Casa', address1: 'Rambla de Catalunya 80', city: 'Barcelona', postcode: '08008', stateIdx: 8, phone: '+34 612345007' },
      ],
    },
    {
      email: 'elena.diaz@example.com', first_name: 'Elena', last_name: 'Díaz Navarro', newsletter: true,
      addresses: [
        { alias: 'Domicilio', address1: 'Calle Larios 5', city: 'Málaga', postcode: '29005', stateIdx: 31, phone: '+34 612345008' },
      ],
    },
    {
      email: 'david.moreno@example.com', first_name: 'David', last_name: 'Moreno Gil', newsletter: false,
      addresses: [
        { alias: 'Casa', address1: 'Gran Vía de las Germanías 10', city: 'Valencia', postcode: '46006', stateIdx: 47, phone: '+34 612345009' },
      ],
    },
  ];

  const customerUsers: User[] = [];
  const customerAddresses: Address[][] = [];

  for (const cd of customerDefs) {
    const user = await User.create({
      email: cd.email,
      password: customerPassword,
      first_name: cd.first_name,
      last_name: cd.last_name,
      role: 'customer',
      active: true,
      newsletter: cd.newsletter,
    });
    await UserGroup.create({ id_user: user.id, id_customer_group: 3 });

    const addrs: Address[] = [];
    for (const ad of cd.addresses) {
      const addr = await Address.create({
        id_user: user.id,
        id_country: spain.id,
        id_state: spanishStates[ad.stateIdx].id,
        alias: ad.alias,
        first_name: cd.first_name,
        last_name: cd.last_name,
        company: null,
        address1: ad.address1,
        address2: null,
        city: ad.city,
        postcode: ad.postcode,
        phone: ad.phone,
        phone_mobile: ad.phone,
        vat_number: null,
        active: true,
      });
      addrs.push(addr);
    }
    customerUsers.push(user);
    customerAddresses.push(addrs);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 9. DUMMY DATA — Cart Rules (Discount Coupons)
  // ═══════════════════════════════════════════════════════════════════════

  console.log('🎟️  Seeding cart rules (coupons)...');

  const cartRules = await CartRule.bulkCreate([
    {
      code: 'WELCOME10', name: 'Bienvenida 10%', description: '10% de descuento en tu primera compra',
      date_from: new Date('2025-01-01'), date_to: new Date('2026-12-31'),
      quantity: 1000, quantity_per_user: 1, priority: 1,
      minimum_amount: 30, minimum_amount_currency: currEur.id,
      free_shipping: false, reduction_percent: 10, reduction_amount: 0,
      reduction_currency: null, id_customer: null, active: true,
    },
    {
      code: 'SUMMER25', name: 'Verano 25€', description: '25€ de descuento en compras superiores a 100€',
      date_from: new Date('2025-06-01'), date_to: new Date('2026-09-30'),
      quantity: 500, quantity_per_user: 2, priority: 2,
      minimum_amount: 100, minimum_amount_currency: currEur.id,
      free_shipping: false, reduction_percent: 0, reduction_amount: 25,
      reduction_currency: currEur.id, id_customer: null, active: true,
    },
    {
      code: 'FREESHIPVIP', name: 'Envío gratis VIP', description: 'Envío gratuito sin mínimo de compra',
      date_from: new Date('2025-01-01'), date_to: new Date('2027-12-31'),
      quantity: 100, quantity_per_user: 5, priority: 3,
      minimum_amount: 0, minimum_amount_currency: null,
      free_shipping: true, reduction_percent: 0, reduction_amount: 0,
      reduction_currency: null, id_customer: null, active: true,
    },
  ]);

  // ═══════════════════════════════════════════════════════════════════════
  // 10. DUMMY DATA — Specific Prices (Product Discounts)
  // ═══════════════════════════════════════════════════════════════════════

  console.log('💲 Seeding specific prices...');

  // Discounts on a few products
  await SpecificPrice.bulkCreate([
    {
      id_product: products[1].id, // Smartphone Lite 8 — 15% off
      id_combination: null, id_customer: null, id_customer_group: null,
      id_currency: null, id_country: null, from_quantity: 1,
      price: -1, reduction: 15, reduction_type: 'percentage', reduction_tax: true,
      date_from: new Date('2025-01-01'), date_to: new Date('2026-12-31'),
    },
    {
      id_product: products[5].id, // True Wireless Sport — 10€ off
      id_combination: null, id_customer: null, id_customer_group: null,
      id_currency: null, id_country: null, from_quantity: 1,
      price: -1, reduction: 10, reduction_type: 'amount', reduction_tax: true,
      date_from: new Date('2025-06-01'), date_to: new Date('2026-09-30'),
    },
    {
      id_product: products[7].id, // Camiseta Premium — 20% off buying 3+
      id_combination: null, id_customer: null, id_customer_group: null,
      id_currency: null, id_country: null, from_quantity: 3,
      price: -1, reduction: 20, reduction_type: 'percentage', reduction_tax: true,
      date_from: null, date_to: null,
    },
    {
      id_product: products[13].id, // Jarrón Decorativo — fixed price 29.99
      id_combination: null, id_customer: null, id_customer_group: null,
      id_currency: null, id_country: null, from_quantity: 1,
      price: 29.99, reduction: 0, reduction_type: 'percentage', reduction_tax: true,
      date_from: new Date('2025-03-01'), date_to: new Date('2026-06-30'),
    },
  ]);

  // ═══════════════════════════════════════════════════════════════════════
  // 11. DUMMY DATA — Carts + Orders
  // ═══════════════════════════════════════════════════════════════════════

  console.log('🛒 Seeding carts and orders...');

  interface OrderDef {
    customerIdx: number;
    stateId: number;
    paymentMethod: string;
    items: { productIdx: number; qty: number }[];
    carrierId: number;
    daysAgo: number;
  }

  const orderDefs: OrderDef[] = [
    { customerIdx: 0, stateId: 5, paymentMethod: 'paypal', items: [{ productIdx: 0, qty: 1 }, { productIdx: 4, qty: 1 }], carrierId: carrierStd.id, daysAgo: 45 },
    { customerIdx: 0, stateId: 5, paymentMethod: 'credit_card', items: [{ productIdx: 7, qty: 2 }, { productIdx: 9, qty: 1 }], carrierId: carrierStd.id, daysAgo: 30 },
    { customerIdx: 1, stateId: 5, paymentMethod: 'credit_card', items: [{ productIdx: 2, qty: 1 }], carrierId: carrierExpress.id, daysAgo: 40 },
    { customerIdx: 1, stateId: 4, paymentMethod: 'paypal', items: [{ productIdx: 11, qty: 1 }, { productIdx: 6, qty: 2 }], carrierId: carrierStd.id, daysAgo: 10 },
    { customerIdx: 2, stateId: 5, paymentMethod: 'credit_card', items: [{ productIdx: 10, qty: 1 }, { productIdx: 8, qty: 3 }], carrierId: carrierStd.id, daysAgo: 25 },
    { customerIdx: 2, stateId: 3, paymentMethod: 'bank_transfer', items: [{ productIdx: 14, qty: 1 }], carrierId: carrierFree.id, daysAgo: 3 },
    { customerIdx: 3, stateId: 5, paymentMethod: 'credit_card', items: [{ productIdx: 3, qty: 1 }], carrierId: carrierExpress.id, daysAgo: 35 },
    { customerIdx: 3, stateId: 2, paymentMethod: 'paypal', items: [{ productIdx: 17, qty: 1 }, { productIdx: 18, qty: 1 }], carrierId: carrierStd.id, daysAgo: 2 },
    { customerIdx: 4, stateId: 5, paymentMethod: 'credit_card', items: [{ productIdx: 12, qty: 2 }, { productIdx: 13, qty: 1 }], carrierId: carrierStd.id, daysAgo: 20 },
    { customerIdx: 4, stateId: 6, paymentMethod: 'paypal', items: [{ productIdx: 15, qty: 1 }], carrierId: carrierStd.id, daysAgo: 15 },
    { customerIdx: 5, stateId: 5, paymentMethod: 'credit_card', items: [{ productIdx: 1, qty: 1 }, { productIdx: 5, qty: 1 }], carrierId: carrierExpress.id, daysAgo: 50 },
    { customerIdx: 5, stateId: 1, paymentMethod: 'bank_transfer', items: [{ productIdx: 16, qty: 1 }], carrierId: carrierStd.id, daysAgo: 1 },
    { customerIdx: 6, stateId: 5, paymentMethod: 'paypal', items: [{ productIdx: 19, qty: 2 }, { productIdx: 17, qty: 1 }], carrierId: carrierStd.id, daysAgo: 28 },
    { customerIdx: 6, stateId: 4, paymentMethod: 'credit_card', items: [{ productIdx: 0, qty: 1 }], carrierId: carrierExpress.id, daysAgo: 5 },
    { customerIdx: 7, stateId: 5, paymentMethod: 'credit_card', items: [{ productIdx: 7, qty: 1 }, { productIdx: 10, qty: 1 }, { productIdx: 8, qty: 1 }], carrierId: carrierStd.id, daysAgo: 55 },
  ];

  const taxRate = 21; // IVA General

  for (const od of orderDefs) {
    const customer = customerUsers[od.customerIdx];
    const address = customerAddresses[od.customerIdx][0];
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - od.daysAgo);

    // Create cart
    const cart = await Cart.create({
      id_user: customer.id,
      id_currency: currEur.id,
      id_lang: langEs.id,
      id_address_delivery: address.id,
      id_address_invoice: address.id,
      id_carrier: od.carrierId,
    });

    // Cart items
    let totalProducts = 0;
    const orderItemsData: {
      id_product: number; product_name: string; product_reference: string | null;
      product_price: number; product_price_tax: number; quantity: number;
      tax_rate: number; total_price: number;
    }[] = [];

    for (const item of od.items) {
      const product = products[item.productIdx];
      const priceTax = parseFloat((Number(product.price) * (1 + taxRate / 100)).toFixed(6));
      const totalPrice = parseFloat((priceTax * item.qty).toFixed(6));
      totalProducts += parseFloat((Number(product.price) * item.qty).toFixed(6));

      await CartItem.create({
        id_cart: cart.id,
        id_product: product.id,
        id_combination: null,
        quantity: item.qty,
      });

      orderItemsData.push({
        id_product: product.id,
        product_name: productDefs[item.productIdx].es,
        product_reference: productDefs[item.productIdx].reference,
        product_price: Number(product.price),
        product_price_tax: priceTax,
        quantity: item.qty,
        tax_rate: taxRate,
        total_price: totalPrice,
      });
    }

    const totalProductsTax = parseFloat((totalProducts * (1 + taxRate / 100)).toFixed(6));
    const shippingCost = od.carrierId === carrierFree.id ? 0 : (od.carrierId === carrierExpress.id ? 9.99 : 4.99);
    const shippingCostTax = parseFloat((shippingCost * (1 + taxRate / 100)).toFixed(6));
    const totalPaid = parseFloat((totalProductsTax + shippingCostTax).toFixed(6));

    // Create order
    const order = await Order.create({
      reference: generateReference(),
      id_user: customer.id,
      id_cart: cart.id,
      id_currency: currEur.id,
      id_lang: langEs.id,
      id_address_delivery: address.id,
      id_address_invoice: address.id,
      id_carrier: od.carrierId,
      id_order_state: od.stateId,
      payment_method: od.paymentMethod,
      total_products: totalProducts,
      total_products_tax: totalProductsTax,
      total_shipping: shippingCost,
      total_shipping_tax: shippingCostTax,
      total_discounts: 0,
      total_discounts_tax: 0,
      total_paid: totalPaid,
      payment_surcharge: 0,
      conversion_rate: 1,
      note: null,
      created_at: createdAt,
    });

    // Order items
    for (const oi of orderItemsData) {
      await OrderItem.create({ id_order: order.id, id_combination: null, ...oi });
    }

    // Order history — simulate state progression
    const stateProgression: number[] = [];
    if (od.stateId >= 1) stateProgression.push(1);
    if (od.stateId >= 2 && od.stateId !== 6) stateProgression.push(2);
    if (od.stateId >= 3 && od.stateId !== 6) stateProgression.push(3);
    if (od.stateId >= 4 && od.stateId !== 6) stateProgression.push(4);
    if (od.stateId >= 5 && od.stateId !== 6) stateProgression.push(5);
    if (od.stateId === 6) stateProgression.push(6);

    for (let si = 0; si < stateProgression.length; si++) {
      const histDate = new Date(createdAt);
      histDate.setHours(histDate.getHours() + si * 24);
      await OrderHistory.create({
        id_order: order.id,
        id_order_state: stateProgression[si],
        id_user: null,
        comment: null,
        created_at: histDate,
      });
    }

    // Order payment (for paid states)
    if ([2, 3, 4, 5].includes(od.stateId)) {
      const payDate = new Date(createdAt);
      payDate.setHours(payDate.getHours() + 1);
      await OrderPayment.create({
        id_order: order.id,
        payment_method: od.paymentMethod,
        transaction_id: `TXN-${order.reference}-${Date.now().toString(36)}`,
        amount: totalPaid,
        id_currency: currEur.id,
        created_at: payDate,
      });
    }

    // Order carrier
    if (od.carrierId) {
      await OrderCarrier.create({
        id_order: order.id,
        id_carrier: od.carrierId,
        tracking_number: od.stateId >= 4 ? `DM${order.reference}ES` : null,
        weight: orderItemsData.reduce((sum, oi) => sum + oi.quantity * 0.5, 0),
        shipping_cost: shippingCost,
        shipping_cost_tax: shippingCostTax,
      });
    }

    // Stock movements for completed orders
    if ([2, 3, 4, 5].includes(od.stateId)) {
      for (const oi of orderItemsData) {
        const product = products.find((p) => p.id === oi.id_product)!;
        const stockBefore = Number(product.quantity);
        await StockMovement.create({
          id_product: oi.id_product,
          id_combination: null,
          movement_type: 'order_reserved',
          quantity: -oi.quantity,
          stock_before: stockBefore,
          stock_after: stockBefore - oi.quantity,
          id_order: order.id,
          reason: `Pedido ${order.reference}`,
        });
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 12. DUMMY DATA — Active Carts (abandoned)
  // ═══════════════════════════════════════════════════════════════════════

  console.log('🛒 Seeding abandoned carts...');

  // Cart for customer María with items but no order
  const abandonedCart1 = await Cart.create({
    id_user: customerUsers[0].id,
    id_currency: currEur.id,
    id_lang: langEs.id,
    id_address_delivery: customerAddresses[0][0].id,
    id_address_invoice: customerAddresses[0][0].id,
    id_carrier: null,
  });
  await CartItem.bulkCreate([
    { id_cart: abandonedCart1.id, id_product: products[3].id, id_combination: null, quantity: 1 },
    { id_cart: abandonedCart1.id, id_product: products[18].id, id_combination: null, quantity: 1 },
  ]);

  // Cart with coupon applied
  const abandonedCart2 = await Cart.create({
    id_user: customerUsers[2].id,
    id_currency: currEur.id,
    id_lang: langEs.id,
    id_address_delivery: customerAddresses[2][0].id,
    id_address_invoice: customerAddresses[2][0].id,
    id_carrier: carrierStd.id,
  });
  await CartItem.create({ id_cart: abandonedCart2.id, id_product: products[11].id, id_combination: null, quantity: 1 });
  await CartCartRule.create({ id_cart: abandonedCart2.id, id_cart_rule: cartRules[0].id });

  // ═══════════════════════════════════════════════════════════════════════
  // 13. DUMMY DATA — Wishlists
  // ═══════════════════════════════════════════════════════════════════════

  console.log('❤️  Seeding wishlists...');

  const wishlistDefs = [
    { userIdx: 0, name: 'Mi lista de deseos', productIdxs: [2, 3, 11, 16] },
    { userIdx: 1, name: 'Regalos Navidad', productIdxs: [4, 12, 19] },
    { userIdx: 2, name: 'Para casa', productIdxs: [12, 13, 14] },
    { userIdx: 4, name: 'Deporte', productIdxs: [8, 10, 15, 16] },
    { userIdx: 6, name: 'Gaming setup', productIdxs: [3, 17, 18, 19] },
  ];

  for (const wd of wishlistDefs) {
    const wishlist = await Wishlist.create({
      id_user: customerUsers[wd.userIdx].id,
      name: wd.name,
      token: `wl-${customerUsers[wd.userIdx].id}-${Date.now().toString(36)}`,
    });
    for (const pidx of wd.productIdxs) {
      await WishlistItem.create({
        id_wishlist: wishlist.id,
        id_product: products[pidx].id,
        id_combination: null,
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 14. DUMMY DATA — Product Reviews
  // ═══════════════════════════════════════════════════════════════════════

  console.log('⭐ Seeding product reviews...');

  const reviewDefs = [
    { productIdx: 0, userIdx: 0, rating: 5, title: 'Increíble smartphone', content: 'La cámara es espectacular y la batería dura todo el día. Muy contenta con la compra.', approved: true },
    { productIdx: 0, userIdx: 6, rating: 4, title: 'Muy bueno pero mejorable', content: 'Gran rendimiento y pantalla brutal. Le falta un poco de autonomía para sacarle 5 estrellas.', approved: true },
    { productIdx: 2, userIdx: 1, rating: 5, title: 'El mejor portátil que he tenido', content: 'Pantalla OLED increíble, ultraligero y rapidísimo. Perfecto para trabajo y uso personal.', approved: true },
    { productIdx: 3, userIdx: 3, rating: 5, title: 'Máquina de gaming', content: 'Mueve todo a máximos sin despeinarse. El teclado mecánico es un plus enorme.', approved: true },
    { productIdx: 4, userIdx: 0, rating: 4, title: 'Muy buenos auriculares', content: 'La cancelación de ruido funciona genial. El sonido es equilibrado y claro.', approved: true },
    { productIdx: 4, userIdx: 4, rating: 5, title: 'Impresionante calidad de sonido', content: 'Superan a marcas mucho más caras. La batería es una pasada: 40 horas reales.', approved: true },
    { productIdx: 7, userIdx: 7, rating: 5, title: 'Calidad excepcional', content: 'El algodón orgánico se nota muchísimo. Después de 20 lavados sigue como nueva.', approved: true },
    { productIdx: 7, userIdx: 0, rating: 4, title: 'Muy cómoda', content: 'Buen corte y material suave. Talla un poco grande, recomiendo pedir una menos.', approved: true },
    { productIdx: 10, userIdx: 2, rating: 5, title: 'Zapatillas perfectas para correr', content: 'La espuma reactiva se nota mucho en carrera larga. Muy ligeras y cómodas.', approved: true },
    { productIdx: 11, userIdx: 1, rating: 4, title: 'Buen reloj deportivo', content: 'GPS preciso y la pantalla se ve bien bajo el sol. La app podría mejorar.', approved: true },
    { productIdx: 14, userIdx: 4, rating: 5, title: 'Cuchillos de chef profesionales', content: 'Cortan como mantequilla. El bloque magnético queda precioso en la cocina.', approved: true },
    { productIdx: 17, userIdx: 3, rating: 4, title: 'Muy buen mando', content: 'La vibración háptica es genial y la batería dura bastante. Un poco pesado.', approved: true },
    { productIdx: 18, userIdx: 5, rating: 5, title: 'Teclado fantástico', content: 'Los switches hot-swap son un acierto. La construcción en aluminio es muy sólida.', approved: true },
    { productIdx: 19, userIdx: 6, rating: 4, title: 'Nostalgia pura', content: 'Genial para recordar juegos de la infancia. La calidad HDMI es buena y los mandos cumplen.', approved: true },
    // A couple of unapproved reviews
    { productIdx: 1, userIdx: 5, rating: 3, title: 'Correcto por el precio', content: 'Funciona bien para uso básico. La cámara no es su punto fuerte.', approved: false },
    { productIdx: 15, userIdx: 0, rating: 2, title: 'Demasiado pesadas', content: 'El ajuste de dial es cómodo pero pesan mucho para transportar.', approved: false },
  ];

  for (const rd of reviewDefs) {
    await ProductReview.create({
      id_product: products[rd.productIdx].id,
      id_user: customerUsers[rd.userIdx].id,
      rating: rd.rating,
      title: rd.title,
      content: rd.content,
      approved: rd.approved,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 15. DUMMY DATA — CMS Categories & Pages
  // ═══════════════════════════════════════════════════════════════════════

  console.log('📄 Seeding CMS content...');

  const cmsRootCat = await CmsCategory.create({ id_parent: null, position: 0, active: true });
  await CmsCategoryLang.bulkCreate([
    { id_cms_category: cmsRootCat.id, id_lang: langEs.id, name: 'Información', slug: 'informacion' },
    { id_cms_category: cmsRootCat.id, id_lang: langEn.id, name: 'Information', slug: 'information' },
  ]);

  const cmsPages = [
    {
      es: { title: 'Quiénes somos', slug: 'quienes-somos', content: '<h2>Sobre DMShop</h2><p>DMShop es una tienda online fundada con la misión de ofrecer productos de calidad a precios competitivos. Nuestro equipo trabaja cada día para brindarte la mejor experiencia de compra online.</p><p>Desde electrónica hasta moda, pasando por hogar y deportes, seleccionamos cuidadosamente cada producto de nuestro catálogo.</p>' },
      en: { title: 'About Us', slug: 'about-us', content: '<h2>About DMShop</h2><p>DMShop is an online store founded with the mission of offering quality products at competitive prices. Our team works every day to provide you with the best online shopping experience.</p><p>From electronics to fashion, home and sports, we carefully select every product in our catalog.</p>' },
    },
    {
      es: { title: 'Condiciones de uso', slug: 'condiciones-de-uso', content: '<h2>Condiciones Generales de Uso</h2><p>Las presentes condiciones regulan el uso del sitio web DMShop. Al acceder y utilizar este sitio web, usted acepta quedar vinculado por estas condiciones.</p><p>DMShop se reserva el derecho de modificar estas condiciones en cualquier momento.</p>' },
      en: { title: 'Terms of Use', slug: 'terms-of-use', content: '<h2>General Terms of Use</h2><p>These terms govern the use of the DMShop website. By accessing and using this website, you agree to be bound by these terms.</p><p>DMShop reserves the right to modify these terms at any time.</p>' },
    },
    {
      es: { title: 'Política de privacidad', slug: 'politica-de-privacidad', content: '<h2>Política de Privacidad</h2><p>En DMShop nos tomamos muy en serio la protección de sus datos personales. Esta política describe cómo recopilamos, utilizamos y protegemos su información.</p><p>Cumplimos con el Reglamento General de Protección de Datos (RGPD) de la Unión Europea.</p>' },
      en: { title: 'Privacy Policy', slug: 'privacy-policy', content: '<h2>Privacy Policy</h2><p>At DMShop we take the protection of your personal data very seriously. This policy describes how we collect, use and protect your information.</p><p>We comply with the European Union General Data Protection Regulation (GDPR).</p>' },
    },
    {
      es: { title: 'Envíos y devoluciones', slug: 'envios-y-devoluciones', content: '<h2>Política de Envíos y Devoluciones</h2><p>Realizamos envíos a toda España peninsular e islas. Los plazos de entrega varían según el método de envío seleccionado.</p><p>Dispone de 14 días naturales para realizar devoluciones sin necesidad de justificación.</p>' },
      en: { title: 'Shipping & Returns', slug: 'shipping-and-returns', content: '<h2>Shipping & Returns Policy</h2><p>We ship to all of mainland Spain and islands. Delivery times vary depending on the shipping method selected.</p><p>You have 14 calendar days to make returns without the need for justification.</p>' },
    },
  ];

  for (let i = 0; i < cmsPages.length; i++) {
    const page = await CmsPage.create({ id_cms_category: cmsRootCat.id, position: i, active: true });
    await CmsPageLang.bulkCreate([
      {
        id_cms_page: page.id, id_lang: langEs.id,
        title: cmsPages[i].es.title, content: cmsPages[i].es.content,
        slug: cmsPages[i].es.slug, meta_title: cmsPages[i].es.title, meta_description: null,
      },
      {
        id_cms_page: page.id, id_lang: langEn.id,
        title: cmsPages[i].en.title, content: cmsPages[i].en.content,
        slug: cmsPages[i].en.slug, meta_title: cmsPages[i].en.title, meta_description: null,
      },
    ]);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // DONE
  // ═══════════════════════════════════════════════════════════════════════

  console.log('');
  console.log('✅ Dummy seed completed successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   Languages:       2 (es, en)`);
  console.log(`   Currencies:      2 (EUR, USD)`);
  console.log(`   Zones:           2`);
  console.log(`   Countries:       7`);
  console.log(`   States:          ${statesData.length}`);
  console.log(`   Taxes:           3`);
  console.log(`   Tax Rules:       3`);
  console.log(`   Order States:    11`);
  console.log(`   Customer Groups: 3`);
  console.log(`   Carriers:        3`);
  console.log(`   Manufacturers:   ${manufacturers.length}`);
  console.log(`   Suppliers:       ${suppliers.length}`);
  console.log(`   Categories:      ${2 + Object.keys(catMap).length} (root + home + ${Object.keys(catMap).length} product categories)`);
  console.log(`   Attributes:      2 (Color, Size) with ${colorDefs.length + sizeDefs.length} values`);
  console.log(`   Features:        ${featureDefs.length} with ${featureDefs.reduce((s, f) => s + f.values.length, 0)} values`);
  console.log(`   Products:        ${products.length}`);
  console.log(`   Users:           ${1 + customerUsers.length} (1 admin + ${customerUsers.length} customers)`);
  console.log(`   Addresses:       ${customerAddresses.reduce((s, a) => s + a.length, 0)}`);
  console.log(`   Cart Rules:      ${cartRules.length}`);
  console.log(`   Specific Prices: 4`);
  console.log(`   Orders:          ${orderDefs.length}`);
  console.log(`   Abandoned Carts: 2`);
  console.log(`   Wishlists:       ${wishlistDefs.length}`);
  console.log(`   Reviews:         ${reviewDefs.length}`);
  console.log(`   CMS Pages:       ${cmsPages.length}`);
  console.log('');
  console.log('🔑 Credentials:');
  console.log('   Admin:    admin@dmshop.com / Admin123!');
  console.log('   Customer: maria.garcia@example.com / Customer123!');
  console.log('   (All customers use password: Customer123!)');

  await sequelize.close();
}

seedDummy().catch((error) => {
  console.error('❌ Dummy seed failed:', error);
  process.exit(1);
});
