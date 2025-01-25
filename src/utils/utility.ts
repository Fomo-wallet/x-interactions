import { OLLAMA_ENDPOINT, OLLAMA_MODEL } from "./constants";
import { User } from "./types";
import { promises as fs } from "fs";
import path from "path";

const dataPath = path.join(__dirname, "../data/users.json");

export async function generateContentForPostingTweet(prompt: string) {
  try {
    const systemPrompt = `You are a social media expert crafting engaging tweets. 
                Your task is to write ONE short, impactful tweet.
                Rules:
                - Keep it under 280 characters
                - Be concise and engaging
                - Include relevant hashtags when appropriate
                - Don't use emojis unless specifically requested
                - Focus on value and clarity
                
                Remember: Write ONLY the tweet content, nothing else.`;

    const response = await fetch(`${OLLAMA_ENDPOINT}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: `${systemPrompt}\n\nTopic to tweet about: ${prompt}\n\nTweet:`,
        stream: false,
        options: {
          temperature: 0.7,
          top_k: 50,
          top_p: 0.7,
          max_tokens: 300,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    let content = data.response
      .trim()
      .replace(/^["']|["']$/g, "")
      .replace(/^Tweet:\s*/i, "");

    if (content.length > 280) {
      content = content.substring(0, 277) + "...";
    }

    return content;
  } catch (error) {
    console.error("Error generating content with Llama:", error);
    throw error;
  }
}

export async function readUsers(): Promise<User[]> {
  try {
    const data = await fs.readFile(dataPath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      await fs.mkdir(path.dirname(dataPath), { recursive: true });
      await fs.writeFile(dataPath, "[]");
      return [];
    }
    throw error;
  }
}
