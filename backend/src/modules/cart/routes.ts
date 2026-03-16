import { Router } from 'express';
import { cartController } from './controller.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { optionalAuth } from '../../middleware/authenticate.js';

export const cartRouter = Router();

cartRouter.get('/', optionalAuth, asyncHandler(cartController.get));
cartRouter.post('/items', optionalAuth, asyncHandler(cartController.addItem));
cartRouter.put('/items/:id', optionalAuth, asyncHandler(cartController.updateItem));
cartRouter.delete('/items/:id', optionalAuth, asyncHandler(cartController.removeItem));
