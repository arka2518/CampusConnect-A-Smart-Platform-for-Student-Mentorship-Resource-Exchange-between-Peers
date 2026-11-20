import { z } from 'zod';

export const addToCartSchema = z.object({
  resource_id: z.string().uuid('Invalid resource ID format'),
});

export const checkoutSchema = z.object({
  payment_method: z
    .enum(['Pay at Campus Meetup (UPI / Cash)'])
    .default('Pay at Campus Meetup (UPI / Cash)'),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
