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

export default async function PracticePage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const params: Record<string, string | string[] | undefined> = await (
    searchParams ?? Promise.resolve({})
  )
  const mode = parseMode(params.mode)
  const dir = parseDir(params.dir)
  const n = parseN(params.n)

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
