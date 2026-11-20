import crypto from 'crypto';
import { PoolClient } from 'pg';
import { query, withTransaction } from '../../config/db';
import { AuthenticatedUser } from '../../middleware/auth.middleware';
import { AppError } from '../../middleware/error.middleware';

interface CartRow {
  cart_item_id: string;
  added_at: Date;
  resource_id: string;
  title: string;
  category: string;
  course_code: string;
  condition: string;
  fair_price: number;
  image_url: string;
  pickup_location: string;
  available_until: Date | string;
  resource_status: 'Available' | 'Reserved' | 'Handed Over';
  seller_id: string;
  seller_name: string;
  seller_department: string;
}

export interface CartItemDTO {
  cartItemId: string;
  resourceId: string;
  title: string;
  category: string;
  courseCode: string;
  condition: string;
  price: number;
  image: string;
  pickupLocation: string;
  availableUntil: string;
  status: 'Available' | 'Reserved' | 'Handed Over';
  isAvailable: boolean;
  seller: {
    id: string;
    name: string;
    department: string;
  };
  addedAt: string;
}

export interface CartResponseDTO {
  items: CartItemDTO[];
  totalAmount: number;
  availableCount: number;
  unavailableCount: number;
}

export interface OrderItemDTO {
  resourceId: string;
  reservationId: string;
  title: string;
  category: string;
  courseCode: string;
  image: string;
  price: number;
  pickupLocation: string;
  availableUntil: string;
  reservationStatus: 'Pending Handoff' | 'Verified & Complete' | 'Cancelled';
  otpCode?: string;
  verifiedAt?: string | null;
  seller: {
    id: string;
    name: string;
    department: string;
    phone: string;
    email: string;
  };
}

export interface OrderDTO {
  id: string;
  orderNumber: string;
  totalAmount: number;
  paymentMethod: string;
  status: 'Active' | 'Partially Completed' | 'Completed' | 'Cancelled';
  createdAt: string;
  isDirectReservation: boolean;
  items: OrderItemDTO[];
}

export interface MyOrdersResponseDTO {
  orders: OrderDTO[];
  summary: {
    totalOrders: number;
    pendingPickups: number;
    completedPickups: number;
    cancelledPickups: number;
  };
}

