export function UploadGuidePage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Facebook Instant Games upload</h1>
          <p>
            Checklist of what developers.facebook expects so each info pack maps cleanly
            to a shippable Instant Game listing.
          </p>
        </div>
      </div>

      <div className="grid" style={{ gap: 14 }}>
        <section className="card">
          <div className="section-title">Non-negotiable technical pillars</div>
          <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-muted)', fontSize: 14 }}>
            <li style={{ marginBottom: 8 }}>
              <strong>Sub-3s perceived load</strong> — smallest initial bundle (ideally
              under ~3–5 MB), progressive loading, loading progress via FBInstant.
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong>Zero Permissions</strong> — required for new Instant Games (and
              migration of existing titles). No blocking permissions screen; use Instant
              Games SDK v8+ patterns.
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong>&lt;30s teachable loop</strong> — learn by playing; skippable or
              invisible tutorial; meaningful interaction in first 3–5 seconds.
            </li>
            <li>
              <strong>Context-aware start</strong> — behave differently for challenge /
              share / Gaming Tab entry points.
            </li>
          </ul>
        </section>

        <section className="card">
          <div className="section-title">Discovery assets (upload surfaces)</div>
          <table className="table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Typical size</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>App icon</td>
                <td>1024×1024</td>
                <td>Mandatory; crisp, readable at small sizes</td>
              </tr>
              <tr>
                <td>Cover image</td>
                <td>1600×300</td>
                <td>Mandatory; sells the fantasy of the core loop</td>
              </tr>
              <tr>
                <td>Screenshots / video</td>
                <td>varies</td>
                <td>Show social moment (challenge, share, leaderboard)</td>
              </tr>
              <tr>
                <td>Category + tags</td>
                <td>—</td>
                <td>Match trivia / word / puzzle / sports discovery buckets</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="card">
          <div className="section-title">What each info pack should supply</div>
          <div className="pillar-list">
            <div className="pillar-item">
              <strong>pack.json</strong>
              <span>Machine-readable title, genre, status, scores, pillars</span>
            </div>
            <div className="pillar-item">
              <strong>FILTER-DECISION</strong>
              <span>Why it survived hard gates → opportunity → execution stages</span>
            </div>
            <div className="pillar-item">
              <strong>PILLARS</strong>
              <span>How social, retention, monetization, discovery are woven in</span>
            </div>
            <div className="pillar-item">
              <strong>DISCOVERY</strong>
              <span>Icon/cover concepts, category, share-image ideas</span>
            </div>
            <div className="pillar-item">
              <strong>MONETIZATION</strong>
              <span>Rewarded ads + light IAP placement without killing fun</span>
            </div>
            <div className="pillar-item">
              <strong>LIVEOPS</strong>
              <span>First 3–6 months content / events cadence</span>
            </div>
            <div className="pillar-item">
              <strong>skeleton/</strong>
              <span>Bare HTML/JS + FBInstant lifecycle + one social stub</span>
            </div>
            <div className="pillar-item">
              <strong>UPLOAD-CHECKLIST</strong>
              <span>developers.facebook field-by-field readiness</span>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="section-title">Recommended ship flow from this studio</div>
          <ol style={{ margin: 0, paddingLeft: 18, color: 'var(--text-muted)', fontSize: 14 }}>
            <li style={{ marginBottom: 8 }}>Pick a pack with status <em>ready</em>.</li>
            <li style={{ marginBottom: 8 }}>
              Copy pack path (or full Grok prompt) from pack detail.
            </li>
            <li style={{ marginBottom: 8 }}>
              Generate unique game implementation + assets; keep skeleton as contract, not
              as final product.
            </li>
            <li style={{ marginBottom: 8 }}>
              Create / configure app on developers.facebook → Instant Games.
            </li>
            <li style={{ marginBottom: 8 }}>
              Upload build, discovery assets, complete review checklist.
            </li>
            <li>Register in Library with App ID + paths for live-ops.</li>
          </ol>
        </section>
      </div>
    </div>
  );
}
