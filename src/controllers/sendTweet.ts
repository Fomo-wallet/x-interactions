import { Request, Response } from 'express';
import getScraper from '../utils/scraper';
import { handleResponse, handleError } from '../utils/responseHandler';

export const sendTweet = async (req: Request, res: Response) => {
  try {
    const { text, replyToTweetId, media } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, error: 'Tweet text is required' });
    }

    // Convert media from base64 (if provided)
    const mediaData = media?.map((item: { data: string; mediaType: string }) => ({
      data: Buffer.from(item.data, 'base64'),
      mediaType: item.mediaType,
    }));

    const scraper = await getScraper();
    const result = await scraper.sendTweet(text, replyToTweetId, mediaData);

    handleResponse(res, result, 'Tweet sent successfully');
  } catch (error) {
    handleError(res, error);
  }
};

