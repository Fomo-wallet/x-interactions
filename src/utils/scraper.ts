import { Scraper } from 'agent-twitter-client';
import fs from 'fs';
import path from 'path';

// Define the cookie file path
const COOKIE_FILE_PATH = path.join(__dirname, 'cookies.json');

/**
 * Get or create a scraper instance.
 * - If cookies exist and are valid, use them.
 * - Otherwise, log in and cache new cookies.
 */
const getScraper = async () => {
  const scraper = new Scraper();


  // Check if the scraper is logged in
  const isLoggedIn = await scraper.isLoggedIn();
  if (!isLoggedIn) {
    console.log('Not logged in. Logging in with credentials...');
    await scraper.login(
      process.env.TWITTER_USERNAME || '',
      process.env.TWITTER_PASSWORD || '',
      process.env.TWITTER_EMAIL || '',
      process.env.TWITTER_API_KEY || '',
      process.env.TWITTER_API_SECRET_KEY || '',
      process.env.TWITTER_ACCESS_TOKEN || '',
      process.env.TWITTER_ACCESS_TOKEN_SECRET || ''
    );
  } else {
    console.log('Scraper is already logged in.');
  }

  return scraper;
};

export default getScraper;
