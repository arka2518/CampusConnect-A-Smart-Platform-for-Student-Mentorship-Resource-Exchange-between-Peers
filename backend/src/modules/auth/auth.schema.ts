import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Full name must be at least 2 characters').max(150),
  role: z.enum(['Incoming Junior', 'Graduating Senior']),
  department: z.string().trim().min(2, 'Department is required').max(100),
  year: z.string().trim().min(2, 'Academic year is required').max(50),
  phone: z
    .string()
    .trim()
    .min(7, 'Please enter a valid contact number')
    .max(30)
    .optional()
    .or(z.literal('')),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
