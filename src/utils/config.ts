import { OLLAMA_ENDPOINT, OLLAMA_MODEL } from "./constants";

export const config = {
  endpoint: OLLAMA_ENDPOINT,
  model: OLLAMA_MODEL,
  weights: {
    clarity: 0.3,
    specificity: 0.3,
    context: 0.2,
    effort: 0.2,
  },
} as const;
