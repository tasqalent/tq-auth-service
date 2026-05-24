import type { Request, Response, NextFunction } from 'express';
import type { ObjectSchema } from 'joi';
import { ERROR_CODES, HTTP_STATUS, errorResponse } from '@tasqalent/shared';

export function validate(schema: ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      const details = error.details.map(d => d.message);
      errorResponse(
        res,
        ERROR_CODES.VALIDATION_ERROR,
        'Validation failed',
        HTTP_STATUS.BAD_REQUEST,
        details
      );
    }
    req.body = value;
    next();
  };
}
