export type SourceMode = "text" | "url" | "screenshots";

export interface Profile {
  id: string;
  thinkingStyle: string;
  communicationStyle: string;
  strengths: string[];
  blindSpots: string[];
  suggestedWorkflows: string[];
  confidence: "low" | "medium" | "high";
  // Optional meta fields returned by the backend
  sourceMode?: SourceMode;
  inputCharCount?: number;
  model?: string;
  promptVersion?: string;
  createdAt?: string;
  inputSourceHost?: string | null;
  resonance?: "positive" | "mixed" | "negative" | null;
  feedbackText?: string | null;
  feedbackAt?: string | null;
  mindCard?: import("./mindCard").MindCard | null;
}

export type Tier = "first_impression" | "building_profile" | "full_profile";
