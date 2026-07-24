import type { MemoryItemRecord } from "@/lib/repositories/types";

function terms(value: string) {
  const normalized = value.toLowerCase().replace(/\s+/g, "");
  const latin = normalized.match(/[a-z0-9][a-z0-9_-]{1,}/g) ?? [];
  const chinese = normalized.replace(/[^\u3400-\u9fff]/g, "");
  const bigrams = Array.from(
    { length: Math.max(0, chinese.length - 1) },
    (_, index) => chinese.slice(index, index + 2),
  );
  return new Set([...latin, ...bigrams]);
}

export function rankMemories(
  items: MemoryItemRecord[],
  query: string,
  options: { limit?: number; maxCharacters?: number } = {},
) {
  const queryTerms = terms(query);
  const now = Date.now();
  const scored = items.map((item, index) => {
    const itemTerms = terms(`${item.contextLabel}${item.content}`);
    let overlap = 0;
    for (const term of queryTerms) {
      if (itemTerms.has(term)) overlap += 1;
    }
    const ageDays = Math.max(
      0,
      (now - new Date(item.updatedAt).getTime()) / 86_400_000,
    );
    const recency = Math.max(0, 20 - Math.log2(ageDays + 1) * 4);
    const recentFloor = index < 4 ? 18 - index * 2 : 0;
    return {
      item,
      score:
        overlap * 18 +
        recency +
        recentFloor +
        Math.min(20, item.salience / 5),
    };
  });
  scored.sort((left, right) => right.score - left.score);

  const selected: MemoryItemRecord[] = [];
  let characters = 0;
  for (const { item } of scored) {
    const size = item.contextLabel.length + item.content.length;
    if (
      selected.length >= (options.limit ?? 12) ||
      characters + size > (options.maxCharacters ?? 6_000)
    ) {
      continue;
    }
    selected.push(item);
    characters += size;
  }
  return selected;
}

export function renderMemoryContext(items: MemoryItemRecord[]) {
  if (!items.length) return "目前没有可用的既往学习记录。";
  return items
    .map(
      (item, index) =>
        `${index + 1}. [${item.contextLabel}] ${item.content}`,
    )
    .join("\n");
}
