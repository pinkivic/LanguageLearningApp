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
        .eq("success_streak", 0)

      if (unknownError) {
        setError(unknownError.message)
        return
      }

      const { count: learningCount, error: learningError } = await supabase
        .from("cards")
        .select("id", { count: "exact", head: true })
        .gte("success_streak", 1)

      if (learningError) {
        setError(learningError.message)
        return
      }

      const { count: knownCount, error: knownError } = await supabase
        .from("cards")
        .select("id", { count: "exact", head: true })
        .gte("success_streak", 2)

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
    </div>
  )
}
