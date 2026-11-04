import { poetryPairs, type PoetryDifficulty, type PoetryPair } from "./poetry-question-bank";
export type { PoetryDifficulty } from "./poetry-question-bank";
export type PoetryDirection = "next" | "previous" | "mixed";
export type PoetryQuestion = PoetryPair & { direction: Exclude<PoetryDirection, "mixed">; answer: string; accepted: string[]; options: string[] };
export type PoetryResult = { submitted: string; correct: boolean; assisted: boolean; skipped: boolean; points: number };

export const poetryDifficulties: { id: PoetryDifficulty; title: string; caption: string; description: string }[] = [
  { id: "easy", title: "入门", caption: "五言 · 四选一", description: "从熟悉的五言诗开始，选出相接的那一句。" },
  { id: "medium", title: "进阶", caption: "七言 · 自己写", description: "看到篇目与作者，试着默写相接的诗句。" },
  { id: "hard", title: "挑战", caption: "名篇 · 藏出处", description: "唐诗宋词混合出题，答题前不显示篇目与作者。" },
];

export function normalizePoetryAnswer(value: string) {
  return value.normalize("NFKC").replace(/[\p{P}\p{S}\s]/gu, "");
}

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let value = Math.imul(state ^ state >>> 15, 1 | state);
    value ^= value + Math.imul(value ^ value >>> 7, 61 | value);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

function shuffled<T>(values: readonly T[], random: () => number) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function createPoetryRound(difficulty: PoetryDifficulty, direction: PoetryDirection, seed: number): PoetryQuestion[] {
  const random = seededRandom(seed);
  const pool = poetryPairs.filter(pair => pair.difficulty === difficulty);
  return shuffled(pool, random).slice(0, 10).map(pair => {
    const actualDirection = direction === "mixed" ? random() < .5 ? "next" : "previous" : direction;
    const answer = actualDirection === "next" ? pair.lower : pair.upper;
    const accepted = [answer, ...(actualDirection === "next" ? pair.lowerVariants : pair.upperVariants)];
    const acceptedSet = new Set(accepted.map(normalizePoetryAnswer));
    const distractors = [...new Set(pool.map(item => actualDirection === "next" ? item.lower : item.upper))].filter(value => !acceptedSet.has(normalizePoetryAnswer(value)));
    const options = shuffled([answer, ...shuffled(distractors, random).slice(0, 3)], random);
    return { ...pair, direction: actualDirection, answer, accepted, options };
  });
}

export function gradePoetryAnswer(question: PoetryQuestion, submitted: string, assisted = false, skipped = false): PoetryResult {
  const normalized = normalizePoetryAnswer(submitted);
  const correct = !skipped && Boolean(normalized) && question.accepted.some(answer => normalizePoetryAnswer(answer) === normalized);
  return { submitted: submitted.trim(), correct, assisted, skipped, points: correct ? assisted ? 5 : 10 : 0 };
}
