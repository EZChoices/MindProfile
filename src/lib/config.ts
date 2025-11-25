export const config = {
  retentionHours: Number(process.env.MINDPROFILE_RETENTION_HOURS ?? 24),
  dataFile: process.env.MINDPROFILE_DATA_FILE ?? ".data/profiles.json",
  openAiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  openAiVisionModel: process.env.OPENAI_VISION_MODEL ?? "gpt-4o-mini",
};
