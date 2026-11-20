import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';

type ValidationTarget = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[target]);
      (req as unknown as Record<string, unknown>)[target] = parsed;
      next();
    } catch (err) {
      next(err);
    }
  };
}
