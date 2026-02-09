function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000)
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000)
}

const SCHEDULE_DAYS = [1, 3, 7, 14, 30, 60, 120, 240]

export function computeNextSrs({
  now,
  wasCorrect,
  previousStreak
}: {
  now: Date
  wasCorrect: boolean
  previousStreak: number
}): { nextDueAt: Date; nextStreak: number } {
  if (!wasCorrect) {
    return {
      nextStreak: 0,
      nextDueAt: addMinutes(now, 10)
    }
  }

  const nextStreak = Math.max(0, previousStreak) + 1
  const days =
    SCHEDULE_DAYS[Math.min(nextStreak - 1, SCHEDULE_DAYS.length - 1)]

  return {
    nextStreak,
    nextDueAt: addDays(now, days)
  }
}
