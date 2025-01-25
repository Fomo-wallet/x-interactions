import { HintResponse } from "./types";

export function validateTweet(tweet: string): void {
  if (!tweet?.trim()) {
    throw new Error("Tweet cannot be empty");
  }
}

export function validateHintResponse(obj: unknown): obj is HintResponse {
  const response = obj as HintResponse;
  return (
    !!response &&
    typeof response.isHintRequest === "boolean" &&
    typeof response.confidence === "number" &&
    response.confidence >= 0 &&
    response.confidence <= 10 &&
    ["hint", "help", "guidance", "recommendation", "none"].includes(
      response.type
    ) &&
    typeof response.analysis === "string"
  );
}
