import crypto from 'crypto';
import { query, withTransaction } from '../../config/db';
import { AuthenticatedUser } from '../../middleware/auth.middleware';
import { AppError } from '../../middleware/error.middleware';
import { deleteImage } from '../../services/storage.service';
import { syncOrderStatusForReservation } from '../orders/orders.service';
import {
  CreateResourceInput,
  ListResourcesQuery,
  UpdateResourceInput,
} from './resources.schema';

interface ResourceJoinedRow {
  id: string;
  departure_id: string;
  seller_id: string;
  title: string;
  category: 'Textbook' | 'Lab Equipment' | 'Electronics' | 'Study Notes' | 'Hostel Essentials';
  course_code: string;
  course_name: string;
  department: string;
  edition_details: string;
  condition: 'Like New' | 'Gently Used' | 'Annotated with Exam Notes';
  fair_price: number;
  original_price: number;
  notes_included: boolean;
  pickup_location: string;
  description: string;
  image_url: string;
  available_until: Date | string;
  status: 'Available' | 'Reserved' | 'Handed Over';
  created_at: Date;
  seller_name: string;
  seller_year: string;
  seller_department: string;
  seller_verified: boolean;
  seller_phone: string | null;
  seller_email: string;
  reservation_id: string | null;
  reservation_buyer_id: string | null;
  reservation_buyer_name: string | null;
  reservation_otp_code: string | null;
  reservation_status: 'Pending Handoff' | 'Verified & Complete' | 'Cancelled' | null;
  reservation_created_at: Date | null;
}

export interface ResourceDTO {
  id: string;
  title: string;
  category: ResourceJoinedRow['category'];
  price: number;
  originalPrice: number;
  condition: ResourceJoinedRow['condition'];
  image: string;
  courseCode: string;
  courseName: string;
  department: string;
  seller: {
    id: string;
    name: string;
    year: string;
    department: string;
    verified: boolean;
    phone: string;
    email?: string;
    contactUnmasked: boolean;
  };
  pickupLocation: string;
  description: string;
  handwrittenNotesIncluded: boolean;
  edition: string;
  availableUntil: string;
  availableUntilIso: string;
  status: ResourceJoinedRow['status'];
  activeReservation?: {
    id: string;
    buyerId: string;
    buyerName: string;
    status: 'Pending Handoff' | 'Verified & Complete' | 'Cancelled';
    otpCode?: string; // Exposed ONLY to the reserving buyer
    createdAt: string;
  };
}

function maskPhone(phone: string | null): string {
  if (!phone) return '+91 98••• •••••';
  const trimmed = phone.trim();
  if (trimmed.length <= 6) return '••••••';
  return `${trimmed.slice(0, trimmed.length - 5)}•••••`;
}

function formatDisplayDate(dateValue: Date | string): { display: string; iso: string } {
  const dateObj = dateValue instanceof Date ? dateValue : new Date(`${dateValue}T00:00:00Z`);
  if (Number.isNaN(dateObj.getTime())) {
    const str = String(dateValue);
    return { display: str, iso: str };
  }
  const iso = dateObj.toISOString().slice(0, 10);
  const display = dateObj.toLocaleDateString('en-US', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  });
  return { display, iso };
}

