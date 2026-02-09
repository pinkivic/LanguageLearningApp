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
        <div className="row">
          <label className="field">
            <span className="label">Cards this session</span>
            <input
              className="input"
              type="number"
              name="n"
              defaultValue={20}
              min={1}
              max={200}
              inputMode="numeric"
              required
            />
          </label>
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

        <fieldset className="fieldset">
          <legend className="legend">Direction</legend>
          <div className="row">
            <label className="row">
              <input type="radio" name="dir" value="fr-ko" defaultChecked />
              <span>French → Korean</span>
            </label>
            <label className="row">
              <input type="radio" name="dir" value="ko-fr" />
              <span>Korean → French</span>
            </label>
          </div>
        </fieldset>

        <div className="row">
          <button className="button primary" type="submit">
            Start
          </button>
        </div>
      </form>

      <div className="card muted">
        Env status:{" "}
        <span className="mono">
          URL {hasUrl ? "OK" : "MISSING"} · KEY {hasKey ? "OK" : "MISSING"}
        </span>
        <br />
        If missing, ensure you created <span className="mono">.env.local</span>{" "}
        (repo root), then restart <span className="mono">npm run dev</span>.
      </div>
    </section>
  )
}
