import { prisma } from "@/lib/db";
import { adminDeleteProject, adminResetToken, adminSetStatus } from "@/server/actions/admin";
import { DeleteButton } from "./DeleteButton";

export const dynamic = "force-dynamic";

const STATUSES = ["QUEUED", "SPOTLIGHT", "CLOSED", "ADOPTABLE", "CANCELLED"] as const;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const { p } = await searchParams;
  const pw = process.env.ADMIN_PASSWORD;

  if (!pw || p !== pw) {
    return (
      <main style={{ padding: 40, fontFamily: "monospace" }}>
        <h1>Admin</h1>
        <form method="get">
          <input name="p" type="password" placeholder="password" autoFocus />
          <button type="submit" style={{ marginLeft: 8 }}>Enter</button>
        </form>
      </main>
    );
  }

  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      pool: true,
      isPeoplesChoice: true,
      maintainerEmail: true,
      maintainerToken: true,
      createdAt: true,
    },
  });

  const cell: React.CSSProperties = { padding: "8px 12px 8px 0", verticalAlign: "top" };

  return (
    <main style={{ padding: 40, fontFamily: "monospace", fontSize: 13 }}>
      <h1 style={{ marginBottom: 4 }}>Admin — {projects.length} projects</h1>
      <p style={{ color: "#999", marginBottom: 20 }}>
        Raw levers. Status override does not re-run allocation. Delete cascades to crew, tasks, log, votes.
      </p>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "2px solid #ccc" }}>
            <th style={cell}>Project</th>
            <th style={cell}>Status</th>
            <th style={cell}>Manage link / token</th>
            <th style={cell}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((proj) => (
            <tr key={proj.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={cell}>
                <a href={`/en/p/${proj.slug}`}>{proj.title}</a>
                <div style={{ color: "#999" }}>
                  {proj.pool}
                  {proj.isPeoplesChoice ? " · PC" : ""} · {proj.maintainerEmail}
                </div>
                <div style={{ color: "#bbb" }}>{proj.createdAt.toISOString().slice(0, 10)}</div>
              </td>

              <td style={cell}>
                <div style={{ marginBottom: 6 }}>{proj.status}</div>
                <form action={adminSetStatus}>
                  <input type="hidden" name="p" value={pw} />
                  <input type="hidden" name="projectId" value={proj.id} />
                  <select name="status" defaultValue={proj.status} style={{ fontFamily: "monospace" }}>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>{" "}
                  <button type="submit">set</button>
                </form>
              </td>

              <td style={cell}>
                <a href={`/en/p/${proj.slug}/manage?t=${proj.maintainerToken}`}>manage →</a>
                <div style={{ color: "#999", userSelect: "all", maxWidth: 240, wordBreak: "break-all" }}>
                  {proj.maintainerToken}
                </div>
              </td>

              <td style={cell}>
                <form action={adminResetToken} style={{ marginBottom: 6 }}>
                  <input type="hidden" name="p" value={pw} />
                  <input type="hidden" name="projectId" value={proj.id} />
                  <button type="submit">reset token</button>
                </form>
                <form action={adminDeleteProject}>
                  <input type="hidden" name="p" value={pw} />
                  <input type="hidden" name="projectId" value={proj.id} />
                  <DeleteButton title={proj.title} />
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