function mapResourceRow(row: ResourceJoinedRow, viewerUserId?: string): ResourceDTO {
  const isSeller = Boolean(viewerUserId && viewerUserId === row.seller_id);
  const isBuyer = Boolean(viewerUserId && row.reservation_buyer_id && viewerUserId === row.reservation_buyer_id);
  const contactUnmasked = isSeller || isBuyer;
  const { display, iso } = formatDisplayDate(row.available_until);

  const dto: ResourceDTO = {
    id: row.id,
    title: row.title,
    category: row.category,
    price: row.fair_price,
    originalPrice: row.original_price,
    condition: row.condition,
    image: row.image_url,
    courseCode: row.course_code,
    courseName: row.course_name,
    department: row.department,
    seller: {
      id: row.seller_id,
      name: row.seller_name,
      year: row.seller_year,
      department: row.seller_department,
      verified: row.seller_verified,
      phone: contactUnmasked ? row.seller_phone || '+91 98765 43210' : maskPhone(row.seller_phone),
      ...(contactUnmasked ? { email: row.seller_email } : {}),
      contactUnmasked,
    },
    pickupLocation: row.pickup_location,
    description: row.description,
    handwrittenNotesIncluded: row.notes_included,
    edition: row.edition_details,
    availableUntil: display,
    availableUntilIso: iso,
    status: row.status,
  };

  if (row.reservation_id && row.reservation_buyer_id && row.reservation_status) {
    dto.activeReservation = {
      id: row.reservation_id,
      buyerId: row.reservation_buyer_id,
      buyerName: row.reservation_buyer_name || 'Verified Student',
      status: row.reservation_status,
      // Security: OTP is revealed ONLY to the buyer who holds the reservation
      ...(isBuyer && row.reservation_status === 'Pending Handoff' && row.reservation_otp_code
        ? { otpCode: row.reservation_otp_code }
        : {}),
      createdAt: row.reservation_created_at
        ? row.reservation_created_at.toISOString()
        : new Date().toISOString(),
    };
  }

  return dto;
}

const BASE_SELECT = `
  SELECT
    r.id,
    r.departure_id,
    r.seller_id,
    r.title,
    r.category,
    r.course_code,
    r.course_name,
    r.department,
    r.edition_details,
    r.condition,
    r.fair_price,
    r.original_price,
    r.notes_included,
    r.pickup_location,
    r.description,
    r.image_url,
    r.available_until,
    r.status,
    r.created_at,
    u.full_name AS seller_name,
    u.academic_year AS seller_year,
    u.department AS seller_department,
    u.verified_student AS seller_verified,
    u.phone_number AS seller_phone,
    u.university_email AS seller_email,
    res.id AS reservation_id,
    res.buyer_id AS reservation_buyer_id,
    buyer.full_name AS reservation_buyer_name,
    res.otp_code AS reservation_otp_code,
    res.status AS reservation_status,
    res.created_at AS reservation_created_at
  FROM academic_resources r
  JOIN users u ON u.id = r.seller_id
  LEFT JOIN LATERAL (
    SELECT id, buyer_id, otp_code, status, created_at
    FROM reservations
    WHERE item_type = 'Resource'
      AND item_id = r.id
      AND status IN ('Pending Handoff', 'Verified & Complete')
    ORDER BY created_at DESC
    LIMIT 1
  ) res ON TRUE
  LEFT JOIN users buyer ON buyer.id = res.buyer_id
`;

