import crypto from 'crypto';
import { query } from '../../config/db';
import { env, isSupabaseAuthConfigured } from '../../config/env';
import { AppError } from '../../middleware/error.middleware';
import { AuthenticatedUser } from '../../middleware/auth.middleware';
import { UpdateProfileInput } from './auth.schema';

interface SupabaseAuthUserResponse {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
    picture?: string;
  };
}

interface UserDbRow {
  id: string;
  auth_user_id: string | null;
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

export interface UserProfileDTO {
  id: string;
  name: string;
  email: string;
  role: 'Incoming Junior' | 'Graduating Senior' | 'Admin';
  department: string;
  year: string;
  phone: string | null;
  avatar?: string;
  verifiedStudent: boolean;
  onboardingCompleted: boolean;
  isDemoAccount: boolean;
}

// Lightweight 60-second TTL cache for verified Supabase access tokens
const tokenCache = new Map<string, { user: SupabaseAuthUserResponse; expiresAt: number }>();
const TOKEN_CACHE_TTL_MS = 60_000;

export function assertAllowedEmailDomain(email: string): void {
  if (env.allowedEmailDomains.includes('*')) return;

  const domain = email.split('@')[1]?.toLowerCase() || '';
  const allowed = env.allowedEmailDomains.some(
    (allowedDomain) => domain === allowedDomain || domain.endsWith(`.${allowedDomain}`)
  );

  if (!allowed) {
    throw new AppError(
      403,
      'EMAIL_DOMAIN_NOT_ALLOWED',
      `Access is restricted to approved email domains (${env.allowedEmailDomains.join(', ')}). Please sign in with an eligible account.`
    );
  }
}

/**
 * Verifies a Supabase Auth access token directly via Supabase GoTrue (`/auth/v1/user`).
 * Supports both legacy HS256 and modern asymmetric ES256/RS256 Supabase JWT keys seamlessly.
 */
export async function verifySupabaseToken(accessToken: string): Promise<SupabaseAuthUserResponse> {
  if (!isSupabaseAuthConfigured()) {
    throw new AppError(
      500,
      'SUPABASE_AUTH_NOT_CONFIGURED',
      'SUPABASE_URL and SUPABASE_ANON_KEY must be set in backend/.env to verify Google/Supabase tokens.'
    );
  }

  const tokenHash = crypto.createHash('sha256').update(accessToken).digest('hex');
  const cached = tokenCache.get(tokenHash);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.user;
  }

  const res = await fetch(`${env.supabaseUrl}/auth/v1/user`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: env.supabaseAnonKey,
    },
  });

  if (!res.ok) {
    tokenCache.delete(tokenHash);
    throw new AppError(401, 'INVALID_AUTH_TOKEN', 'Your session has expired or is invalid. Please sign in again.');
  }

  const supaUser = (await res.json()) as SupabaseAuthUserResponse;
  if (!supaUser?.id || !supaUser?.email) {
    throw new AppError(401, 'INVALID_AUTH_USER', 'Authenticated Google account does not include an email address.');
  }

  assertAllowedEmailDomain(supaUser.email);

  tokenCache.set(tokenHash, {
    user: supaUser,
    expiresAt: Date.now() + TOKEN_CACHE_TTL_MS,
  });

  // Prevent unbounded growth on long-running processes
  if (tokenCache.size > 500) {
    const now = Date.now();
    for (const [k, v] of tokenCache.entries()) {
      if (v.expiresAt <= now) tokenCache.delete(k);
    }
  }

  return supaUser;
}

function mapDbRowToAuthUser(row: UserDbRow, isDemoAccount: boolean): AuthenticatedUser {
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
    isDemoAccount,
  };
}

export function formatUserProfile(user: AuthenticatedUser): UserProfileDTO {
  return {
    id: user.id,
    name: user.fullName,
    email: user.universityEmail,
    role: user.role,
    department: user.department,
    year: user.academicYear,
    phone: user.phoneNumber,
    avatar: user.avatarUrl,
    verifiedStudent: user.verifiedStudent,
    onboardingCompleted: user.onboardingCompleted,
    isDemoAccount: user.isDemoAccount,
  };
}

