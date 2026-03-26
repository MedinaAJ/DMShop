import { Request, Response } from 'express';
import { productService } from './service.js';
import { Product } from '../../models/product.model.js';
import { ProductLang } from '../../models/product-lang.model.js';
import { Category } from '../../models/category.model.js';
import { CategoryLang } from '../../models/category-lang.model.js';
import { sendSuccess, sendPaginated, sendCreated, sendNoContent } from '../../utils/response.js';

export const productController = {
  async list(req: Request, res: Response) {
    const { data, meta } = await productService.list(req.query);
    sendPaginated(res, data, meta);
  },

  async compare(req: Request, res: Response) {
    const idsParam = req.query.ids as string;
    if (!idsParam) {
      res.status(400).json({ success: false, message: 'ids parameter required' });
      return;
    }
    const ids = idsParam.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n) && n > 0);
    const idLang = Number(req.query.idLang) || 1;
    const result = await productService.compareProducts(ids, idLang);
    sendSuccess(res, result);
  },

  async getById(req: Request, res: Response) {
    const product = await productService.getById(Number(req.params.id), req.query.lang as string);
    sendSuccess(res, product);
  },

  async create(req: Request, res: Response) {
    const product = await productService.create(req.body);
    sendCreated(res, product);
  },

  async update(req: Request, res: Response) {
    const product = await productService.update(Number(req.params.id), req.body);
    sendSuccess(res, product);
  },

  async remove(req: Request, res: Response) {
    await productService.remove(Number(req.params.id));
    sendNoContent(res);
  },

  // Combinations
  async listCombinations(req: Request, res: Response) {
    const combinations = await productService.listCombinations(Number(req.params.id));
    sendSuccess(res, combinations);
  },

  async createCombination(req: Request, res: Response) {
    const combinations = await productService.createCombination(Number(req.params.id), req.body);
    sendCreated(res, combinations);
  },

  async updateCombination(req: Request, res: Response) {
    const combinations = await productService.updateCombination(
      Number(req.params.id),
      Number(req.params.combinationId),
      req.body,
    );
    sendSuccess(res, combinations);
  },

  async removeCombination(req: Request, res: Response) {
    await productService.removeCombination(Number(req.params.id), Number(req.params.combinationId));
    sendNoContent(res);
  },

  // Features
  async listFeatures(req: Request, res: Response) {
    const features = await productService.listProductFeatures(Number(req.params.id));
    sendSuccess(res, features);
  },

  async setFeature(req: Request, res: Response) {
    const features = await productService.setProductFeature(Number(req.params.id), req.body);
    sendSuccess(res, features);
  },

  async removeFeature(req: Request, res: Response) {
    await productService.removeProductFeature(Number(req.params.id), Number(req.params.featureId));
    sendNoContent(res);
  },

  // Images
  async listImages(req: Request, res: Response) {
    const images = await productService.listImages(Number(req.params.id));
    sendSuccess(res, images);
  },

  async uploadImage(req: Request, res: Response) {
    const file = req.file;
    if (!file) {
      sendSuccess(res, null, 400);
      return;
    }
    const image = await productService.addImage(
      Number(req.params.id),
      `/uploads/products/${req.params.id}/${file.filename}`,
      req.body.cover === 'true',
    );
    sendCreated(res, image);
  },

  async updateImage(req: Request, res: Response) {
    const image = await productService.updateImage(
      Number(req.params.id),
      Number(req.params.imageId),
      req.body,
    );
    sendSuccess(res, image);
  },

  async setCoverImage(req: Request, res: Response) {
    const image = await productService.setCoverImage(
      Number(req.params.id),
      Number(req.params.imageId),
    );
    sendSuccess(res, image);
  },

  async reorderImages(req: Request, res: Response) {
    const images = await productService.reorderImages(
      Number(req.params.id),
      req.body,
    );
    sendSuccess(res, images);
  },

  async removeImage(req: Request, res: Response) {
    await productService.removeImage(Number(req.params.id), Number(req.params.imageId));
    sendNoContent(res);
  },

  // Categories
  async setCategories(req: Request, res: Response) {
    const result = await productService.setCategories(Number(req.params.id), req.body.categoryIds);
    sendSuccess(res, result);
  },

  /** GET /admin/products/export — export all products as CSV */
  async exportCsv(req: Request, res: Response) {
    const idLang = Number(req.query.idLang) || 1;

    const products = await Product.findAll({
      include: [
        { model: ProductLang, as: 'translations', where: { id_lang: idLang }, required: false },
        { model: Category, as: 'defaultCategory', include: [{ model: CategoryLang, as: 'translations', where: { id_lang: idLang }, required: false }] },
      ],
      order: [['id', 'ASC']],
    });

    const rows = products.map((p: any) => {
      const trans = p.translations?.[0];
      const catName = p.defaultCategory?.translations?.[0]?.name ?? '';
      return [
        p.id,
        escapeCSV(trans?.name ?? ''),
        escapeCSV(p.reference ?? ''),
        Number(p.price).toFixed(2),
        p.quantity ?? 0,
        catName ? escapeCSV(catName) : '',
        p.active ? '1' : '0',
        escapeCSV(trans?.description_short ?? ''),
      ].join(',');
    });

    const header = 'id,nombre,referencia,precio,stock,categoria,activo,descripcion_corta';
    const csv = [header, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="productos.csv"');
    res.send('\uFEFF' + csv); // BOM for Excel UTF-8
  },

  /** POST /admin/products/import — import products from CSV (multipart) */
  async importCsv(req: Request, res: Response) {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, message: 'Fichero CSV requerido' });
      return;
    }

    const content = file.buffer.toString('utf-8').replace(/^\uFEFF/, ''); // strip BOM
    const lines = content.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) {
      res.status(400).json({ success: false, message: 'El fichero CSV está vacío' });
      return;
    }

    const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const nameIdx = header.indexOf('nombre');
    const refIdx = header.indexOf('referencia');
    const priceIdx = header.indexOf('precio');
    const stockIdx = header.indexOf('stock');
    const activeIdx = header.indexOf('activo');
    const idIdx = header.indexOf('id');

    let created = 0, updated = 0;
    const errors: { row: number; error: string }[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      try {
        const name = cols[nameIdx]?.trim();
        const reference = cols[refIdx]?.trim() || null;
        const price = priceIdx >= 0 ? parseFloat(cols[priceIdx]) : 0;
        const quantity = stockIdx >= 0 ? parseInt(cols[stockIdx], 10) : 0;
        const active = activeIdx >= 0 ? cols[activeIdx].trim() !== '0' : true;
        const id = idIdx >= 0 ? parseInt(cols[idIdx], 10) : NaN;

        if (!name) {
          errors.push({ row: i + 1, error: 'Nombre vacío' });
          continue;
        }

        if (!isNaN(id) && id > 0) {
          const existing = await Product.findByPk(id);
          if (existing) {
            await existing.update({ reference, price: isNaN(price) ? existing.price : price, quantity: isNaN(quantity) ? existing.quantity : quantity, active });
            await ProductLang.upsert({ id_product: id, id_lang: 1, name, description_short: '', description: '', link_rewrite: slugify(name), meta_title: '', meta_description: '', meta_keywords: '' });
            updated++;
            continue;
          }
        }

        const product = await Product.create({ reference, price: isNaN(price) ? 0 : price, quantity: isNaN(quantity) ? 0 : quantity, active, id_category_default: 1, id_tax_rules_group: 1, on_sale: false });
        await ProductLang.create({ id_product: product.id, id_lang: 1, name, description_short: '', description: '', link_rewrite: slugify(name), meta_title: '', meta_description: '', meta_keywords: '' });
        created++;
      } catch (err: any) {
        errors.push({ row: i + 1, error: err?.message ?? 'Error desconocido' });
      }
    }

    sendSuccess(res, { created, updated, errors, total: lines.length - 1 });
  },
};

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
