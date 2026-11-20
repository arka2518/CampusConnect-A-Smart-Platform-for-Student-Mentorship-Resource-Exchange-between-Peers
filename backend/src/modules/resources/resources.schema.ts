import { z } from 'zod';

export const RESOURCE_CATEGORIES = [
  'Textbook',
  'Lab Equipment',
  'Electronics',
  'Study Notes',
  'Hostel Essentials',
] as const;

export const RESOURCE_CONDITIONS = [
  'Like New',
  'Gently Used',
  'Annotated with Exam Notes',
] as const;

export const RESOURCE_STATUSES = ['Available', 'Reserved', 'Handed Over'] as const;

const booleanFromString = z
  .union([z.boolean(), z.string()])
  .transform((val) => {
    if (typeof val === 'boolean') return val;
    return val.toLowerCase() === 'true' || val === '1';
  });

export const listResourcesQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  category: z.enum(RESOURCE_CATEGORIES).optional(),
  course_code: z.string().trim().max(50).optional(),
  condition: z.enum(RESOURCE_CONDITIONS).optional(),
  notes_included: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  max_price: z.coerce.number().int().min(0).optional(),
  status: z.enum(RESOURCE_STATUSES).optional(),
});

export const createResourceSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(255),
  category: z.enum(RESOURCE_CATEGORIES).default('Textbook'),
  price: z.coerce.number().int().min(0, 'Price cannot be negative').max(100000),
  originalPrice: z.coerce.number().int().min(1).max(500000).optional(),
  condition: z.enum(RESOURCE_CONDITIONS).default('Gently Used'),
  courseCode: z.string().trim().min(2).max(50).default('GENERAL'),
  courseName: z.string().trim().min(2).max(150).default('General Academic Material'),
  department: z.string().trim().min(2).max(100).default('All Engineering Disciplines'),
  edition: z.string().trim().min(2).max(200).default('Standard Campus Edition'),
  pickupLocation: z.string().trim().min(3).max(255).default('Central Library Steps'),
  description: z.string().trim().min(10, 'Please add a brief description (10+ characters)').max(2000),
  handwrittenNotesIncluded: booleanFromString.default(false),
  availableUntil: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'availableUntil must be a valid YYYY-MM-DD date'),
  image: z.string().trim().max(500).optional(),
});

export const updateResourceSchema = z.object({
  title: z.string().trim().min(3).max(255).optional(),
  category: z.enum(RESOURCE_CATEGORIES).optional(),
  price: z.coerce.number().int().min(0).max(100000).optional(),
  originalPrice: z.coerce.number().int().min(1).max(500000).optional(),
  condition: z.enum(RESOURCE_CONDITIONS).optional(),
  courseCode: z.string().trim().min(2).max(50).optional(),
  courseName: z.string().trim().min(2).max(150).optional(),
  department: z.string().trim().min(2).max(100).optional(),
  edition: z.string().trim().min(2).max(200).optional(),
  pickupLocation: z.string().trim().min(3).max(255).optional(),
  description: z.string().trim().min(10).max(2000).optional(),
  handwrittenNotesIncluded: booleanFromString.optional(),
  availableUntil: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'availableUntil must be a valid YYYY-MM-DD date')
    .optional(),
});

export const estimatePriceSchema = z.object({
  category: z.enum(RESOURCE_CATEGORIES).default('Textbook'),
  course_code: z.string().trim().max(50).default('GENERAL'),
  original_price: z.coerce.number().int().min(10).max(500000).optional(),
  condition: z.enum(RESOURCE_CONDITIONS),
  notes_included: z.boolean().default(false),
});

export const verifyOtpSchema = z.object({
  otp_code: z
    .string()
    .trim()
    .regex(/^\d{4,6}$/, 'OTP must be a 4 to 6 digit numeric code'),
});

export type ListResourcesQuery = z.infer<typeof listResourcesQuerySchema>;
export type CreateResourceInput = z.infer<typeof createResourceSchema>;
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;
export type EstimatePriceInput = z.infer<typeof estimatePriceSchema>;
