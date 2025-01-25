import { Router } from 'express';
import { getTweets, getLatestTweet, sendTweet } from '../controllers/tweetsController';

const router = Router();

router.post('/tweets', getTweets);
router.post('/tweets/latest', getLatestTweet);
router.post('/tweet/send', sendTweet);

export default router;
