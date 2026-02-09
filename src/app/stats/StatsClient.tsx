"use client"

import { useEffect, useMemo, useState } from "react"

import { getSupabaseBrowserClient } from "@/lib/supabase"

type Stats = {
  unknown: number
  learning: number
  known: number
}

export default function StatsClient() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [bestScore, setBestScore] = useState<number | null>(null)

  const supabase = useMemo(() => {
    try {
      return getSupabaseBrowserClient()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      return null
    }
  }, [])

  useEffect(() => {
    if (!supabase) return

    const fetchCounts = async () => {
      const { count: unknownCount, error: unknownError } = await supabase
        .from("cards")
        .select("id", { count: "exact", head: true })
        .lte("success_streak", 2)

      if (unknownError) {
        setError(unknownError.message)
        return
      }

      const { count: learningCount, error: learningError } = await supabase
        .from("cards")
        .select("id", { count: "exact", head: true })
        .gte("success_streak", 3)
        .lte("success_streak", 4)

      if (learningError) {
        setError(learningError.message)
        return
      }

      const { count: knownCount, error: knownError } = await supabase
        .from("cards")
        .select("id", { count: "exact", head: true })
        .gte("success_streak", 5)

      if (knownError) {
        setError(knownError.message)
        return
      }

      setStats({
        unknown: unknownCount ?? 0,
        learning: learningCount ?? 0,
        known: knownCount ?? 0
      })
    }

    void fetchCounts()
  }, [supabase])

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("bestScore")
      if (stored) {
        const value = Number.parseInt(stored, 10)
        if (Number.isFinite(value)) setBestScore(value)
      }
    } catch {
      // ignore
    }
  }, [])

  if (error) {
    return (
      <div className="muted" style={{ fontSize: 12 }}>
        Stats error
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="muted" style={{ fontSize: 12 }}>
        Stats…
      </div>
    )
  }

  return (
    <div className="row" style={{ gap: 12, fontSize: 12 }}>
      <span className="mono">unknown {stats.unknown}</span>
      <span className="mono">learning {stats.learning}</span>
      <span className="mono">known {stats.known}</span>
      {bestScore !== null && (
        <span className="mono">best {bestScore}</span>
      )}
    </div>
  )
}
