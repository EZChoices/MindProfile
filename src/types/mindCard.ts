export interface BrainScores {
  reasoning: number;
  curiosity: number;
  structure: number;
  emotionalAttunement: number;
}

export interface BigFiveScores {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

export interface MBTIGuess {
  type: string;
  confidence: "low" | "medium" | "high";
  blurb: string;
}

export interface LoveLanguageGuess {
  primary: string;
  secondary?: string;
  blurb: string;
}

export interface RoleArchetypes {
  primaryArchetype: string;
  alternativeArchetypes: string[];
  suggestedRoles: string[];
  blurb: string;
}

export interface BrainIndex {
  overall: number;
  explanation: string;
}

export interface MindCard {
  archetypeName: string;
  archetypeTagline: string;
  brainScores: BrainScores;
  bigFive: BigFiveScores;
  mbti: MBTIGuess;
  loveLanguage: LoveLanguageGuess;
  roles: RoleArchetypes;
  brainIndex: BrainIndex;
}
