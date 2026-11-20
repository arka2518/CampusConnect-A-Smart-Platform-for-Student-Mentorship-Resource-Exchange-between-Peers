import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  handleAddToCart,
  handleCheckout,
  handleClearCart,
  handleGetCart,
  handleGetMyOrders,
  handleRemoveFromCart,
} from './orders.controller';
import { addToCartSchema, checkoutSchema } from './orders.schema';

export const cartRouter = Router();
export const ordersRouter = Router();

// Persistent Shopping Cart (authenticated student only)
cartRouter.get('/', requireAuth, handleGetCart);
cartRouter.post('/items', requireAuth, validate(addToCartSchema, 'body'), handleAddToCart);
cartRouter.delete('/items/:resourceId', requireAuth, handleRemoveFromCart);
cartRouter.delete('/', requireAuth, handleClearCart);

// Atomic Multi-Item Checkout & Buyer Order History
ordersRouter.post('/checkout', requireAuth, validate(checkoutSchema, 'body'), handleCheckout);
ordersRouter.get('/mine', requireAuth, handleGetMyOrders);
