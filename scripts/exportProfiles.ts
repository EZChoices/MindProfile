import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const rawUrl = process.env.DATABASE_URL;
if (!rawUrl) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const connectionString = rawUrl.replace(/^prisma\+/, "");
const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const profiles = await prisma.profile.findMany({
    orderBy: { createdAt: "asc" },
  });

  for (const p of profiles) {
    const row = {
      id: p.id,
      createdAt: p.createdAt,
      sourceMode: p.sourceMode,
      inputCharCount: p.inputCharCount,
      model: p.model,
      promptVersion: p.promptVersion,
      rawText: p.rawText,
      profile: {
        thinkingStyle: p.thinkingStyle,
        communicationStyle: p.communicationStyle,
        strengths: p.strengthsJson,
        blindSpots: p.blindSpotsJson,
        suggestedWorkflows: p.suggestedJson,
        confidence: p.confidence,
      },
    };
    process.stdout.write(JSON.stringify(row) + "\n");
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
