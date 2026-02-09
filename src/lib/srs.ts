function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000)
}

const LEARNING_STEPS = [1, 3]

type SrsInput = {
  now: Date
  wasCorrect: boolean
  intervalDays: number
  easeFactor: number
  reps: number
  lapses: number
  successStreak: number
  state: "new" | "learning" | "review" | "relearning"
}

function clampEase(value: number): number {
  return Math.min(2.5, Math.max(1.3, value))
}

export function computeNextSrs({
  now,
  wasCorrect,
  intervalDays,
  easeFactor,
  reps,
  lapses,
  successStreak,
  state
}: SrsInput): {
  nextDueAt: Date
  intervalDays: number
  easeFactor: number
  reps: number
  lapses: number
  successStreak: number
  state: "new" | "learning" | "review" | "relearning"
} {
  if (!wasCorrect) {
    return {
      nextDueAt: addDays(now, 1),
      intervalDays: 1,
      easeFactor: clampEase(easeFactor - 0.2),
      reps,
      lapses: lapses + 1,
      successStreak: 0,
      state: "relearning"
    }
  }

  const nextReps = reps + 1
  const nextSuccessStreak = successStreak + 1
  const nextEase = clampEase(easeFactor + 0.1)

  if (state === "new" || state === "learning" || state === "relearning") {
    const stepIndex = Math.min(nextSuccessStreak - 1, LEARNING_STEPS.length - 1)
    const nextInterval = LEARNING_STEPS[stepIndex]
    return {
      nextDueAt: addDays(now, nextInterval),
      intervalDays: nextInterval,
      easeFactor: nextEase,
      reps: nextReps,
      lapses,
      successStreak: nextSuccessStreak,
      state: nextSuccessStreak >= LEARNING_STEPS.length ? "review" : "learning"
    }
  }

  const nextInterval = Math.max(
    1,
    Math.round(Math.max(1, intervalDays) * nextEase)
  )

  return {
    nextDueAt: addDays(now, nextInterval),
    intervalDays: nextInterval,
    easeFactor: nextEase,
    reps: nextReps,
    lapses,
    successStreak: nextSuccessStreak,
    state: "review"
  }
}
