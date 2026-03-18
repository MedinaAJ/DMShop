import { Router } from 'express';
import { wishlistController } from './controller.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate } from '../../middleware/authenticate.js';

export const wishlistRouter = Router();

// All routes require auth
wishlistRouter.get('/', authenticate, asyncHandler(wishlistController.getWishlist));
wishlistRouter.post('/items', authenticate, asyncHandler(wishlistController.addItem));
wishlistRouter.delete('/items/:id_product', authenticate, asyncHandler(wishlistController.removeItem));
wishlistRouter.get('/check/:id_product', authenticate, asyncHandler(wishlistController.checkItem));
