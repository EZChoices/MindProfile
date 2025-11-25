export interface Profile {
  id: string;
  thinkingStyle: string;
  communicationStyle: string;
  strengths: string[];
  blindSpots: string[];
  suggestedWorkflows: string[];
  confidence: "low" | "medium" | "high";
}
