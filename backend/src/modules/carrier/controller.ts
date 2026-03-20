import { Request, Response } from 'express';
import { carrierService } from './service.js';
import { sendSuccess, sendPaginated, sendCreated, sendNoContent } from '../../utils/response.js';

export const carrierController = {
  async list(req: Request, res: Response) {
    const { data, meta } = await carrierService.list(req.query);
    sendPaginated(res, data, meta);
  },

  async getById(req: Request, res: Response) {
    const carrier = await carrierService.getById(Number(req.params.id));
    sendSuccess(res, carrier);
  },

  async create(req: Request, res: Response) {
    const carrier = await carrierService.create(req.body);
    sendCreated(res, carrier);
  },

  async update(req: Request, res: Response) {
    const carrier = await carrierService.update(Number(req.params.id), req.body);
    sendSuccess(res, carrier);
  },

  async remove(req: Request, res: Response) {
    await carrierService.remove(Number(req.params.id));
    sendNoContent(res);
  },

  async getAvailable(req: Request, res: Response) {
    const idZone = Number(req.query.idZone) || undefined;
    const carriers = await carrierService.getAvailable(idZone);
    sendSuccess(res, carriers);
  },

  async upsertTranslation(req: Request, res: Response) {
    const idCarrier = Number(req.params.id);
    const idLang = Number(req.params.idLang);
    const { name, delay } = req.body;
    const record = await carrierService.upsertTranslation(idCarrier, idLang, name, delay);
    sendSuccess(res, record);
  },
};
