import { Request, Response } from "express";
import getScraper from "../utils/scraper";
import { handleResponse, handleError } from "../utils/responseHandler";
import { generateContentForPostingTweet } from "../utils/utility";
import {
  calculateHintScore,
  isHintRequest,
  scoreHintRequest,
} from "../utils/hint-analyzer";
import { promises as fs } from "fs";
import path from "path";
import { LeaderboardEntry, UserAnalysis } from "../utils/types";

const userScores = new Map();
const RATE_LIMIT = {
  requests: 300, // Twitter v2 API default rate limit
  windowMs: 15 * 60 * 1000, // 15 minutes
  waitTime: 60 * 1000, // Wait 1 minute when rate limited
};

const USERS_FILE = path.join(__dirname, "../data/users.json");
const ANALYSIS_FILE = path.join(__dirname, "../data/analysis.json");

export const getTweets = async (req: Request, res: Response) => {
  try {
    const { user, maxTweets } = req.body;

    if (!user) {
      return res
        .status(400)
        .json({ success: false, error: "User is required" });
    }

    const scraper = await getScraper();
    const tweets = [];
    for await (const tweet of scraper.getTweets(
      user,
      parseInt(maxTweets) || 2
    )) {
      tweets.push(tweet.text);
    }

    handleResponse(res, tweets, "Fetched tweets successfully");
  } catch (error) {
    handleError(res, error);
  }
};

export const getLatestTweet = async (req: Request, res: Response) => {
  try {
    const { user } = req.body;

    if (!user) {
      return res
        .status(400)
        .json({ success: false, error: "User is required" });
    }

    const scraper = await getScraper();
    const tweet = await scraper.getLatestTweet(user);

    handleResponse(res, tweet, "Fetched latest tweet successfully");
  } catch (error) {
    handleError(res, error);
  }
};

export const sendTweet = async (req: Request, res: Response) => {
  try {
    const {
      replyToTweetId,
      username,
      amount,
      contractAddress,
      betid,
      chainid,
    } = req.body;
    const uri = `https://fomo-wallet-frontend.vercel.app/${contractAddress}/${chainid}/${betid}`;

    if (!username || !amount || !contractAddress || !betid || !chainid) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["username", "amount", "contractAddress", "betid", "chainid"],
      });
    }

    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        error: "Amount must be a positive number",
      });
    }

    console.log("received amount:", amount);

    const prompt = `Create an exciting tweet announcing a betting competition. 
    Host: @${username}
    Prize Amount: $${amount}
    URI: ${uri}
    
    Make it engaging and encourage participation. 
    Mention it's a number betting game and include the prize amount.
    The One who decides the correct number will win the hidden assets.
    Dont forget to include the URI.
    The amount is not million dollars but only dollars.
    Also donot forget to mention the host @${username}.
    
    Add relevant hashtags like #Contest`;

    console.log("Generating tweet for prompt:", prompt);

    const content = await generateContentForPostingTweet(prompt);

    console.log("Generated content:", content);

    //post tweet
    const scraper = await getScraper();
    const result = await scraper.sendTweet(content, replyToTweetId);

    handleResponse(res, result, "Tweet sent successfully");
  } catch (error) {
    handleError(res, error);
  }
};

async function readJson<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(defaultValue, null, 2));
      return defaultValue;
    }
    throw error;
  }
}

async function writeJson<T>(filePath: string, data: T): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

export const analyzeTweets = async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const users = await readJson<
      Array<{ username: string; createdAt: string }>
    >(USERS_FILE, []);
    const existingAnalysis = await readJson<UserAnalysis[]>(ANALYSIS_FILE, []);
    const scraper = await getScraper();

    const results: UserAnalysis[] = [];

    for (const { username } of users) {
      const existingUser = existingAnalysis.find(
        (u) => u.username === username
      );

      if (
        existingUser &&
        Date.now() - existingUser.lastUpdated < 24 * 60 * 60 * 1000
      ) {
        results.push(existingUser);
        continue;
      }

      const tweets = [];
      console.log("User name: ", username);
      for await (const tweet of scraper.getTweets(username, 2)) {
        console.log(tweet);
        tweets.push(tweet.text);
      }

      const hintRequests = [];
      let totalScore = 0;
      let hintRequestCount = 0;

      for (const tweet of tweets) {
        // Check if tweet was previously analyzed
        const existingTweet = existingUser?.requests.find(
          (r: any) => r.tweet === tweet
        );
        if (existingTweet) {
          hintRequests.push(existingTweet);
          totalScore += existingTweet.score;
          hintRequestCount++;
          continue;
        }

        const hintCheck = await isHintRequest(tweet as string);
        if (hintCheck.isHintRequest && hintCheck.confidence >= 7) {
          const scores = await scoreHintRequest(tweet as string);
          const hintScore = calculateHintScore(scores);

          totalScore += hintScore;
          hintRequestCount++;
          hintRequests.push({ tweet, score: hintScore, hintCheck, scores });
        }
      }

      const finalScore =
        hintRequestCount > 0
          ? Math.round((totalScore / hintRequestCount) * 100) / 100
          : 0;

      results.push({
        username,
        score: finalScore,
        totalTweets: tweets.length,
        hintRequests: hintRequestCount,
        lastUpdated: Date.now(),
        requests: hintRequests,
      });
    }

    // Update analysis file
    await writeJson(ANALYSIS_FILE, results);

    // Generate leaderboard
    const leaderboard: LeaderboardEntry[] = results
      .sort((a, b) => b.score - a.score)
      .map((user, index) => ({
        ...user,
        rank: index + 1,
      }));

    const endTime = Date.now();

    res.json({
      leaderboard,
      totalUsers: users.length,
      analysisTime: endTime - startTime,
    });
  } catch (error: any) {
    console.error("Analysis error:", error);

    const errorResponse = {
      error: "Failed to analyze tweets",
      details: error.message,
      type: error.name,
      timestamp: new Date().toISOString(),
      retry: error.message.includes("429")
        ? {
            suggested_wait: RATE_LIMIT.waitTime,
            unit: "milliseconds",
          }
        : null,
    };

    const statusCode = error.message.includes("429")
      ? 429
      : error.message.includes("not found")
      ? 404
      : 500;

    res.status(statusCode).json(errorResponse);
  }
};
