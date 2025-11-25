export type IngestionType = "link" | "text" | "screenshot";

export interface ProfileSummary {
  headline: string;
  thinkingStyle: string;
  communicationStyle: string;
  strengths: string[];
  blindSpots: string[];
  usagePatterns: string[];
  recommendations: string[];
  confidence: number;
}

export interface Profile {
  id: string;
  createdAt: string;
  ingestionType: IngestionType;
  rawText: string;
  textPreview: string;
  source?: string;
  summary: ProfileSummary;
  meta?: Record<string, string | number>;
}
