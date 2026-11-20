import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { handleGetMe, handleUpdateProfile } from './auth.controller';
import { updateProfileSchema } from './auth.schema';

export const authRouter = Router();

// Returns the signed-in student's synced PostgreSQL profile (auto-creates on first Google login)
authRouter.get('/me', requireAuth, handleGetMe);

// Completes first-time onboarding or updates Role / Department / Year / Phone
authRouter.patch('/profile', requireAuth, validate(updateProfileSchema, 'body'), handleUpdateProfile);
