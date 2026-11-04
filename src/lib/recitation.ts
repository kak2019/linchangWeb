export type RecitationText = {
  id: string;
  title: string;
  author: string;
  kind: "prose" | "poem";
  text: string;
  source?: string;
  note?: string;
};

export const MAX_RECITATION_LENGTH = 12000;

export function recitationParagraphs(text: string) {
  return text.replace(/\r\n?/g, "\n").split(/\n+/).map(line => line.trim()).filter(Boolean);
}

export function recitationCharacters(text: string) {
  return Array.from(text).flatMap((character, index) => /[\p{L}\p{N}]/u.test(character) ? [index] : []);
}

/** A seeded shuffle keeps the first server and browser render identical. */
export function recitationMask(text: string, percentage: number, seed: number, previous: readonly number[] = []) {
  const candidates = recitationCharacters(text);
  if (!candidates.length) return [];
  const ratio = Number.isFinite(percentage) ? Math.min(90, Math.max(10, percentage)) : 25;
  const count = Math.min(candidates.length === 1 ? 1 : candidates.length - 1, Math.max(1, Math.round(candidates.length * ratio / 100)));
  let state = seed >>> 0;
  const random = () => {
    state += 0x6D2B79F5;
    let value = Math.imul(state ^ state >>> 15, 1 | state);
    value ^= value + Math.imul(value ^ value >>> 7, 61 | value);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  const selected = candidates.slice(0, count);
  // A fresh round must not accidentally repeat the same set of blanks.
  const before = new Set(previous);
  if (before.size === count && selected.every(index => before.has(index)) && count < candidates.length) {
    selected[count - 1] = candidates[count];
  }
  return selected.sort((a, b) => a - b);
}
