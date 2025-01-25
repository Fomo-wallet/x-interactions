import { config } from "./config";

export async function fetchOllama<T>(prompt: string): Promise<T> {
  const response = await fetch(`${config.endpoint}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: config.model,
      prompt,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  const jsonMatch = data.response.match(/\{[\s\S]*\}/)?.[0];

  if (!jsonMatch) {
    throw new Error("No JSON found in response");
  }

  return JSON.parse(jsonMatch);
}
