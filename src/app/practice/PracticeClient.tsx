"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import Link from "next/link"

import { computeNextSrs } from "@/lib/srs"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { normalizeForExactMatch } from "@/lib/text"

export type Mode = "srs" | "streak"
export type Direction = "fr-ko" | "ko-fr"

type CardRow = {
  id: string
  direction: "ko_fr" | "fr_ko"
  interval_days: number
  ease_factor: number
  reps: number
  lapses: number
  success_streak: number
  state: "new" | "learning" | "review" | "relearning"
  due_at: string
  note: {
    korean: string
    french: string
  } | null
}

type CardRowRaw = Omit<CardRow, "note"> & {
  note: { korean: string; french: string }[] | null
}

function mapCardRows(raw: CardRowRaw[] | null): CardRow[] {
  if (!raw) return []
  return raw.map((row) => ({
    ...row,
    note: Array.isArray(row.note) ? row.note[0] ?? null : row.note ?? null
  }))
}

type Props = {
  options: {
    mode: Mode
  }
}

function formatUnknownError(value: unknown): string {
  if (value instanceof Error) return value.message
  if (typeof value === "string") return value
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function getPrompt(card: CardRow, dir: Direction): string {
  if (!card.note) return ""
  return dir === "fr-ko" ? card.note.french : card.note.korean
}

function getExpected(card: CardRow, dir: Direction): string {
  if (!card.note) return ""
  return dir === "fr-ko" ? card.note.korean : card.note.french
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = result[i]
    result[i] = result[j]
    result[j] = temp
  }
  return result
}

