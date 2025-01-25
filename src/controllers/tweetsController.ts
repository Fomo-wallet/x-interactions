import { Request, Response } from "express";
import getScraper from "../utils/scraper";
import { handleResponse, handleError } from "../utils/responseHandler";
import { generateContentForPostingTweet } from "../utils/utility";

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
      parseInt(maxTweets) || 10
    )) {
      tweets.push(tweet);
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
