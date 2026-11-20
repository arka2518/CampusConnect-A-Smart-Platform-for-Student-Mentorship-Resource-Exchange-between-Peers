import { Router } from 'express';
import { optionalAuth, requireAuth } from '../../middleware/auth.middleware';
import { uploadResourceImage } from '../../middleware/upload.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  handleCancelReservation,
  handleCreateResource,
  handleDeleteResource,
  handleEstimatePrice,
  handleGetResource,
  handleListMyResources,
  handleListResources,
  handleReserveResource,
  handleUpdateResource,
  handleVerifyOtp,
} from './resources.controller';
import {
  createResourceSchema,
  estimatePriceSchema,
  listResourcesQuerySchema,
  updateResourceSchema,
  verifyOtpSchema,
} from './resources.schema';

export const resourcesRouter = Router();
export const reservationsRouter = Router();

// Named routes MUST be defined BEFORE /:id so Express doesn't match them as UUIDs
resourcesRouter.post('/estimate-price', validate(estimatePriceSchema, 'body'), handleEstimatePrice);
resourcesRouter.get('/mine', requireAuth, handleListMyResources);

// Catalog Discovery & Detail
resourcesRouter.get('/', optionalAuth, validate(listResourcesQuerySchema, 'query'), handleListResources);
resourcesRouter.get('/:id', optionalAuth, handleGetResource);

// Listing Lifecycle (both Create and Edit support optional multipart image upload to Supabase Storage)
resourcesRouter.post(
  '/',
  requireAuth,
  uploadResourceImage.single('imageFile'),
  validate(createResourceSchema, 'body'),
  handleCreateResource
);
resourcesRouter.patch(
  '/:id',
  requireAuth,
  uploadResourceImage.single('imageFile'),
  validate(updateResourceSchema, 'body'),
  handleUpdateResource
);
resourcesRouter.delete('/:id', requireAuth, handleDeleteResource);

// Atomic Stock Lock & OTP Escrow Reservation
resourcesRouter.post('/:id/reserve', requireAuth, handleReserveResource);

// Reservation Escrow Transitions (shared polymorphic route prefix ready for future modules)
reservationsRouter.post('/:id/verify-otp', requireAuth, validate(verifyOtpSchema, 'body'), handleVerifyOtp);
reservationsRouter.post('/:id/cancel', requireAuth, handleCancelReservation);