/**
 * Syncs a verified Supabase Auth (Google / Email) user with our PostgreSQL `users` table.
 * Matches by `auth_user_id` first, then by `university_email`, or inserts a new student record.
 */
export async function syncSupabaseUserToDb(
  supaUser: SupabaseAuthUserResponse
): Promise<AuthenticatedUser> {
  const email = supaUser.email!.toLowerCase();
  const displayName =
    supaUser.user_metadata?.full_name ||
    supaUser.user_metadata?.name ||
    email.split('@')[0];
  const avatarUrl =
    supaUser.user_metadata?.avatar_url ||
    supaUser.user_metadata?.picture ||
    null;

  // 1. Lookup by Supabase auth_user_id
  const byAuthId = await query<UserDbRow>(
    `SELECT id, auth_user_id, university_email, full_name, role, department, academic_year,
            phone_number, avatar_url, verified_student, onboarding_completed
     FROM users WHERE auth_user_id = $1 LIMIT 1`,
    [supaUser.id]
  );
  if (byAuthId.rows[0]) {
    return mapDbRowToAuthUser(byAuthId.rows[0], false);
  }

  // 2. Lookup by email (links seamlessly if email was pre-seeded)
  const byEmail = await query<UserDbRow>(
    `SELECT id, auth_user_id, university_email, full_name, role, department, academic_year,
            phone_number, avatar_url, verified_student, onboarding_completed
     FROM users WHERE LOWER(university_email) = $1 LIMIT 1`,
    [email]
  );
  if (byEmail.rows[0]) {
    const linked = await query<UserDbRow>(
      `UPDATE users
       SET auth_user_id = $1,
           avatar_url = COALESCE(avatar_url, $2)
       WHERE id = $3
       RETURNING id, auth_user_id, university_email, full_name, role, department, academic_year,
                 phone_number, avatar_url, verified_student, onboarding_completed`,
      [supaUser.id, avatarUrl, byEmail.rows[0].id]
    );
    return mapDbRowToAuthUser(linked.rows[0], false);
  }

  // 3. First-time Google/Email student login — insert with onboarding_completed = FALSE
  const created = await query<UserDbRow>(
    `INSERT INTO users (
       auth_user_id, university_email, full_name, role, department,
       academic_year, avatar_url, verified_student, onboarding_completed
     )
     VALUES ($1, $2, $3, 'Incoming Junior', 'Computer Science', '1st Year (Junior)', $4, TRUE, FALSE)
     ON CONFLICT (university_email) DO UPDATE SET auth_user_id = EXCLUDED.auth_user_id
     RETURNING id, auth_user_id, university_email, full_name, role, department, academic_year,
               phone_number, avatar_url, verified_student, onboarding_completed`,
    [supaUser.id, email, displayName, avatarUrl]
  );

  return mapDbRowToAuthUser(created.rows[0], false);
}

export async function updateStudentProfile(
  userId: string,
  input: UpdateProfileInput,
  isDemoAccount: boolean
): Promise<UserProfileDTO> {
  const result = await query<UserDbRow>(
    `UPDATE users
     SET full_name = $1,
         role = $2,
         department = $3,
         academic_year = $4,
         phone_number = COALESCE(NULLIF($5, ''), phone_number),
         onboarding_completed = TRUE
     WHERE id = $6
     RETURNING id, auth_user_id, university_email, full_name, role, department, academic_year,
               phone_number, avatar_url, verified_student, onboarding_completed`,
    [input.name, input.role, input.department, input.year, input.phone || '', userId]
  );

  if (!result.rows[0]) {
    throw new AppError(404, 'USER_NOT_FOUND', 'Student profile not found.');
  }

  return formatUserProfile(mapDbRowToAuthUser(result.rows[0], isDemoAccount));
}
