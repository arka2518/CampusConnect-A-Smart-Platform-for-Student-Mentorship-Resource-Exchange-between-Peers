import { NextFunction, Request, Response } from 'express';
import { AddToCartInput, CheckoutInput } from './orders.schema';
import {
  addToCart,
  checkoutCart,
  clearCart,
  getCart,
  getMyOrders,
  removeFromCart,
} from './orders.service';

function getResourceIdParam(req: Request): string {
  return Array.isArray(req.params.resourceId)
    ? req.params.resourceId[0]
    : String(req.params.resourceId);
}

export async function handleGetCart(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const cart = await getCart(req.user!.id);
    res.json({ success: true, data: cart });
  } catch (err) {
    next(err);
  }
}

export async function handleAddToCart(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { resource_id } = req.body as AddToCartInput;
    const cart = await addToCart(req.user!, resource_id);
    res.status(201).json({ success: true, data: cart });
  } catch (err) {
    next(err);
  }
}

export async function handleRemoveFromCart(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const cart = await removeFromCart(req.user!.id, getResourceIdParam(req));
    res.json({ success: true, data: cart });
  } catch (err) {
    next(err);
  }
}

export async function handleClearCart(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const cart = await clearCart(req.user!.id);
    res.json({ success: true, data: cart });
  } catch (err) {
    next(err);
  }
}

export async function handleCheckout(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = (req.body || {}) as Partial<CheckoutInput>;
    const order = await checkoutCart(
      req.user!,
      body.payment_method || 'Pay at Campus Meetup (UPI / Cash)'
    );
    res.status(201).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

export async function handleGetMyOrders(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await getMyOrders(req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
