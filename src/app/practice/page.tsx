import PracticeClient, { type Direction, type Mode } from "./PracticeClient"

function parseMode(value: unknown): Mode {
  return value === "streak" ? "streak" : "srs"
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

  return (
    <PracticeClient
      options={{
        mode
      }}
    />
  )
}
