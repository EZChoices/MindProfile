MindProfile
===========

MindProfile is a Next.js + TypeScript web app that ingests AI chat conversations and produces a "mind profile": thinking style, communication style, strengths, blind spots, usage patterns, and suggested workflows.

What's included
---------------
- Landing page that explains the product and ingestion levels.
- Analyze page for Level 1 intake: share link, paste text, or upload screenshots.
- Result page that renders a shareable profile with strengths, blind spots, usage patterns, and anonymized sample text.
- Backend routes for ingestion (`/api/ingest/link`, `/api/ingest/text`, `/api/ingest/screenshot`) plus profile retrieval and deletion (`/api/profile/:id`).
- Pipeline: scraper (for shared URLs), OCR (OpenAI vision if API key set; stub fallback), anonymizer, profiler (OpenAI model if key set; heuristic fallback), and file-backed storage with retention.

Running locally
---------------
```bash
npm install
npm run dev
# visit http://localhost:3000
```

Environment
-----------
- `OPENAI_API_KEY` (optional) — enables LLM profiling + vision OCR.
- `OPENAI_MODEL` (optional) — defaults to `gpt-4o-mini`.
- `OPENAI_VISION_MODEL` (optional) — defaults to `gpt-4o-mini`.
- `MINDPROFILE_DATA_FILE` (optional) — defaults to `.data/profiles.json`.
- `MINDPROFILE_RETENTION_HOURS` (optional) — defaults to `24`.

API quick reference
-------------------
- `POST /api/ingest/link` — `{ url: string }`
- `POST /api/ingest/text` — `{ text: string }`
- `POST /api/ingest/screenshot` — `FormData` with one or more `files` (images)
- `GET /api/profile/:id` — returns the stored profile JSON
- `DELETE /api/profile/:id` — deletes the stored profile JSON

Notes
-----
- Text is anonymized before storage. Profiles persist to a JSON file with a retention window.
- OCR uses OpenAI vision if available; otherwise falls back to a stub.
- Profiling uses OpenAI if available; otherwise falls back to heuristic scoring.