export default function PracticeClient({ options }: Props) {
  const { mode } = options
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [cards, setCards] = useState<CardRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState("")
  const [showExpected, setShowExpected] = useState(false)
  const [autoResult, setAutoResult] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, boolean>>({})
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(90)
  const [timeExpired, setTimeExpired] = useState(false)
  const [finishReady, setFinishReady] = useState(false)
  const [finished, setFinished] = useState(false)
  const [retryMode, setRetryMode] = useState(false)
  const [retryResults, setRetryResults] = useState<Record<string, boolean>>({})

  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    try {
      setSupabase(getSupabaseBrowserClient())
    } catch (e) {
      setError(formatUnknownError(e))
      setSupabase(null)
    }
  }, [])

  const current = cards[index] ?? null
  const dir: Direction =
    current?.direction === "ko_fr" ? "ko-fr" : "fr-ko"
  const prompt = current ? getPrompt(current, dir) : ""
  const expected = current ? getExpected(current, dir) : ""
  const canSpeak =
    !!current &&
    ((dir === "fr-ko" && current.success_streak < 1) || dir === "ko-fr")

  const speakKorean = useCallback(() => {
    if (!current?.note?.korean) return
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return
    const utterance = new SpeechSynthesisUtterance(current.note.korean)
    utterance.lang = "ko-KR"
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }, [current])

  const loadCards = useCallback(async () => {
    if (!supabase) return

    setLoading(true)
    setError(null)
    setSaveError(null)
    setIndex(0)
    setAnswer("")
    setShowExpected(false)
    setAutoResult(null)
    setResults({})
    setScore(0)
    setTimeLeft(90)
    setTimeExpired(false)
    setFinishReady(false)
    setFinished(false)
    setRetryMode(false)
    setRetryResults({})

    try {
      const nowIso = new Date().toISOString()
      const limit = 200
      if (mode === "streak") {
        const { data, error: fetchError } = await supabase
          .from("cards")
          .select(
            "id,direction,interval_days,ease_factor,reps,lapses,success_streak,state,due_at,note:notes (korean,french)"
          )
          .order("success_streak", { ascending: true })
          .order("due_at", { ascending: true, nullsFirst: true })
          .limit(limit)

        if (fetchError) throw fetchError
        setCards(shuffle(mapCardRows(data as CardRowRaw[] | null)))
        return
      }

      const { data: due, error: dueError } = await supabase
        .from("cards")
        .select(
          "id,direction,interval_days,ease_factor,reps,lapses,success_streak,state,due_at,note:notes (korean,french)"
        )
        .lte("due_at", nowIso)
        .order("due_at", { ascending: true, nullsFirst: true })
        .limit(limit)

      if (dueError) throw dueError

      const dueCards = mapCardRows(due as CardRowRaw[] | null)
      if (dueCards.length >= limit) {
        setCards(shuffle(dueCards))
        return
      }

      const { data: upcoming, error: upcomingError } = await supabase
        .from("cards")
        .select(
          "id,direction,interval_days,ease_factor,reps,lapses,success_streak,state,due_at,note:notes (korean,french)"
        )
        .gt("due_at", nowIso)
        .order("due_at", { ascending: true })
        .limit(Math.max(0, limit - dueCards.length))

      if (upcomingError) throw upcomingError

      setCards(
        shuffle([...dueCards, ...mapCardRows(upcoming as CardRowRaw[] | null)])
      )
    } catch (e) {
      setError(formatUnknownError(e))
      setCards([])
    } finally {
      setLoading(false)
    }
  }, [mode, supabase])

  useEffect(() => {
    void loadCards()
  }, [loadCards])

  useEffect(() => {
    if (loading) return
    if (timeLeft <= 0) return
    const interval = window.setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => window.clearInterval(interval)
  }, [loading, timeLeft])

  useEffect(() => {
    if (timeLeft <= 0 && !timeExpired) setTimeExpired(true)
  }, [timeExpired, timeLeft])

  useEffect(() => {
    if (!loading) inputRef.current?.focus()
  }, [loading, index])

  const goNext = useCallback(() => {
    setAnswer("")
    setShowExpected(false)
    setAutoResult(null)
    setSaving(false)
    setSaveError(null)
    setIndex((i) => i + 1)
  }, [])

  const saveReview = useCallback(
    async (card: CardRow, wasCorrect: boolean, userAnswer: string) => {
      if (!supabase) return
      if (retryMode) return true

      setSaving(true)
      setSaveError(null)

      const now = new Date()
      const { nextDueAt, intervalDays, easeFactor, reps, lapses, successStreak, state } =
        computeNextSrs({
          now,
          wasCorrect,
          intervalDays: card.interval_days ?? 1,
          easeFactor: card.ease_factor ?? 2.2,
          reps: card.reps ?? 0,
          lapses: card.lapses ?? 0,
          successStreak: card.success_streak ?? 0,
          state: card.state ?? "new"
        })

      const { error: updateError } = await supabase
        .from("cards")
        .update({
          interval_days: intervalDays,
          ease_factor: easeFactor,
          reps,
          lapses,
          success_streak: successStreak,
          state,
          due_at: nextDueAt.toISOString(),
          last_reviewed_at: now.toISOString()
        })
        .eq("id", card.id)

      setSaving(false)

      if (updateError) {
        setSaveError(updateError.message)
        return false
      }

      setCards((prev) =>
        prev.map((c) =>
          c.id === card.id
            ? {
                ...c,
                interval_days: intervalDays,
                ease_factor: easeFactor,
                reps,
                lapses,
                success_streak: successStreak,
                state,
                due_at: nextDueAt.toISOString()
              }
            : c
        )
      )
      return true
    },
    [supabase]
  )

  const onReveal = useCallback(async () => {
    if (!current || showExpected || saving || finishReady) return

    setShowExpected(true)

    if (dir === "fr-ko") {
      const isCorrect =
        normalizeForExactMatch(answer) === normalizeForExactMatch(expected)
      setAutoResult(isCorrect)
      const ok = await saveReview(current, isCorrect, answer)
      if (ok) {
        if (retryMode) {
          setRetryResults((prev) => ({ ...prev, [current.id]: isCorrect }))
        } else {
          setResults((prev) => ({ ...prev, [current.id]: isCorrect }))
          if (isCorrect) setScore((prev) => prev + 1)
        }
        if (timeExpired) setFinishReady(true)
      }
    }
  }, [
    answer,
    current,
    dir,
    expected,
    finishReady,
    retryMode,
    saveReview,
    saving,
    showExpected,
    timeExpired
  ])

  const onSelfGrade = useCallback(
    async (wasCorrect: boolean) => {
      if (!current || !showExpected || saving || finishReady) return
      const ok = await saveReview(current, wasCorrect, answer)
      if (ok) {
        if (retryMode) {
          setRetryResults((prev) => ({ ...prev, [current.id]: wasCorrect }))
        } else {
          setResults((prev) => ({ ...prev, [current.id]: wasCorrect }))
          if (wasCorrect) setScore((prev) => prev + 1)
        }
        if (timeExpired) {
          setFinishReady(true)
        } else {
          goNext()
        }
      }
    },
    [
      answer,
      current,
      finishReady,
      retryMode,
      goNext,
      saveReview,
      saving,
      showExpected,
      timeExpired
    ]
  )

  const done =
    !loading &&
    (finished || (!retryMode && cards.length > 0 && index >= cards.length))
  const failedCards = cards.filter((card) => results[card.id] === false)
  const successCards = cards.filter((card) => results[card.id] === true)

  useEffect(() => {
    if (!done) return
    if (typeof window === "undefined") return
    try {
      const key = "bestScore"
      const currentBest = Number.parseInt(
        window.localStorage.getItem(key) ?? "0",
        10
      )
      if (!Number.isFinite(currentBest) || score > currentBest) {
        window.localStorage.setItem(key, String(score))
      }
    } catch {
      // ignore
    }
  }, [done, score])

  const onFinish = useCallback(() => {
    if (!retryMode && failedCards.length > 0) {
      setRetryMode(true)
      setRetryResults({})
      setCards(failedCards)
      setIndex(0)
      setAnswer("")
      setShowExpected(false)
      setAutoResult(null)
      setFinishReady(false)
      setTimeExpired(false)
      setTimeLeft(0)
      return
    }

    if (retryMode) {
      const stillFailed = cards.filter((card) => retryResults[card.id] === false)
      if (stillFailed.length > 0) {
        setRetryResults({})
        setCards(stillFailed)
        setIndex(0)
        setAnswer("")
        setShowExpected(false)
        setAutoResult(null)
        setFinishReady(false)
        setTimeExpired(false)
        setTimeLeft(0)
        return
      }
    }

    setFinished(true)
  }, [cards, failedCards, retryMode, retryResults])

  if (error) {
    return (
      <section className="stack">
        <h1>Practice</h1>
        <div className="card">
          <div className="muted">Setup error</div>
          <div className="mono">{error}</div>
        </div>
        <Link className="button" href="/">
          Back
        </Link>
      </section>
    )
  }

  if (loading) {
    return (
      <section className="stack">
        <h1>Practice</h1>
        <div className="card muted">Loading cards…</div>
      </section>
    )
  }

  if (done) {
    return (
      <section className="stack">
        <h1>Done</h1>
        <div className="card">
          Score: <span className="mono">{score}</span>
        </div>
        <div className="card stack">
          <div className="muted">
            Failed ({failedCards.length})
          </div>
          {failedCards.length === 0 ? (
            <div className="muted">None 🎉</div>
          ) : (
            failedCards.map((card) => (
              <div key={card.id} className="row" style={{ gap: 12 }}>
                <span className="mono">{card.note?.korean ?? ""}</span>
                <span className="muted">—</span>
                <span>{card.note?.french ?? ""}</span>
              </div>
            ))
          )}
        </div>
        <div className="card stack">
          <div className="muted">
            Successful ({successCards.length})
          </div>
          {successCards.length === 0 ? (
            <div className="muted">None</div>
          ) : (
            successCards.map((card) => (
              <div key={card.id} className="row" style={{ gap: 12 }}>
                <span className="mono">{card.note?.korean ?? ""}</span>
                <span className="muted">—</span>
                <span>{card.note?.french ?? ""}</span>
              </div>
            ))
          )}
        </div>
        <div className="row">
          <Link className="button primary" href="/">
            Back to menu
          </Link>
          <button className="button" type="button" onClick={loadCards}>
            Redo with same settings
          </button>
        </div>
      </section>
    )
  }

  if (!current) {
    return (
      <section className="stack">
        <h1>Practice</h1>
        <div className="card">
          No cards found for that direction. Check{" "}
          <span className="mono">public.cards</span> and{" "}
          <span className="mono">public.notes</span>.
        </div>
        <Link className="button" href="/">
          Back
        </Link>
      </section>
    )
  }

  return (
    <section className="stack">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1 style={{ margin: 0 }}>Practice</h1>
        <div className="muted">
          <span className="mono">
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
          </span>{" "}
          · score <span className="mono">{score}</span> ·{" "}
          {index + 1}/{cards.length} ·{" "}
          <span className="mono">
            {mode}/{dir}
          </span>
          {retryMode && <span className="muted"> · retry mode</span>}
        </div>
      </div>

      <div className="card stack">
        <div className="muted">Prompt</div>
        <div style={{ fontSize: 28, fontWeight: 650 }}>{prompt}</div>
        {canSpeak && (
          <div className="row">
            <button className="button" type="button" onClick={speakKorean}>
              🔊 Hear Korean
            </button>
          </div>
        )}
      </div>

      <div className="card stack">
        <label className="field" style={{ minWidth: "unset" }}>
          <span className="label">
            Your answer ({dir === "fr-ko" ? "Korean" : "French"})
          </span>
          <input
            ref={inputRef}
            className="input"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                void onReveal()
              }
            }}
            disabled={saving || finishReady}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={dir !== "fr-ko"}
          />
        </label>

        <div className="row">
          {!showExpected ? (
            <button
              className="button primary"
              type="button"
              onClick={() => void onReveal()}
              disabled={saving || finishReady}
            >
              {dir === "fr-ko" ? "Check" : "Reveal"}
            </button>
          ) : finishReady ? (
            <button
              className="button primary"
              type="button"
              onClick={onFinish}
              disabled={saving}
            >
              Finish
            </button>
          ) : dir === "ko-fr" ? (
            <>
              <button
                className="button ok"
                type="button"
                onClick={() => void onSelfGrade(true)}
                disabled={saving || finishReady}
              >
                Yes (correct)
              </button>
              <button
                className="button danger"
                type="button"
                onClick={() => void onSelfGrade(false)}
                disabled={saving || finishReady}
              >
                No (wrong)
              </button>
            </>
          ) : (
            <button
              className="button"
              type="button"
              onClick={goNext}
              disabled={saving || !!saveError || finishReady}
            >
              Next
            </button>
          )}

          <Link className="button" href="/">
            Stop
          </Link>
        </div>

        {showExpected && (
          <div className="card" style={{ padding: 14 }}>
            <div className="muted">Expected</div>
            <div style={{ fontSize: 22, fontWeight: 650 }}>{expected}</div>

            {dir === "fr-ko" && autoResult !== null && (
              <div className="row" style={{ marginTop: 10 }}>
                <strong style={{ color: autoResult ? "var(--ok)" : "var(--danger)" }}>
                  {autoResult ? "Correct" : "Wrong"}
                </strong>
                <span className="muted">
                  · streak: <span className="mono">{current.success_streak}</span>
                </span>
                {saving && <span className="muted">· saving…</span>}
              </div>
            )}

            {dir === "ko-fr" && (
              <div className="muted" style={{ marginTop: 10 }}>
                Choose Yes/No to save. · streak:{" "}
                <span className="mono">{current.success_streak}</span>
                {saving && " Saving…"}
              </div>
            )}

            {saveError && (
              <div className="stack" style={{ marginTop: 10, gap: 8 }}>
                <div className="muted">
                  Save failed: <span className="mono">{saveError}</span>
                </div>
                {dir === "fr-ko" && autoResult !== null && (
                  <button
                    className="button"
                    type="button"
                    onClick={() => void saveReview(current, autoResult, answer)}
                    disabled={saving}
                  >
                    Retry save
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
