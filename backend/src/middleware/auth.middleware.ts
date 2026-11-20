import { NextFunction, Request, Response } from 'express';
import { query } from '../config/db';
import { env } from '../config/env';
import { syncSupabaseUserToDb, verifySupabaseToken } from '../modules/auth/auth.service';
import { AppError } from './error.middleware';

export interface AuthenticatedUser {
  id: string;
  universityEmail: string;
  fullName: string;
  role: 'Incoming Junior' | 'Graduating Senior' | 'Admin';
  department: string;
  academicYear: string;
  phoneNumber: string | null;
  avatarUrl?: string;
  verifiedStudent: boolean;
  onboardingCompleted: boolean;
  isDemoAccount: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

interface UserRow {
  id: string;
  university_email: string;
  full_name: string;
  role: 'Incoming Junior' | 'Graduating Senior' | 'Admin';
  department: string;
  academic_year: string;
  phone_number: string | null;
  avatar_url: string | null;
  verified_student: boolean;
  onboarding_completed: boolean;
}

function mapDemoUserRow(row: UserRow): AuthenticatedUser {
  return {
    id: row.id,
    universityEmail: row.university_email,
    fullName: row.full_name,
    role: row.role,
    department: row.department,
    academicYear: row.academic_year,
    phoneNumber: row.phone_number,
    avatarUrl: row.avatar_url || undefined,
    verifiedStudent: row.verified_student,
    onboardingCompleted: row.onboarding_completed,
    isDemoAccount: true,
  };
}

async function lookupDemoHeaderUser(req: Request): Promise<AuthenticatedUser | undefined> {
  if (!env.enableDemoAuth) return undefined;

  const userIdHeader = req.header('x-user-id')?.trim();
  const userEmailHeader = req.header('x-user-email')?.trim().toLowerCase();

  if (userIdHeader) {
    const result = await query<UserRow>(
      `SELECT id, university_email, full_name, role, department, academic_year,
              phone_number, avatar_url, verified_student, onboarding_completed
       FROM users WHERE id = $1 LIMIT 1`,
      [userIdHeader]
    );
    if (result.rows[0]) return mapDemoUserRow(result.rows[0]);
  }

  if (userEmailHeader) {
    const existing = await query<UserRow>(
      `SELECT id, university_email, full_name, role, department, academic_year,
              phone_number, avatar_url, verified_student, onboarding_completed
       FROM users WHERE LOWER(university_email) = $1 LIMIT 1`,
      [userEmailHeader]
    );
    if (existing.rows[0]) return mapDemoUserRow(existing.rows[0]);

    const userNameHeader = req.header('x-user-name')?.trim();
    const userRoleHeader = req.header('x-user-role')?.trim();
    const userDeptHeader = req.header('x-user-department')?.trim();
    const userYearHeader = req.header('x-user-year')?.trim();

    if (userNameHeader) {
      const normalizedRole =
        userRoleHeader === 'Graduating Senior' ? 'Graduating Senior' : 'Incoming Junior';
      const created = await query<UserRow>(
        `INSERT INTO users (
           university_email, full_name, role, department, academic_year,
           phone_number, verified_student, onboarding_completed
         )
         VALUES ($1, $2, $3, $4, $5, $6, TRUE, TRUE)
         ON CONFLICT (university_email) DO UPDATE SET full_name = EXCLUDED.full_name
         RETURNING id, university_email, full_name, role, department, academic_year,
                   phone_number, avatar_url, verified_student, onboarding_completed`,
        [
          userEmailHeader,
          userNameHeader,
          normalizedRole,
          userDeptHeader || 'Computer Science',
          userYearHeader || (normalizedRole === 'Graduating Senior' ? 'Final Year Senior' : '1st Year (Junior)'),
          '+91 98000 11223',
        ]
      );
      if (created.rows[0]) return mapDemoUserRow(created.rows[0]);
    }
  }

  return undefined;
}

function extractBearerToken(req: Request): string | null {
  const authHeader = req.header('authorization');
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

/**
 * Resolves the authenticated student:
 * 1. Primary path: Verifies Supabase Auth Bearer JWT (Google / Gmail OAuth or Email Auth)
 *    and syncs the user into PostgreSQL `users`.
 * 2. Dev fallback (when ENABLE_DEMO_AUTH=true): Allows 1-click demo role switcher headers
 *    so two-sided Buyer <-> Seller OTP flows can be tested effortlessly.
 */
async function resolveAuthenticatedUser(
  req: Request,
  strictBearer: boolean
): Promise<AuthenticatedUser | undefined> {
  const bearerToken = extractBearerToken(req);

  if (bearerToken) {
    try {
      const supaUser = await verifySupabaseToken(bearerToken);
      return await syncSupabaseUserToDb(supaUser);
    } catch (err) {
      if (strictBearer) throw err;
      return undefined;
    }
  }

  return lookupDemoHeaderUser(req);
}

/**
 * Attaches req.user when valid credentials are present; never blocks public GET routes.
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    req.user = await resolveAuthenticatedUser(req, false);
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Requires a verified authenticated student (Google/Supabase JWT, or demo user in dev mode).
 */
export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await resolveAuthenticatedUser(req, true);
    if (!user) {
      throw new AppError(
        401,
        'UNAUTHORIZED',
        'Please sign in with Google or your student account to perform this action.'
      );
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
