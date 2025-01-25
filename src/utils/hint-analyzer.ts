import { fetchOllama } from "./api";
import { config } from "./config";
import { HintResponse, HintScore } from "./types";
import { validateHintResponse, validateTweet } from "./validators";

export async function isHintRequest(tweet: string): Promise<HintResponse> {
  try {
    validateTweet(tweet);

    const prompt = `Analyze if this tweet is requesting hints, help, or guidance.
  Tweet: "${tweet.replace(/"/g, '\\"')}"
  
  Respond ONLY with a valid JSON object in this exact format:
  {
      "isHintRequest": boolean,
      "confidence": number (0-10),
      "type": "hint" | "help" | "guidance" | "recommendation" | "none",
      "analysis": "brief explanation"
  }`;

    const response = await fetchOllama<HintResponse>(prompt);

    if (!validateHintResponse(response)) {
      throw new Error("Invalid response structure");
    }

    return response;
  } catch (error) {
    console.error("Error analyzing hint request:", error);
    return {
      isHintRequest: false,
      confidence: 0,
      type: "none",
      analysis:
        error instanceof Error ? error.message : "Failed to analyze tweet",
    };
  }
}

export async function scoreHintRequest(tweet: string): Promise<HintScore> {
  try {
    validateTweet(tweet);

    const prompt = `Score this hint request tweet:
  Tweet: "${tweet}"
  
  Evaluate:
  1. Clarity of the request
  2. Specificity of what help is needed
  3. Context provided
  4. Effort in explaining the need
  
  Respond only with this JSON format:
  {
      "clarity": 0-10,
      "specificity": 0-10,
      "context": 0-10,
      "effort": 0-10,
      "explanation": "brief explanation of scores"
  }`;

    return await fetchOllama<HintScore>(prompt);
  } catch (error) {
    console.error("Error scoring hint request:", error);
    return {
      clarity: 5,
      specificity: 5,
      context: 5,
      effort: 5,
      explanation:
        error instanceof Error ? error.message : "Failed to score hint request",
    };
  }
}

export function calculateHintScore(scores: HintScore): number {
  const { weights } = config;

  return (
    Math.round(
      (scores.clarity * weights.clarity +
        scores.specificity * weights.specificity +
        scores.context * weights.context +
        scores.effort * weights.effort) *
        100
    ) / 100
  );
}

export async function analyzeTweet(tweet: string) {
  const isHint = await isHintRequest(tweet);
  if (isHint.isHintRequest) {
    const scores = await scoreHintRequest(tweet);
    const finalScore = calculateHintScore(scores);
    return { isHint, scores, finalScore };
  }
  return { isHint };
}
