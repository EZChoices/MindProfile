import type { RewindSummary } from "./rewind";

export const sanitizeRewindForStorage = (rewind: RewindSummary): RewindSummary => {
  return {
    ...rewind,
    conversations: rewind.conversations.map((c) => ({
      ...c,
      conversationId: null,
      evidenceSnippets: [],
    })),
    wrapped: {
      ...rewind.wrapped,
      projects: rewind.wrapped.projects.map((p) => ({
        ...p,
        projectLabelPrivate: null,
        whatYouBuiltPrivate: null,
        evidence: [],
      })),
      bossFights: rewind.wrapped.bossFights.map((b) => ({
        ...b,
        evidence: [],
      })),
      trips: {
        tripCount: rewind.wrapped.trips.tripCount,
        topTrips: rewind.wrapped.trips.topTrips.map((t) => ({
          ...t,
          destination: null,
          titlePrivate: null,
          excerpt: null,
          evidence: [],
        })),
      },
      rabbitHoles: rewind.wrapped.rabbitHoles.map((h) => ({ ...h, excerpt: null, evidence: [] })),
      lifeHighlights: rewind.wrapped.lifeHighlights.map((h) => ({
        ...h,
        titlePrivate: null,
        excerpt: null,
        evidence: [],
      })),
      bestMoments: rewind.wrapped.bestMoments.map((m) => ({ ...m, excerpt: null, evidence: [] })),
    },
  };
};
