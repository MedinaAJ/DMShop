import { Request, Response } from 'express';
import { geoService } from './service.js';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/response.js';

export const geoController = {
  // Zones
  async listZones(_req: Request, res: Response) {
    const zones = await geoService.listZones();
    sendSuccess(res, zones);
  },

  async createZone(req: Request, res: Response) {
    const zone = await geoService.createZone(req.body);
    sendCreated(res, zone);
  },

  async updateZone(req: Request, res: Response) {
    const zone = await geoService.updateZone(Number(req.params.id), req.body);
    sendSuccess(res, zone);
  },

  async removeZone(req: Request, res: Response) {
    await geoService.removeZone(Number(req.params.id));
    sendNoContent(res);
  },

  // Countries
  async listCountries(req: Request, res: Response) {
    const countries = await geoService.listCountries(req.query);
    sendSuccess(res, countries);
  },

  async getCountryById(req: Request, res: Response) {
    const country = await geoService.getCountryById(Number(req.params.id));
    sendSuccess(res, country);
  },

  async createCountry(req: Request, res: Response) {
    const country = await geoService.createCountry(req.body);
    sendCreated(res, country);
  },

  async updateCountry(req: Request, res: Response) {
    const country = await geoService.updateCountry(Number(req.params.id), req.body);
    sendSuccess(res, country);
  },

  async removeCountry(req: Request, res: Response) {
    await geoService.removeCountry(Number(req.params.id));
    sendNoContent(res);
  },

  // States
  async listStates(req: Request, res: Response) {
    const states = await geoService.listStates(req.query);
    sendSuccess(res, states);
  },

  async createState(req: Request, res: Response) {
    const state = await geoService.createState(req.body);
    sendCreated(res, state);
  },

  async updateState(req: Request, res: Response) {
    const state = await geoService.updateState(Number(req.params.id), req.body);
    sendSuccess(res, state);
  },

  async removeState(req: Request, res: Response) {
    await geoService.removeState(Number(req.params.id));
    sendNoContent(res);
  },
};
