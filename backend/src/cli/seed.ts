import '../config/env.js';
import { sequelize } from '../config/database.js';
import { Lang } from '../models/lang.model.js';
import { Currency } from '../models/currency.model.js';
import { Configuration } from '../models/configuration.model.js';
import { Category } from '../models/category.model.js';
import { CategoryLang } from '../models/category-lang.model.js';
import { User } from '../models/user.model.js';
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
  await User.create({
    email: 'admin@dmshop.com',
    password: hashedPassword,
    first_name: 'Admin',
    last_name: 'DMShop',
    role: 'admin',
    active: true,
    newsletter: false,
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