function formatDisplayDate(dateValue: Date | string): string {
  const dateObj = dateValue instanceof Date ? dateValue : new Date(`${dateValue}T00:00:00Z`);
  if (Number.isNaN(dateObj.getTime())) return String(dateValue);
  return dateObj.toLocaleDateString('en-US', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function generateOrderNumber(): string {
  const randomPart = crypto.randomInt(1000, 10000);
  return `CC-26-${randomPart}`;
}

export async function getCart(userId: string): Promise<CartResponseDTO> {
  const result = await query<CartRow>(
    `SELECT
       c.id AS cart_item_id,
       c.added_at,
       r.id AS resource_id,
       r.title,
       r.category,
       r.course_code,
       r.condition,
       r.fair_price,
       r.image_url,
       r.pickup_location,
       r.available_until,
       r.status AS resource_status,
       r.seller_id,
       u.full_name AS seller_name,
       u.department AS seller_department
     FROM cart_items c
     JOIN academic_resources r ON r.id = c.resource_id
     JOIN users u ON u.id = r.seller_id
     WHERE c.user_id = $1
     ORDER BY c.added_at DESC`,
    [userId]
  );

  let totalAmount = 0;
  let availableCount = 0;
  let unavailableCount = 0;

  const items: CartItemDTO[] = result.rows.map((row) => {
    const isAvailable = row.resource_status === 'Available' && row.seller_id !== userId;
    if (isAvailable) {
      availableCount++;
      totalAmount += row.fair_price;
    } else {
      unavailableCount++;
    }

    return {
      cartItemId: row.cart_item_id,
      resourceId: row.resource_id,
      title: row.title,
      category: row.category,
      courseCode: row.course_code,
      condition: row.condition,
      price: row.fair_price,
      image: row.image_url,
      pickupLocation: row.pickup_location,
      availableUntil: formatDisplayDate(row.available_until),
      status: row.resource_status,
      isAvailable,
      seller: {
        id: row.seller_id,
        name: row.seller_name,
        department: row.seller_department,
      },
      addedAt: row.added_at.toISOString(),
    };
  });

  return {
    items,
    totalAmount,
    availableCount,
    unavailableCount,
  };
}

export async function addToCart(
  user: AuthenticatedUser,
  resourceId: string
): Promise<CartResponseDTO> {
  const resCheck = await query<{ id: string; seller_id: string; status: string }>(
    'SELECT id, seller_id, status FROM academic_resources WHERE id = $1 LIMIT 1',
    [resourceId]
  );

  const resource = resCheck.rows[0];
  if (!resource) {
    throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Academic resource listing not found.');
  }
  if (resource.seller_id === user.id) {
    throw new AppError(400, 'CANNOT_ADD_OWN_ITEM', 'You cannot add your own listing to your cart.');
  }
  if (resource.status !== 'Available') {
    throw new AppError(
      409,
      'RESOURCE_UNAVAILABLE',
      `This item is already ${resource.status.toLowerCase()} and cannot be added to cart.`
    );
  }

  await query(
    `INSERT INTO cart_items (user_id, resource_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, resource_id) DO NOTHING`,
    [user.id, resourceId]
  );

  return getCart(user.id);
}

export async function removeFromCart(
  userId: string,
  resourceId: string
): Promise<CartResponseDTO> {
  await query('DELETE FROM cart_items WHERE user_id = $1 AND resource_id = $2', [
    userId,
    resourceId,
  ]);
  return getCart(userId);
}

export async function clearCart(userId: string): Promise<CartResponseDTO> {
  await query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
  return {
    items: [],
    totalAmount: 0,
    availableCount: 0,
    unavailableCount: 0,
  };
}

/**
 * Atomic Multi-Item ACID Checkout (Pay at Campus Meetup — Cash / UPI).
 * Locks all cart items in deterministic UUID order (`FOR UPDATE`) to prevent deadlocks
 * and guarantee all-or-nothing inventory reservation with per-item 4-digit OTPs.
 */
export async function checkoutCart(
  buyer: AuthenticatedUser,
  paymentMethod = 'Pay at Campus Meetup (UPI / Cash)'
): Promise<OrderDTO> {
  const createdOrderId = await withTransaction(async (client) => {
    const cartRows = await client.query<{ resource_id: string }>(
      `SELECT resource_id
       FROM cart_items
       WHERE user_id = $1
       ORDER BY resource_id ASC`,
      [buyer.id]
    );

    if (cartRows.rows.length === 0) {
      throw new AppError(400, 'CART_EMPTY', 'Your cart is empty. Add items before checking out.');
    }

    const resourceIds = cartRows.rows.map((r) => r.resource_id);

    // Acquire row-level locks in sorted UUID order to prevent concurrent deadlocks
    const lockedResources = await client.query<{
      id: string;
      seller_id: string;
      title: string;
      fair_price: number;
      status: string;
    }>(
      `SELECT id, seller_id, title, fair_price, status
       FROM academic_resources
       WHERE id = ANY($1::uuid[])
       ORDER BY id ASC
       FOR UPDATE`,
      [resourceIds]
    );

    if (lockedResources.rows.length !== resourceIds.length) {
      throw new AppError(
        409,
        'ITEM_REMOVED',
        'One or more items in your cart were removed by the seller. Please refresh your cart.'
      );
    }

    const unavailable = lockedResources.rows.filter(
      (r) => r.status !== 'Available' || r.seller_id === buyer.id
    );
    if (unavailable.length > 0) {
      const names = unavailable.map((u) => `"${u.title}"`).join(', ');
      throw new AppError(
        409,
        'ITEMS_UNAVAILABLE',
        `${names} ${unavailable.length === 1 ? 'is' : 'are'} no longer available. Remove unavailable items from your cart and try again.`
      );
    }

    const totalAmount = lockedResources.rows.reduce((sum, r) => sum + r.fair_price, 0);

    // Retry briefly in the extremely rare case of order_number collision
    let orderId = '';
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidateNumber = generateOrderNumber();
      const insertedOrder = await client.query<{ id: string }>(
        `INSERT INTO orders (order_number, buyer_id, total_amount, payment_method, status)
         VALUES ($1, $2, $3, $4, 'Active')
         ON CONFLICT (order_number) DO NOTHING
         RETURNING id`,
        [candidateNumber, buyer.id, totalAmount, paymentMethod]
      );
      if (insertedOrder.rows[0]) {
        orderId = insertedOrder.rows[0].id;
        break;
      }
    }

    if (!orderId) {
      throw new AppError(500, 'ORDER_NUMBER_GENERATION_FAILED', 'Could not allocate an order number.');
    }

    for (const item of lockedResources.rows) {
      const otpCode = String(crypto.randomInt(1000, 10000));

      await client.query(
        `UPDATE academic_resources SET status = 'Reserved', updated_at = NOW() WHERE id = $1`,
        [item.id]
      );

      const resInsert = await client.query<{ id: string }>(
        `INSERT INTO reservations (buyer_id, seller_id, item_type, item_id, otp_code, status)
         VALUES ($1, $2, 'Resource', $3, $4, 'Pending Handoff')
         RETURNING id`,
        [buyer.id, item.seller_id, item.id, otpCode]
      );

      await client.query(
        `INSERT INTO order_items (order_id, resource_id, reservation_id, price_at_purchase)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.id, resInsert.rows[0].id, item.fair_price]
      );
    }

    // Clear buyer's cart atomically inside the same transaction
    await client.query('DELETE FROM cart_items WHERE user_id = $1', [buyer.id]);

    return orderId;
  });

  const allOrders = await getMyOrders(buyer.id);
  const created = allOrders.orders.find((o) => o.id === createdOrderId);
  if (!created) {
    throw new AppError(500, 'ORDER_LOAD_FAILED', 'Order placed, but failed to load order details.');
  }
  return created;
}

interface OrderJoinedRow {
  order_id: string;
  order_number: string;
  total_amount: number;
  payment_method: string;
  order_status: 'Active' | 'Partially Completed' | 'Completed' | 'Cancelled';
  order_created_at: Date;
  resource_id: string;
  reservation_id: string;
  price_at_purchase: number;
  title: string;
  category: string;
  course_code: string;
  image_url: string;
  pickup_location: string;
  available_until: Date | string;
  reservation_status: 'Pending Handoff' | 'Verified & Complete' | 'Cancelled';
  otp_code: string;
  verified_at: Date | null;
  seller_id: string;
  seller_name: string;
  seller_department: string;
  seller_phone: string | null;
  seller_email: string;
}

interface DirectReservationRow {
  reservation_id: string;
  reservation_status: 'Pending Handoff' | 'Verified & Complete' | 'Cancelled';
  otp_code: string;
  verified_at: Date | null;
  created_at: Date;
  resource_id: string;
  title: string;
  category: string;
  course_code: string;
  image_url: string;
  fair_price: number;
  pickup_location: string;
  available_until: Date | string;
  seller_id: string;
  seller_name: string;
  seller_department: string;
  seller_phone: string | null;
  seller_email: string;
}

export async function getMyOrders(buyerId: string): Promise<MyOrdersResponseDTO> {
  // 1. Fetch all multi-item cart orders
  const orderRows = await query<OrderJoinedRow>(
    `SELECT
       o.id AS order_id,
       o.order_number,
       o.total_amount,
       o.payment_method,
       o.status AS order_status,
       o.created_at AS order_created_at,
       oi.resource_id,
       oi.reservation_id,
       oi.price_at_purchase,
       r.title,
       r.category,
       r.course_code,
       r.image_url,
       r.pickup_location,
       r.available_until,
       res.status AS reservation_status,
       res.otp_code,
       res.verified_at,
       u.id AS seller_id,
       u.full_name AS seller_name,
       u.department AS seller_department,
       u.phone_number AS seller_phone,
       u.university_email AS seller_email
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     JOIN academic_resources r ON r.id = oi.resource_id
     JOIN reservations res ON res.id = oi.reservation_id
     JOIN users u ON u.id = res.seller_id
     WHERE o.buyer_id = $1
     ORDER BY o.created_at DESC, oi.created_at ASC`,
    [buyerId]
  );

  const ordersMap = new Map<string, OrderDTO>();

  for (const row of orderRows.rows) {
    let order = ordersMap.get(row.order_id);
    if (!order) {
      order = {
        id: row.order_id,
        orderNumber: row.order_number,
        totalAmount: row.total_amount,
        paymentMethod: row.payment_method,
        status: row.order_status,
        createdAt: row.order_created_at.toISOString(),
        isDirectReservation: false,
        items: [],
      };
      ordersMap.set(row.order_id, order);
    }

    order.items.push({
      resourceId: row.resource_id,
      reservationId: row.reservation_id,
      title: row.title,
      category: row.category,
      courseCode: row.course_code,
      image: row.image_url,
      price: row.price_at_purchase,
      pickupLocation: row.pickup_location,
      availableUntil: formatDisplayDate(row.available_until),
      reservationStatus: row.reservation_status,
      ...(row.reservation_status === 'Pending Handoff' ? { otpCode: row.otp_code } : {}),
      verifiedAt: row.verified_at ? row.verified_at.toISOString() : null,
      seller: {
        id: row.seller_id,
        name: row.seller_name,
        department: row.seller_department,
        phone: row.seller_phone || '+91 98765 43210',
        email: row.seller_email,
      },
    });
  }

  // 2. Also include direct single-item reservations made via ResourceModal ("Reserve Now")
  const directRows = await query<DirectReservationRow>(
    `SELECT
       res.id AS reservation_id,
       res.status AS reservation_status,
       res.otp_code,
       res.verified_at,
       res.created_at,
       r.id AS resource_id,
       r.title,
       r.category,
       r.course_code,
       r.image_url,
       r.fair_price,
       r.pickup_location,
       r.available_until,
       u.id AS seller_id,
       u.full_name AS seller_name,
       u.department AS seller_department,
       u.phone_number AS seller_phone,
       u.university_email AS seller_email
     FROM reservations res
     JOIN academic_resources r ON r.id = res.item_id
     JOIN users u ON u.id = res.seller_id
     LEFT JOIN order_items oi ON oi.reservation_id = res.id
     WHERE res.buyer_id = $1
       AND res.item_type = 'Resource'
       AND oi.id IS NULL
     ORDER BY res.created_at DESC`,
    [buyerId]
  );

  const directOrders: OrderDTO[] = directRows.rows.map((row) => {
    const derivedStatus: OrderDTO['status'] =
      row.reservation_status === 'Verified & Complete'
        ? 'Completed'
        : row.reservation_status === 'Cancelled'
          ? 'Cancelled'
          : 'Active';

    return {
      id: `direct-${row.reservation_id}`,
      orderNumber: `DIRECT-${row.reservation_id.slice(0, 6).toUpperCase()}`,
      totalAmount: row.fair_price,
      paymentMethod: 'Pay at Campus Meetup (UPI / Cash)',
      status: derivedStatus,
      createdAt: row.created_at.toISOString(),
      isDirectReservation: true,
      items: [
        {
          resourceId: row.resource_id,
          reservationId: row.reservation_id,
          title: row.title,
          category: row.category,
          courseCode: row.course_code,
          image: row.image_url,
          price: row.fair_price,
          pickupLocation: row.pickup_location,
          availableUntil: formatDisplayDate(row.available_until),
          reservationStatus: row.reservation_status,
          ...(row.reservation_status === 'Pending Handoff' ? { otpCode: row.otp_code } : {}),
          verifiedAt: row.verified_at ? row.verified_at.toISOString() : null,
          seller: {
            id: row.seller_id,
            name: row.seller_name,
            department: row.seller_department,
            phone: row.seller_phone || '+91 98765 43210',
            email: row.seller_email,
          },
        },
      ],
    };
  });

  const combined = [...Array.from(ordersMap.values()), ...directOrders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  let pendingPickups = 0;
  let completedPickups = 0;
  let cancelledPickups = 0;

  for (const order of combined) {
    for (const item of order.items) {
      if (item.reservationStatus === 'Pending Handoff') pendingPickups++;
      else if (item.reservationStatus === 'Verified & Complete') completedPickups++;
      else if (item.reservationStatus === 'Cancelled') cancelledPickups++;
    }
  }

  return {
    orders: combined,
    summary: {
      totalOrders: combined.length,
      pendingPickups,
      completedPickups,
      cancelledPickups,
    },
  };
}

/**
 * Recomputes a parent order's status inside an active transaction whenever
 * one of its underlying reservations is OTP-verified or cancelled.
 */
export async function syncOrderStatusForReservation(
  client: PoolClient,
  reservationId: string
): Promise<void> {
  const orderLink = await client.query<{ order_id: string }>(
    'SELECT order_id FROM order_items WHERE reservation_id = $1 LIMIT 1',
    [reservationId]
  );

  const orderId = orderLink.rows[0]?.order_id;
  if (!orderId) return;

  const statuses = await client.query<{ status: string }>(
    `SELECT res.status
     FROM order_items oi
     JOIN reservations res ON res.id = oi.reservation_id
     WHERE oi.order_id = $1`,
    [orderId]
  );

  const list = statuses.rows.map((r) => r.status);
  if (list.length === 0) return;

  let nextStatus: 'Active' | 'Partially Completed' | 'Completed' | 'Cancelled' = 'Active';
  const allCancelled = list.every((s) => s === 'Cancelled');
  const allCompleteOrCancelled = list.every(
    (s) => s === 'Verified & Complete' || s === 'Cancelled'
  );
  const someComplete = list.some((s) => s === 'Verified & Complete');

  if (allCancelled) {
    nextStatus = 'Cancelled';
  } else if (allCompleteOrCancelled && someComplete) {
    nextStatus = 'Completed';
  } else if (someComplete) {
    nextStatus = 'Partially Completed';
  }

  await client.query('UPDATE orders SET status = $1 WHERE id = $2', [nextStatus, orderId]);
}
