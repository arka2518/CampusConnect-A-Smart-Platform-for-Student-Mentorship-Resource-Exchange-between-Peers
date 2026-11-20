import { UserProfile } from '../types';

const API_BASE = '/api/v1';

let activeAccessToken: string | null = null;

export function setAuthAccessToken(token: string | null): void {
  activeAccessToken = token;
}

export function getAuthAccessToken(): string | null {
  return activeAccessToken;
}

/**
 * Builds auth headers for all backend API requests:
 * - When signed in via Supabase Auth (Google / Gmail / Email), sends a real JWT Bearer token.
 * - When using a 1-click Dev Demo account, sends demo identity headers (when ENABLE_DEMO_AUTH=true).
 */
export function buildAuthHeaders(user: UserProfile | null): Record<string, string> {
  if (activeAccessToken && (!user || !user.isDemoAccount)) {
    return {
      Authorization: `Bearer ${activeAccessToken}`,
    };
  }

  if (!user) return {};

  return {
    'x-user-email': user.email,
    'x-user-name': user.name,
    'x-user-role': user.role,
    'x-user-department': user.department,
    'x-user-year': user.year,
  };
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}

async function parseAuthResponse<T>(res: Response): Promise<T> {
  const payload = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!res.ok || !payload?.success) {
    const firstDetail = payload?.error?.details?.[0]?.message;
    const msg = firstDetail || payload?.error?.message || `Auth request failed (${res.status})`;
    throw new Error(msg);
  }
  return payload.data as T;
}

export async function fetchCurrentUserProfile(token?: string): Promise<UserProfile> {
  const bearer = token || activeAccessToken;
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: bearer ? { Authorization: `Bearer ${bearer}` } : {},
  });
  return parseAuthResponse<UserProfile>(res);
}

export interface UpdateProfilePayload {
  name: string;
  role: 'Incoming Junior' | 'Graduating Senior';
  department: string;
  year: string;
  phone?: string;
}

export async function updateUserProfile(
  payload: UpdateProfilePayload,
  user: UserProfile | null
): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/auth/profile`, {
    method: 'PATCH',
    headers: {
      ...buildAuthHeaders(user),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return parseAuthResponse<UserProfile>(res);
}
