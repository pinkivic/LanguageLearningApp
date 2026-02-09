import PracticeClient, { type Direction, type Mode } from "./PracticeClient"

function parseMode(value: unknown): Mode {
  return value === "streak" ? "streak" : "srs"
}

function parseDir(value: unknown): Direction {
  return value === "ko-fr" ? "ko-fr" : "fr-ko"
}

function parseN(value: unknown): number {
  const raw = Array.isArray(value) ? value[0] : value
  const parsed = typeof raw === "string" ? Number.parseInt(raw, 10) : NaN
  if (!Number.isFinite(parsed)) return 20
  return Math.max(1, Math.min(200, parsed))
}

export default function PracticePage({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const mode = parseMode(searchParams.mode)
  const dir = parseDir(searchParams.dir)
  const n = parseN(searchParams.n)

  return (
    <PracticeClient
      options={{
        mode,
        dir,
        n
      }}
    />
  )
}
