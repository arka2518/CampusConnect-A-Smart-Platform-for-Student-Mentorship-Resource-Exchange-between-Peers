import { CartResponse, MyOrdersResponse, Order, UserProfile } from '../types';
import { buildAuthHeaders } from './authApi';

const API_BASE = '/api/v1';

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}

async function parseOrderResponse<T>(res: Response): Promise<T> {
  const payload = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!res.ok || !payload?.success) {
    const firstDetail = payload?.error?.details?.[0]?.message;
    const msg = firstDetail || payload?.error?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return payload.data as T;
}

export async function fetchCart(user: UserProfile | null): Promise<CartResponse> {
  const res = await fetch(`${API_BASE}/cart`, {
    headers: buildAuthHeaders(user),
  });
  return parseOrderResponse<CartResponse>(res);
}

export async function addToCartApi(
  resourceId: string,
  user: UserProfile | null
): Promise<CartResponse> {
  const res = await fetch(`${API_BASE}/cart/items`, {
    method: 'POST',
    headers: {
      ...buildAuthHeaders(user),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ resource_id: resourceId }),
  });
  return parseOrderResponse<CartResponse>(res);
}

export async function removeFromCartApi(
  resourceId: string,
  user: UserProfile | null
): Promise<CartResponse> {
  const res = await fetch(`${API_BASE}/cart/items/${resourceId}`, {
    method: 'DELETE',
    headers: buildAuthHeaders(user),
  });
  return parseOrderResponse<CartResponse>(res);
}

export async function clearCartApi(user: UserProfile | null): Promise<CartResponse> {
  const res = await fetch(`${API_BASE}/cart`, {
    method: 'DELETE',
    headers: buildAuthHeaders(user),
  });
  return parseOrderResponse<CartResponse>(res);
}

export async function checkoutCartApi(user: UserProfile | null): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders/checkout`, {
    method: 'POST',
    headers: {
      ...buildAuthHeaders(user),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      payment_method: 'Pay at Campus Meetup (UPI / Cash)',
    }),
  });
  return parseOrderResponse<Order>(res);
}

export async function fetchMyOrders(user: UserProfile | null): Promise<MyOrdersResponse> {
  const res = await fetch(`${API_BASE}/orders/mine`, {
    headers: buildAuthHeaders(user),
  });
  return parseOrderResponse<MyOrdersResponse>(res);
}