export async function listResources(
  filters: ListResourcesQuery,
  viewerUserId?: string
): Promise<ResourceDTO[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.category) {
    params.push(filters.category);
    conditions.push(`r.category = $${params.length}`);
  }

  if (filters.course_code) {
    params.push(`%${filters.course_code}%`);
    conditions.push(`r.course_code ILIKE $${params.length}`);
  }

  if (filters.condition) {
    params.push(filters.condition);
    conditions.push(`r.condition = $${params.length}`);
  }

  if (typeof filters.notes_included === 'boolean') {
    params.push(filters.notes_included);
    conditions.push(`r.notes_included = $${params.length}`);
  }

  if (typeof filters.max_price === 'number') {
    params.push(filters.max_price);
    conditions.push(`r.fair_price <= $${params.length}`);
  }

  if (filters.status) {
    params.push(filters.status);
    conditions.push(`r.status = $${params.length}`);
  }

  if (filters.search) {
    params.push(filters.search);
    const ftsParam = `$${params.length}`;
    params.push(`%${filters.search}%`);
    const likeParam = `$${params.length}`;
    conditions.push(`(
      to_tsvector(
        'english',
        coalesce(r.title, '') || ' ' ||
        coalesce(r.course_code, '') || ' ' ||
        coalesce(r.course_name, '') || ' ' ||
        coalesce(r.description, '')
      ) @@ plainto_tsquery('english', ${ftsParam})
      OR r.title ILIKE ${likeParam}
      OR r.course_code ILIKE ${likeParam}
      OR r.course_name ILIKE ${likeParam}
      OR u.full_name ILIKE ${likeParam}
    )`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `
    ${BASE_SELECT}
    ${whereClause}
    ORDER BY
      CASE r.status WHEN 'Available' THEN 0 WHEN 'Reserved' THEN 1 ELSE 2 END,
      r.created_at DESC
  `;

  const result = await query<ResourceJoinedRow>(sql, params);
  return result.rows.map((row) => mapResourceRow(row, viewerUserId));
}

export interface MyListingsResult {
  items: ResourceDTO[];
  summary: {
    total: number;
    available: number;
    reserved: number;
    handedOver: number;
    pendingOtpCount: number;
  };
}

export async function listMyResources(sellerId: string): Promise<MyListingsResult> {
  const sql = `
    ${BASE_SELECT}
    WHERE r.seller_id = $1
    ORDER BY
      CASE r.status WHEN 'Reserved' THEN 0 WHEN 'Available' THEN 1 ELSE 2 END,
      r.updated_at DESC,
      r.created_at DESC
  `;

  const result = await query<ResourceJoinedRow>(sql, [sellerId]);
  const items = result.rows.map((row) => mapResourceRow(row, sellerId));

  let available = 0;
  let reserved = 0;
  let handedOver = 0;
  let pendingOtpCount = 0;

  for (const item of items) {
    if (item.status === 'Available') available++;
    else if (item.status === 'Reserved') {
      reserved++;
      if (item.activeReservation?.status === 'Pending Handoff') {
        pendingOtpCount++;
      }
    } else if (item.status === 'Handed Over') {
      handedOver++;
    }
  }

  return {
    items,
    summary: {
      total: items.length,
      available,
      reserved,
      handedOver,
      pendingOtpCount,
    },
  };
}

export async function getResourceById(
  id: string,
  viewerUserId?: string
): Promise<ResourceDTO> {
  const result = await query<ResourceJoinedRow>(`${BASE_SELECT} WHERE r.id = $1 LIMIT 1`, [id]);
  if (!result.rows[0]) {
    throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Academic resource listing not found.');
  }
  return mapResourceRow(result.rows[0], viewerUserId);
}

export async function createResource(
  input: CreateResourceInput,
  seller: AuthenticatedUser,
  uploadedImageUrl?: string
): Promise<ResourceDTO> {
  const imageUrl = uploadedImageUrl || input.image || '/images/resources/res-1.jpg';
  const isTextbook = input.category === 'Textbook';
  const hasAnnotations = isTextbook ? Boolean(input.handwrittenNotesIncluded) : false;
  const condition =
    !isTextbook && input.condition === 'Annotated with Exam Notes'
      ? 'Gently Used'
      : input.condition;
  // When seller doesn't enter a retail MRP, store price (min 1) so no artificial discount is shown
  const storedOriginalPrice = input.originalPrice ?? Math.max(1, input.price);

  const createdId = await withTransaction(async (client) => {
    // Anchor listing to the senior's unified departure record for Academic Year 26-27
    const departureRes = await client.query<{ id: string }>(
      `INSERT INTO senior_departures (senior_id, academic_cycle, vacating_date)
       VALUES ($1, 'Academic Year 26-27', $2)
       ON CONFLICT (senior_id, academic_cycle) DO UPDATE
         SET vacating_date = LEAST(senior_departures.vacating_date, EXCLUDED.vacating_date)
       RETURNING id`,
      [seller.id, input.availableUntil]
    );
    const departureId = departureRes.rows[0].id;

    const inserted = await client.query<{ id: string }>(
      `INSERT INTO academic_resources (
         departure_id, seller_id, title, category, course_code, course_name,
         department, edition_details, condition, fair_price, original_price,
         notes_included, pickup_location, description, image_url, available_until, status
       )
       VALUES (
         $1, $2, $3, $4, $5, $6,
         $7, $8, $9, $10, $11,
         $12, $13, $14, $15, $16, 'Available'
       )
       RETURNING id`,
      [
        departureId,
        seller.id,
        input.title,
        input.category,
        input.courseCode.toUpperCase(),
        input.courseName,
        input.department || seller.department,
        input.edition,
        condition,
        input.price,
        storedOriginalPrice,
        hasAnnotations,
        input.pickupLocation,
        input.description,
        imageUrl,
        input.availableUntil,
      ]
    );

    return inserted.rows[0].id;
  });

  return getResourceById(createdId, seller.id);
}

export async function updateResource(
  id: string,
  updates: UpdateResourceInput,
  currentUser: AuthenticatedUser,
  uploadedImageUrl?: string
): Promise<ResourceDTO> {
  const existing = await query<{
    seller_id: string;
    status: string;
    category: ResourceJoinedRow['category'];
    image_url: string;
    fair_price: number;
    original_price: number;
  }>(
    'SELECT seller_id, status, category, image_url, fair_price, original_price FROM academic_resources WHERE id = $1',
    [id]
  );

  const current = existing.rows[0];
  if (!current) {
    throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Academic resource listing not found.');
  }
  if (current.seller_id !== currentUser.id && currentUser.role !== 'Admin') {
    throw new AppError(403, 'FORBIDDEN', 'Only the listing owner can edit this resource.');
  }
  if (current.status === 'Handed Over') {
    throw new AppError(409, 'ALREADY_HANDED_OVER', 'Cannot edit a resource that has already been handed over.');
  }

  const nextCategory = updates.category ?? current.category;
  const normalizedUpdates: UpdateResourceInput = { ...updates };

  // Enforce "Has Annotations" only for Textbooks
  if (nextCategory !== 'Textbook') {
    normalizedUpdates.handwrittenNotesIncluded = false;
    if (normalizedUpdates.condition === 'Annotated with Exam Notes') {
      normalizedUpdates.condition = 'Gently Used';
    }
  }

  // If listing previously had no separate retail MRP (original_price === fair_price) and price changed, keep them aligned
  if (
    normalizedUpdates.price !== undefined &&
    normalizedUpdates.originalPrice === undefined &&
    current.original_price <= current.fair_price
  ) {
    normalizedUpdates.originalPrice = Math.max(1, normalizedUpdates.price);
  }

  const fieldMap: Array<[keyof UpdateResourceInput, string]> = [
    ['title', 'title'],
    ['category', 'category'],
    ['price', 'fair_price'],
    ['originalPrice', 'original_price'],
    ['condition', 'condition'],
    ['courseCode', 'course_code'],
    ['courseName', 'course_name'],
    ['department', 'department'],
    ['edition', 'edition_details'],
    ['pickupLocation', 'pickup_location'],
    ['description', 'description'],
    ['handwrittenNotesIncluded', 'notes_included'],
    ['availableUntil', 'available_until'],
  ];

  const setClauses: string[] = [];
  const params: unknown[] = [];

  for (const [inputKey, colName] of fieldMap) {
    if (normalizedUpdates[inputKey] !== undefined) {
      const value =
        inputKey === 'courseCode' && typeof normalizedUpdates[inputKey] === 'string'
          ? (normalizedUpdates[inputKey] as string).toUpperCase()
          : normalizedUpdates[inputKey];
      params.push(value);
      setClauses.push(`${colName} = $${params.length}`);
    }
  }

  if (uploadedImageUrl) {
    params.push(uploadedImageUrl);
    setClauses.push(`image_url = $${params.length}`);
  }

  if (setClauses.length === 0) {
    return getResourceById(id, currentUser.id);
  }

  setClauses.push('updated_at = NOW()');
  params.push(id);

  await query(
    `UPDATE academic_resources SET ${setClauses.join(', ')} WHERE id = $${params.length}`,
    params
  );

  // Clean up old uploaded cloud/local image after DB update succeeds
  if (uploadedImageUrl && current.image_url !== uploadedImageUrl) {
    void deleteImage(current.image_url);
  }

  return getResourceById(id, currentUser.id);
}

export async function deleteResource(id: string, currentUser: AuthenticatedUser): Promise<void> {
  const deletedImageUrl = await withTransaction(async (client) => {
    const res = await client.query<{ seller_id: string; status: string; image_url: string }>(
      'SELECT seller_id, status, image_url FROM academic_resources WHERE id = $1 FOR UPDATE',
      [id]
    );

    if (!res.rows[0]) {
      throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Academic resource listing not found.');
    }
    if (res.rows[0].seller_id !== currentUser.id && currentUser.role !== 'Admin') {
      throw new AppError(403, 'FORBIDDEN', 'Only the listing owner can delete this resource.');
    }
    if (res.rows[0].status === 'Reserved') {
      throw new AppError(
        409,
        'RESOURCE_RESERVED',
        'Cancel the active reservation before deleting this listing.'
      );
    }

    await client.query('DELETE FROM academic_resources WHERE id = $1', [id]);
    return res.rows[0].image_url;
  });

  // Clean up cloud/local image after DB deletion commits
  void deleteImage(deletedImageUrl);
}

/**
 * ACID Transactional Stock Lock + OTP Escrow Generation.
 * Uses PostgreSQL row-level locking (`SELECT ... FOR UPDATE`) to eliminate race conditions
 * when two juniors attempt to reserve the same single-unit physical item concurrently.
 */
export async function reserveResource(
  resourceId: string,
  buyer: AuthenticatedUser
): Promise<{ resource: ResourceDTO; reservationId: string; otpCode: string }> {
  const { reservationId, otpCode } = await withTransaction(async (client) => {
    const locked = await client.query<{ id: string; seller_id: string; status: string }>(
      'SELECT id, seller_id, status FROM academic_resources WHERE id = $1 FOR UPDATE',
      [resourceId]
    );

    const row = locked.rows[0];
    if (!row) {
      throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Academic resource listing not found.');
    }
    if (row.seller_id === buyer.id) {
      throw new AppError(400, 'SELF_RESERVATION_NOT_ALLOWED', 'You cannot reserve your own listing.');
    }
    if (row.status !== 'Available') {
      throw new AppError(
        409,
        'RESOURCE_UNAVAILABLE',
        `This item is currently ${row.status.toLowerCase()} and cannot be reserved.`
      );
    }

    const generatedOtp = String(crypto.randomInt(1000, 10000));

    await client.query(
      `UPDATE academic_resources SET status = 'Reserved', updated_at = NOW() WHERE id = $1`,
      [resourceId]
    );

    const insertedRes = await client.query<{ id: string }>(
      `INSERT INTO reservations (buyer_id, seller_id, item_type, item_id, otp_code, status)
       VALUES ($1, $2, 'Resource', $3, $4, 'Pending Handoff')
       RETURNING id`,
      [buyer.id, row.seller_id, resourceId, generatedOtp]
    );

    return {
      reservationId: insertedRes.rows[0].id,
      otpCode: generatedOtp,
    };
  });

  const resource = await getResourceById(resourceId, buyer.id);
  return { resource, reservationId, otpCode };
}

/**
 * Physical Handoff OTP Verification (Seller confirms in-person campus exchange).
 */
export async function verifyReservationOtp(
  reservationId: string,
  submittedOtp: string,
  currentUser: AuthenticatedUser
): Promise<ResourceDTO> {
  const resourceId = await withTransaction(async (client) => {
    const locked = await client.query<{
      id: string;
      seller_id: string;
      item_id: string;
      otp_code: string;
      status: string;
      seller_name: string;
    }>(
      `SELECT r.id, r.seller_id, r.item_id, r.otp_code, r.status, u.full_name AS seller_name
       FROM reservations r
       JOIN users u ON u.id = r.seller_id
       WHERE r.id = $1 AND r.item_type = 'Resource'
       FOR UPDATE OF r`,
      [reservationId]
    );

    const reservation = locked.rows[0];
    if (!reservation) {
      throw new AppError(404, 'RESERVATION_NOT_FOUND', 'Reservation record not found.');
    }
    if (reservation.seller_id !== currentUser.id && currentUser.role !== 'Admin') {
      throw new AppError(
        403,
        'ONLY_SELLER_CAN_VERIFY',
        `Only the seller (${reservation.seller_name}) can verify the handover OTP. Switch to their account in Sign In to test seller verification.`
      );
    }
    if (reservation.status !== 'Pending Handoff') {
      throw new AppError(
        409,
        'RESERVATION_NOT_PENDING',
        `Reservation is already ${reservation.status.toLowerCase()}.`
      );
    }

    const expectedBuf = Buffer.from(reservation.otp_code, 'utf-8');
    const submittedBuf = Buffer.from(submittedOtp, 'utf-8');
    const isMatch =
      expectedBuf.length === submittedBuf.length &&
      crypto.timingSafeEqual(expectedBuf, submittedBuf);

    if (!isMatch) {
      throw new AppError(400, 'INVALID_OTP', 'Incorrect OTP code. Please verify the 4-digit code with the buyer.');
    }

    await client.query(
      `UPDATE reservations
       SET status = 'Verified & Complete', verified_at = NOW()
       WHERE id = $1`,
      [reservationId]
    );

    await client.query(
      `UPDATE academic_resources
       SET status = 'Handed Over', updated_at = NOW()
       WHERE id = $1`,
      [reservation.item_id]
    );

    await syncOrderStatusForReservation(client, reservationId);

    return reservation.item_id;
  });

  return getResourceById(resourceId, currentUser.id);
}

/**
 * Cancels a pending reservation and atomically releases the item back to Available.
 */
export async function cancelReservation(
  reservationId: string,
  currentUser: AuthenticatedUser
): Promise<ResourceDTO> {
  const resourceId = await withTransaction(async (client) => {
    const locked = await client.query<{
      id: string;
      buyer_id: string;
      seller_id: string;
      item_id: string;
      status: string;
    }>(
      `SELECT id, buyer_id, seller_id, item_id, status
       FROM reservations
       WHERE id = $1 AND item_type = 'Resource'
       FOR UPDATE`,
      [reservationId]
    );

    const reservation = locked.rows[0];
    if (!reservation) {
      throw new AppError(404, 'RESERVATION_NOT_FOUND', 'Reservation record not found.');
    }

    const isParticipant =
      reservation.buyer_id === currentUser.id ||
      reservation.seller_id === currentUser.id ||
      currentUser.role === 'Admin';

    if (!isParticipant) {
      throw new AppError(403, 'FORBIDDEN', 'Only the reserving buyer or seller can cancel this reservation.');
    }

    if (reservation.status !== 'Pending Handoff') {
      throw new AppError(
        409,
        'RESERVATION_NOT_PENDING',
        `Cannot cancel a reservation with status "${reservation.status}".`
      );
    }

    await client.query(`UPDATE reservations SET status = 'Cancelled' WHERE id = $1`, [reservationId]);
    await client.query(
      `UPDATE academic_resources SET status = 'Available', updated_at = NOW() WHERE id = $1`,
      [reservation.item_id]
    );

    await syncOrderStatusForReservation(client, reservationId);

    return reservation.item_id;
  });

  return getResourceById(resourceId, currentUser.id);
}
