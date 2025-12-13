import type { RewindSummary } from "./rewind";

export const sanitizeRewindForStorage = (rewind: RewindSummary): RewindSummary => {
  const safeHighlights = rewind.wrapped.lifeHighlights.map((h) => {
    if (h.type === "travel") {
      return {
        ...h,
        title: "Trip planning",
        line: "You planned a trip like it mattered.",
        excerpt: null,
      };
    }
    return { ...h, excerpt: null };
  });

  return {
    ...rewind,
    wrapped: {
      ...rewind.wrapped,
      lifeHighlights: safeHighlights,
      rabbitHoles: rewind.wrapped.rabbitHoles.map((h) => ({ ...h, excerpt: null })),
      bestMoments: rewind.wrapped.bestMoments.map((m) => ({ ...m, excerpt: null })),
    },
  };
};

