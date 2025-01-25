import { Request, Response } from 'express';
import scraper from '../utils/scraper';
import { handleResponse, handleError } from '../utils/responseHandler';

export const getProfile = async (req: Request, res: Response) => {
  try {
    const { username } = req.body; // Accept data from the request body
    if (!username) {
      return res.status(400).json({ success: false, error: 'Username is required' });
    }

    const profile = await scraper.getProfile(username);
    handleResponse(res, profile, 'Fetched profile successfully');
  } catch (error) {
    handleError(res, error);
  }
};
