import {
  FairPriceEstimate,
  MyListingsResponse,
  Resource,
  ResourceCategory,
  UserProfile,
} from '../types';
import { buildAuthHeaders } from './authApi';

const API_BASE = '/api/v1';

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  count?: number;
  error?: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}

async function parseResponse<T>(res: Response): Promise<T> {
  const payload = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!res.ok || !payload?.success) {
    const firstDetail = payload?.error?.details?.[0]?.message;
    const msg = firstDetail || payload?.error?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return payload.data as T;
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) return false;
    const json = (await res.json()) as { success?: boolean };
    return Boolean(json.success);
  } catch {
    return false;
  }
}

export async function fetchResources(
  user: UserProfile | null,
  filters?: { search?: string; category?: string }
): Promise<Resource[]> {
  const params = new URLSearchParams();
  if (filters?.search?.trim()) params.set('search', filters.search.trim());
  if (filters?.category && filters.category !== 'All') params.set('category', filters.category);

  const queryStr = params.toString();
  const res = await fetch(`${API_BASE}/resources${queryStr ? `?${queryStr}` : ''}`, {
    headers: buildAuthHeaders(user),
  });
  return parseResponse<Resource[]>(res);
}

export async function fetchMyListings(user: UserProfile | null): Promise<MyListingsResponse> {
  const res = await fetch(`${API_BASE}/resources/mine`, {
    headers: buildAuthHeaders(user),
  });
  return parseResponse<MyListingsResponse>(res);
}

export async function estimateFairPriceApi(payload: {
  category: ResourceCategory;
  course_code: string;
  condition: Resource['condition'];
  notes_included: boolean;
  original_price?: number;
}): Promise<FairPriceEstimate> {
  const res = await fetch(`${API_BASE}/resources/estimate-price`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseResponse<FairPriceEstimate>(res);
}

export interface CreateResourcePayload {
  title: string;
  category: ResourceCategory;
  price: number;
  originalPrice?: number;
  condition: Resource['condition'];
  courseCode: string;
  courseName: string;
  department: string;
  edition: string;
  pickupLocation: string;
  description: string;
  handwrittenNotesIncluded: boolean;
  availableUntil: string;
  image?: string;
}

export type UpdateResourcePayload = Partial<Omit<CreateResourcePayload, 'image'>>;

export async function createResourceListing(
  payload: CreateResourcePayload,
  user: UserProfile | null,
  imageFile?: File | null
): Promise<Resource> {
  const headers = buildAuthHeaders(user);

  if (imageFile) {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, String(value));
      }
    });
    formData.append('imageFile', imageFile);

    const res = await fetch(`${API_BASE}/resources`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return parseResponse<Resource>(res);
  }

  const res = await fetch(`${API_BASE}/resources`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<Resource>(res);
}

export async function updateResourceListing(
  resourceId: string,
  payload: UpdateResourcePayload,
  user: UserProfile | null,
  imageFile?: File | null
): Promise<Resource> {
  const headers = buildAuthHeaders(user);

  if (imageFile) {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, String(value));
      }
    });
    formData.append('imageFile', imageFile);

    const res = await fetch(`${API_BASE}/resources/${resourceId}`, {
      method: 'PATCH',
      headers,
      body: formData,
    });
    return parseResponse<Resource>(res);
  }

  const res = await fetch(`${API_BASE}/resources/${resourceId}`, {
    method: 'PATCH',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<Resource>(res);
}

export async function reserveResourceItem(
  resourceId: string,
  user: UserProfile | null
): Promise<{ resource: Resource; reservationId: string; otpCode: string }> {
  const res = await fetch(`${API_BASE}/resources/${resourceId}/reserve`, {
    method: 'POST',
    headers: buildAuthHeaders(user),
  });
  return parseResponse<{ resource: Resource; reservationId: string; otpCode: string }>(res);
}

export async function verifyResourceOtp(
  reservationId: string,
  otpCode: string,
  user: UserProfile | null
): Promise<Resource> {
  const res = await fetch(`${API_BASE}/reservations/${reservationId}/verify-otp`, {
    method: 'POST',
    headers: {
      ...buildAuthHeaders(user),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ otp_code: otpCode }),
  });
  return parseResponse<Resource>(res);
}

export async function cancelResourceReservation(
  reservationId: string,
  user: UserProfile | null
): Promise<Resource> {
  const res = await fetch(`${API_BASE}/reservations/${reservationId}/cancel`, {
    method: 'POST',
    headers: buildAuthHeaders(user),
  });
  return parseResponse<Resource>(res);
}

export async function deleteResourceListing(
  resourceId: string,
  user: UserProfile | null
): Promise<{ id: string; deleted: boolean }> {
  const res = await fetch(`${API_BASE}/resources/${resourceId}`, {
    method: 'DELETE',
    headers: buildAuthHeaders(user),
  });
  return parseResponse<{ id: string; deleted: boolean }>(res);
}
