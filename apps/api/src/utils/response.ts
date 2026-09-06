import { Response } from 'express';
import { ApiResponse } from '@parkease/shared';

export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode: number = 200,
  meta?: ApiResponse['meta']
) => {
  const responsePayload: ApiResponse<T> = {
    success: true,
    message,
    data,
    meta,
  };
  return res.status(statusCode).json(responsePayload);
};

export const sendError = (
  res: Response,
  message: string,
  errorCode: string = 'BAD_REQUEST',
  statusCode: number = 400
) => {
  const responsePayload: ApiResponse = {
    success: false,
    message,
    errorCode,
  };
  return res.status(statusCode).json(responsePayload);
};
