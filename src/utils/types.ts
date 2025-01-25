export interface HintResponse {
  isHintRequest: boolean;
  confidence: number;
  type: "hint" | "help" | "guidance" | "recommendation" | "none";
  analysis: string;
}

export interface HintScore {
  clarity: number;
  specificity: number;
  context: number;
  effort: number;
  explanation: string;
}

export interface User {
  username: string;
  createdAt: string;
}

export interface UserAnalysis {
  username: string;
  score: number;
  totalTweets: number;
  hintRequests: number;
  lastUpdated: number;
  requests: any;
}

export interface LeaderboardEntry extends UserAnalysis {
  rank: number;
}
