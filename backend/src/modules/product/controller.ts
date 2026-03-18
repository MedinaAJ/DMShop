import { Request, Response } from 'express';
import { productService } from './service.js';
import { sendSuccess, sendPaginated, sendCreated, sendNoContent } from '../../utils/response.js';

export const productController = {
  async list(req: Request, res: Response) {
    const { data, meta } = await productService.list(req.query);
    sendPaginated(res, data, meta);
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
};
