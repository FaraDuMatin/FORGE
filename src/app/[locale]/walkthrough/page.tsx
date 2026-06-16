export default function WalkthroughPage() {
  return (
    <main style={{ padding: 48, fontFamily: "system-ui, sans-serif", maxWidth: 1040, margin: "0 auto", lineHeight: 1.7 }}>
      <WalkthroughStyles />
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>How FORGE works</h1>
      <p className="wt-sub" style={{ marginBottom: 40 }}>A 2-minute guide for anyone new to the app.</p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 48, alignItems: "flex-start" }}>
        <div style={{ flex: "1 1 520px", minWidth: 300 }}>
          <Step n={1} title="Someone starts a project">
            A person has an idea for a real community project (planting trees, fixing a park, going solar).
            They fill out a short form on <A href="/en/new">Start a project</A> — title, goal, city, and how long it will take.
            They get a secret link to manage their project. No account needed.
          </Step>

          <Step n={2} title="The project gets ready">
            Before anything goes public in the spotlight, the project needs to be ready:
            at least 3 tasks, a crew, and a first build log entry explaining what the work is.
            The <A href="/en/projects">projects directory</A> shows every project and how far along it is.
          </Step>

          <Step n={3} title="It earns a spotlight slot">
            Ready projects enter a pool (1 week / 1 month / 6 months / 1 year).
            Only 3 projects get a spotlight at a time per pool. When a slot opens, the next ready project fills it.
            See all active spotlights on the <A href="/en/spotlight">spotlight page</A>.
          </Step>

          <Step n={4} title="People join and claim tasks">
            Anyone can visit a project page and ask to join the crew. The maintainer approves them.
            Once approved, crew members can claim open tasks, do the work, then submit a short report.
            The maintainer reviews it and marks it done, just like a pull request.
          </Step>

          <Step n={5} title="The community backs one wildcard project">
            There is one extra spotlight slot that works differently: <A href="/en/pc">People's Choice</A>.
            Anyone can back a ready project they believe in. One vote per person, votes never reset.
            The most-backed project claims the wildcard slot and keeps it until it finishes.
          </Step>

          <Step n={6} title="The project finishes and becomes a playbook">
            The maintainer closes the project with a short outcome. It moves to the <A href="/en/wins">win wall</A>.
            Anyone, anywhere, can copy that playbook for their own city. The fork credit shows how far the idea travels.
            A project in Medellin gets copied in Rio and Nairobi? The original team gets credited for both.
          </Step>
        </div>

        <aside style={{ flex: "1 1 300px", minWidth: 280, maxWidth: 360 }}>
          <div className="wt-card" style={{ borderRadius: 12, padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 16 }}>Good to know</h2>

            <Fact title="How spotlight slots are filled">
              Each pool shows three projects at a time. A project that meets its readiness bars takes the next open slot, in the order projects become ready.
            </Fact>
            <Fact title="When the lottery runs">
              If more ready projects want a slot than there are slots, a fair draw picks among them. A project that keeps missing the draw is guaranteed the next one.
            </Fact>
            <Fact title="What readiness means">
              A fixed set of requirements: a real goal, claimable tasks, a crew, and a build-log entry. Six-month and one-year pools also require named roles and a successor.
            </Fact>
            <Fact title="Maintainer succession">
              A maintainer can hand the project to a named successor and keep its slot, or release it for adoption so the work continues without them.
            </Fact>
            <Fact title="Cancelling People's Choice">
              A steward can remove a spam or off-topic People's Choice entry. The wildcard is the only slot that can be cancelled this way.
            </Fact>
          </div>
        </aside>
      </div>
    </main>
  );
}

function Fact({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div className="wt-fact-title" style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
      <p className="wt-fact-body" style={{ margin: "2px 0 0", fontSize: 13, lineHeight: 1.55 }}>{children}</p>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 6 }}>
        <span style={{
          background: "#059669", color: "#fff", borderRadius: "50%",
          width: 28, height: 28, display: "inline-flex", alignItems: "center",
          justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0,
        }}>{n}</span>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{title}</h2>
      </div>
      <p className="wt-step-body" style={{ margin: 0, paddingLeft: 40 }}>{children}</p>
    </div>
  );
}

function A({ href, children }: { href: string; children: React.ReactNode }) {
  return <a className="wt-link" href={href}>{children}</a>;
}

// Colors live here (not inline) so they adapt to light/dark — inline styles can't
// express prefers-color-scheme.
function WalkthroughStyles() {
  return (
    <style>{`
      .wt-sub { color: #666; }
      .wt-step-body { color: #444; }
      .wt-fact-title { color: #111; }
      .wt-fact-body { color: #555; }
      .wt-link { color: #059669; text-decoration: underline; }
      .wt-card { border: 1px solid #e5e5e5; background: #fafafa; }
      @media (prefers-color-scheme: dark) {
        .wt-sub { color: #9a9a9a; }
        .wt-step-body { color: #c4c4c4; }
        .wt-fact-title { color: #f2f2f2; }
        .wt-fact-body { color: #a8a8a8; }
        .wt-link { color: #34d399; }
        .wt-card { border-color: #2a2a2a; background: #141414; }
      }
    `}</style>
  );
}
