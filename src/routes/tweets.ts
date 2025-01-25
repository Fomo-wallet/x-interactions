import { Router } from "express";
import {
  getTweets,
  getLatestTweet,
  sendTweet,
  analyzeTweets,
} from "../controllers/tweetsController";
import { promises as fs } from "fs";
import { readUsers } from "../utils/utility";
import path from "path";
import { User } from "../utils/types";

const router = Router();
const dataPath = path.join(__dirname, "../data/users.json");

router.post("/tweets", getTweets);
router.post("/tweets/latest", getLatestTweet);
router.post("/tweet/send", sendTweet);

router.get("/analyze", analyzeTweets);

router.post("/users", async (req, res) => {
  try {
    const { username } = req.body;

    if (!username || typeof username !== "string") {
      return res.status(400).json({ error: "Valid username required" });
    }

    const users = await readUsers();

    if (users.some((user) => user.username === username)) {
      return res.status(409).json({ error: "Username already exists" });
    }

    const newUser: User = {
      username,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    await fs.writeFile(dataPath, JSON.stringify(users, null, 2));

    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error storing username:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/users", async (req, res) => {
  try {
    const users = await readUsers();
    res.json(users);
  } catch (error) {
    console.error("Error reading users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
