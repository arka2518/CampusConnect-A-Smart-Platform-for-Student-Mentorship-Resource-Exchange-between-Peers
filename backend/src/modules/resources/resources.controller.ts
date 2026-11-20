import { NextFunction, Request, Response } from 'express';
import { uploadImage } from '../../services/storage.service';
import { estimateFairPrice } from './pricing.service';
import {
  cancelReservation,
  createResource,
  deleteResource,
  getResourceById,
  listMyResources,
  listResources,
  reserveResource,
  updateResource,
  verifyReservationOtp,
} from './resources.service';
import {
  CreateResourceInput,
  EstimatePriceInput,
  ListResourcesQuery,
  UpdateResourceInput,
} from './resources.schema';

function getParamId(req: Request): string {
  return Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
}

export async function handleListResources(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const filters = req.query as unknown as ListResourcesQuery;
    const resources = await listResources(filters, req.user?.id);
    res.json({
      success: true,
      count: resources.length,
      data: resources,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleListMyResources(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await listMyResources(req.user!.id);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleGetResource(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const resource = await getResourceById(getParamId(req), req.user?.id);
    res.json({
      success: true,
      data: resource,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleCreateResource(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = req.body as CreateResourceInput;
    const uploadedImageUrl = req.file ? await uploadImage(req.file, 'resources') : undefined;
    const created = await createResource(input, req.user!, uploadedImageUrl);
    res.status(201).json({
      success: true,
      data: created,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleUpdateResource(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const uploadedImageUrl = req.file ? await uploadImage(req.file, 'resources') : undefined;
    const updated = await updateResource(
      getParamId(req),
      req.body as UpdateResourceInput,
      req.user!,
      uploadedImageUrl
    );
    res.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleDeleteResource(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = getParamId(req);
    await deleteResource(id, req.user!);
    res.json({
      success: true,
      data: { id, deleted: true },
    });
  } catch (err) {
    next(err);
  }
}

export async function handleEstimatePrice(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const estimate = await estimateFairPrice(req.body as EstimatePriceInput);
    res.json({
      success: true,
      data: estimate,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleReserveResource(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await reserveResource(getParamId(req), req.user!);
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleVerifyOtp(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { otp_code } = req.body as { otp_code: string };
    const resource = await verifyReservationOtp(getParamId(req), otp_code, req.user!);
    res.json({
      success: true,
      data: resource,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleCancelReservation(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const resource = await cancelReservation(getParamId(req), req.user!);
    res.json({
      success: true,
      data: resource,
    });
  } catch (err) {
    next(err);
  }
}
