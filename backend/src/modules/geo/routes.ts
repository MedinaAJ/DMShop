import { Router } from 'express';
import { geoController } from './controller.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import {
  createZoneSchema,
  updateZoneSchema,
  createCountrySchema,
  updateCountrySchema,
  createStateSchema,
  updateStateSchema,
} from '@dmshop/shared';

export const geoRouter = Router();

const adminOnly = [authenticate, authorize('admin', 'employee')];

// Zones
geoRouter.get('/zones', asyncHandler(geoController.listZones));
geoRouter.post(
  '/zones',
  ...adminOnly,
  validate(createZoneSchema),
  asyncHandler(geoController.createZone),
);
geoRouter.put(
  '/zones/:id',
  ...adminOnly,
  validate(updateZoneSchema),
  asyncHandler(geoController.updateZone),
);
geoRouter.delete(
  '/zones/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(geoController.removeZone),
);

// Countries
geoRouter.get('/countries', asyncHandler(geoController.listCountries));
geoRouter.get('/countries/:id', asyncHandler(geoController.getCountryById));
geoRouter.post(
  '/countries',
  ...adminOnly,
  validate(createCountrySchema),
  asyncHandler(geoController.createCountry),
);
geoRouter.put(
  '/countries/:id',
  ...adminOnly,
  validate(updateCountrySchema),
  asyncHandler(geoController.updateCountry),
);
geoRouter.delete(
  '/countries/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(geoController.removeCountry),
);

// States
geoRouter.get('/states', asyncHandler(geoController.listStates));
geoRouter.post(
  '/states',
  ...adminOnly,
  validate(createStateSchema),
  asyncHandler(geoController.createState),
);
geoRouter.put(
  '/states/:id',
  ...adminOnly,
  validate(updateStateSchema),
  asyncHandler(geoController.updateState),
);
geoRouter.delete(
  '/states/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(geoController.removeState),
);
