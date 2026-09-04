import type { TestQuestion } from "../seed-data/mock-data";

/**
 * Порт скоринга из `submitAttempt` (store.tsx) — играет роль `common/domain/test-scoring.ts`
 * будущего бэкенда (BACKEND.md §6): `multiple` — точное совпадение множеств правильных и
 * выбранных вариантов; `score = round(correct/total*100)`.
 */
export function scoreAttempt(
  questions: TestQuestion[],
  answers: Record<string, string[]>,
): { correctCount: number; total: number; score: number } {
  const correctCount = questions.reduce((sum, q) => {
    const correctIds = q.options
      .filter((o) => o.isCorrect)
      .map((o) => o.id)
      .sort();
    const givenIds = [...(answers[q.id] ?? [])].sort();
    const isCorrect =
      correctIds.length === givenIds.length && correctIds.every((id, i) => id === givenIds[i]);
    return sum + (isCorrect ? 1 : 0);
  }, 0);
  const total = questions.length;
  const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  return { correctCount, total, score };
}
