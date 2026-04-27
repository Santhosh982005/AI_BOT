import type { LegalKnowledgeItem } from "./legalKnowledge.ts";

export function retrieveRelevantContext(query: string, dataset: LegalKnowledgeItem[], limit = 3): LegalKnowledgeItem[] {
  const q = query.toLowerCase().trim();
  const words = q.split(/\s+/).filter(Boolean);

  return dataset
    .map((item) => {
      const promptText = item.prompt.toLowerCase();
      const tagText = item.tags.join(" ").toLowerCase();
      const combined = `${promptText} ${tagText}`;
      const score = promptText.includes(q)
        ? 2
        : words.some((word) => combined.includes(word))
        ? 1
        : 0;
      return { ...item, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ score: _score, ...item }) => item);
}
