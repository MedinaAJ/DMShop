import { Router } from 'express';
import { authRouter } from '../modules/auth/routes.js';
import { productRouter } from '../modules/product/routes.js';
import { categoryRouter } from '../modules/category/routes.js';
import { cartRouter } from '../modules/cart/routes.js';
import { userRouter } from '../modules/user/routes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/products', productRouter);
apiRouter.use('/categories', categoryRouter);
apiRouter.use('/cart', cartRouter);
apiRouter.use('/users', userRouter);
