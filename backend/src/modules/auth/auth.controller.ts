import { NextFunction, Request, Response } from 'express';
import { UpdateProfileInput } from './auth.schema';
import { formatUserProfile, updateStudentProfile } from './auth.service';

export function handleGetMe(req: Request, res: Response): void {
  res.json({
    success: true,
    data: formatUserProfile(req.user!),
  });
}

export async function handleUpdateProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const updated = await updateStudentProfile(
      req.user!.id,
      req.body as UpdateProfileInput,
      req.user!.isDemoAccount
    );
    res.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}
