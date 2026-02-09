import StatsClient from "./stats/StatsClient"

export default function HomePage() {
  const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const hasKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  return (
    <section className="stack">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1 style={{ margin: 0 }}>Practice Korean</h1>
        <StatsClient />
      </div>

      <form action="/practice" method="GET" className="card stack">
        <div className="card muted">
          Session length: <span className="mono">1:30</span>. Maximize your score.
        </div>

        <fieldset className="fieldset">
          <legend className="legend">Pick mode</legend>
          <div className="row">
            <label className="row">
              <input type="radio" name="mode" value="srs" defaultChecked />
              <span>SRS (due first)</span>
            </label>
            <label className="row">
              <input type="radio" name="mode" value="streak" />
              <span>Lowest streak</span>
            </label>
          </div>
        </fieldset>

        <div className="row">
          <button className="button primary" type="submit">
            Start
          </button>
        </div>
      </form>

      {!(hasUrl && hasKey) && (
        <div className="card muted">
          Missing env vars. Create <span className="mono">.env.local</span> and
          restart <span className="mono">npm run dev</span>.
        </div>
      )}
    </section>
  )
}
