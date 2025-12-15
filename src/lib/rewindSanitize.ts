import type { RewindSummary } from "./rewind";
import { anonymizeText } from "./anonymize";

const redactForStorage = (text: string) => {
  const { sanitized } = anonymizeText(text, { redactNames: true });
  return sanitized.replace(/\b\d{4,}\b/g, "[number]");
};

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
      deepDive: {
        ...rewind.wrapped.deepDive,
        useMap: {
          ...rewind.wrapped.deepDive.useMap,
          topOpeners: rewind.wrapped.deepDive.useMap.topOpeners.map((o) => ({
            ...o,
            excerpt: null,
            evidence: [],
          })),
          topEndings: rewind.wrapped.deepDive.useMap.topEndings.map((e) => ({ ...e, evidence: [] })),
          ratios: {
            ...rewind.wrapped.deepDive.useMap.ratios,
            line: redactForStorage(rewind.wrapped.deepDive.useMap.ratios.line),
          },
        },
        signaturePrompts: {
          ...rewind.wrapped.deepDive.signaturePrompts,
          openingMoves: rewind.wrapped.deepDive.signaturePrompts.openingMoves.map((m) => ({
            ...m,
            phrase: redactForStorage(m.phrase),
          })),
          constraints: rewind.wrapped.deepDive.signaturePrompts.constraints.map((c) => ({
            ...c,
            label: redactForStorage(c.label),
            line: redactForStorage(c.line),
          })),
        },
        loops: rewind.wrapped.deepDive.loops.map((l) => ({
          ...l,
          observation: redactForStorage(l.observation),
          evidenceLine: redactForStorage(l.evidenceLine),
          evidence: [],
          cost: redactForStorage(l.cost),
          experiment: redactForStorage(l.experiment),
          successMetric: redactForStorage(l.successMetric),
        })),
        relationshipStyle: {
          ...rewind.wrapped.deepDive.relationshipStyle,
          primary: redactForStorage(rewind.wrapped.deepDive.relationshipStyle.primary),
          line: redactForStorage(rewind.wrapped.deepDive.relationshipStyle.line),
          roles: rewind.wrapped.deepDive.relationshipStyle.roles.map((r) => ({
            ...r,
            role: redactForStorage(r.role),
          })),
        },
        insights: rewind.wrapped.deepDive.insights.map((i) => ({
          ...i,
          title: redactForStorage(i.title),
          observation: redactForStorage(i.observation),
          evidence: {
            counts: i.evidence.counts.map(redactForStorage),
            excerpts: [],
            pointers: [],
          },
          interpretation: redactForStorage(i.interpretation),
          cost: redactForStorage(i.cost),
          experiment: redactForStorage(i.experiment),
          successMetric: redactForStorage(i.successMetric),
        })),
        actionPlan: {
          ...rewind.wrapped.deepDive.actionPlan,
          keepDoing: rewind.wrapped.deepDive.actionPlan.keepDoing.map(redactForStorage),
          adjust: rewind.wrapped.deepDive.actionPlan.adjust.map(redactForStorage),
          stopDoing: rewind.wrapped.deepDive.actionPlan.stopDoing.map(redactForStorage),
          promptTemplates: rewind.wrapped.deepDive.actionPlan.promptTemplates.map((t) => ({
            ...t,
            title: redactForStorage(t.title),
            template: redactForStorage(t.template),
          })),
        },
      },
      closingLine: redactForStorage(rewind.wrapped.closingLine),
    },
    topWord: rewind.topWord ? redactForStorage(rewind.topWord) : null,
    frequentPhrases: rewind.frequentPhrases.map((p) => ({ ...p, phrase: redactForStorage(p.phrase) })),
    nicknames: rewind.nicknames.map((p) => ({ ...p, phrase: redactForStorage(p.phrase) })),
  };
};
