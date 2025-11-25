import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { randomUUID } from "crypto";
import { dirname, resolve } from "path";
import { config } from "./config";
import type { IngestionType, Profile, ProfileSummary } from "./types";

type Stored = Record<string, Profile>;

const loadProfiles = (): Stored => {
  try {
    const path = resolve(process.cwd(), config.dataFile);
    const raw = readFileSync(path, "utf-8");
    return JSON.parse(raw) as Stored;
  } catch {
    return {};
  }
};

const persistProfiles = (data: Stored) => {
  const path = resolve(process.cwd(), config.dataFile);
  const dir = dirname(path);
  mkdirSync(dir || ".", { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2), "utf-8");
};

const isExpired = (createdAt: string) => {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  return ageMs > config.retentionHours * 60 * 60 * 1000;
};

export const storeProfile = (input: {
  sanitizedText: string;
  summary: ProfileSummary;
  ingestionType: IngestionType;
  source?: string;
  meta?: Record<string, string | number>;
}): Profile => {
  const id = randomUUID();
  const profile: Profile = {
    id,
    createdAt: new Date().toISOString(),
    ingestionType: input.ingestionType,
    rawText: input.sanitizedText,
    textPreview: input.sanitizedText.slice(0, 280),
    source: input.source,
    summary: input.summary,
    meta: input.meta,
  };

  const profiles = loadProfiles();
  profiles[id] = profile;
  persistProfiles(profiles);
  return profile;
};

export const getProfile = (id: string) => {
  const profiles = loadProfiles();
  const profile = profiles[id];
  if (!profile) return undefined;
  if (isExpired(profile.createdAt)) {
    delete profiles[id];
    persistProfiles(profiles);
    return undefined;
  }
  return profile;
};

export const deleteProfile = (id: string) => {
  const profiles = loadProfiles();
  if (profiles[id]) {
    delete profiles[id];
    persistProfiles(profiles);
    return true;
  }
  return false;
};

export const cleanupExpired = () => {
  const profiles = loadProfiles();
  let dirty = false;
  for (const [id, profile] of Object.entries(profiles)) {
    if (isExpired(profile.createdAt)) {
      delete profiles[id];
      dirty = true;
    }
  }
  if (dirty) persistProfiles(profiles);
};
