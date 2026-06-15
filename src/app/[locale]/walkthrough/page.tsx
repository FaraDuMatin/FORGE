export default function WalkthroughPage() {
  return (
    <main style={{ padding: 48, fontFamily: "system-ui, sans-serif", maxWidth: 680, lineHeight: 1.7 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>How FORGE works</h1>
      <p style={{ color: "#666", marginBottom: 40 }}>A 2-minute guide for anyone new to the app.</p>

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

      
    </main>
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
      <p style={{ margin: 0, color: "#444", paddingLeft: 40 }}>{children}</p>
    </div>
  );
}

function A({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} style={{ color: "#059669", textDecoration: "underline" }}>{children}</a>;
}
