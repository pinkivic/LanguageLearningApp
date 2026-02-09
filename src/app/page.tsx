export default function HomePage() {
  return (
    <section className="stack">
      <h1>Practice Korean</h1>

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
        Requires <span className="mono">NEXT_PUBLIC_SUPABASE_URL</span> and{" "}
        <span className="mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>.
      </div>
    </section>
  )
}
