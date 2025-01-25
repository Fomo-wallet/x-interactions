import { Response } from 'express';

export const handleResponse = (res: Response, data: any, message: string) => {
  res.status(200).json({ success: true, message, data });
};

export const handleError = (res: Response, error: any) => {
  console.error(error);
  const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
  res.status(500).json({ success: false, error: errorMessage });
};
