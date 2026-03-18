import { Configuration } from '../../models/configuration.model.js';
import { Category } from '../../models/category.model.js';
import { CategoryLang } from '../../models/category-lang.model.js';
import { Product } from '../../models/product.model.js';
import { ProductLang } from '../../models/product-lang.model.js';
import { Lang } from '../../models/lang.model.js';

async function getShopUrl(): Promise<string> {
  const config = await Configuration.findOne({ where: { key: 'SHOP_URL' } });
  if (config?.value) return config.value.replace(/\/$/, '');
  return process.env['SHOP_URL'] ?? 'https://localhost:4200';
}

async function getDefaultLangId(): Promise<number> {
  const lang = await Lang.findOne({ where: { is_default: true } });
  return lang?.id ?? 1;
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]!;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const seoService = {
  async generateSitemap(): Promise<string> {
    const [baseUrl, defaultLangId] = await Promise.all([getShopUrl(), getDefaultLangId()]);
    const today = formatDate(new Date());

    const urls: Array<{
      loc: string;
      changefreq: string;
      priority: string;
      lastmod: string;
    }> = [];

    // Home
    urls.push({ loc: `${baseUrl}/`, changefreq: 'daily', priority: '1.0', lastmod: today });

    // Active categories
    const categories = await Category.findAll({
      where: { active: true },
      include: [
        {
          model: CategoryLang,
          as: 'translations',
          where: { id_lang: defaultLangId },
          required: false,
        },
      ],
    });

    for (const cat of categories) {
      const translation = cat.translations?.[0];
      if (translation?.slug) {
        urls.push({
          loc: `${baseUrl}/categoria/${escapeXml(translation.slug)}`,
          changefreq: 'weekly',
          priority: '0.8',
          lastmod: formatDate(cat.updated_at ?? new Date()),
        });
      }
    }

    // Active products
    const products = await Product.findAll({
      where: { active: true },
      include: [
        {
          model: ProductLang,
          as: 'translations',
          where: { id_lang: defaultLangId },
          required: false,
        },
      ],
    });

    for (const product of products) {
      const translation = product.translations?.[0];
      if (translation?.slug) {
        urls.push({
          loc: `${baseUrl}/producto/${escapeXml(translation.slug)}`,
          changefreq: 'weekly',
          priority: '0.7',
          lastmod: formatDate(product.updated_at ?? new Date()),
        });
      }
    }

    const urlElements = urls
      .map(
        (u) => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
    <lastmod>${u.lastmod}</lastmod>
  </url>`,
      )
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;
  },

  async generateRobotsTxt(): Promise<string> {
    const baseUrl = await getShopUrl();
    return `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Sitemap: ${baseUrl}/sitemap.xml
`;
  },
};
