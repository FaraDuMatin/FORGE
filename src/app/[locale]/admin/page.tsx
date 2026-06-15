import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

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
      maintainerEmail: true,
      maintainerToken: true,
      createdAt: true,
    },
  });

  return (
    <main style={{ padding: 40, fontFamily: "monospace", fontSize: 13 }}>
      <h1 style={{ marginBottom: 16 }}>Admin — {projects.length} projects</h1>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "2px solid #ccc" }}>
            <th style={{ padding: "4px 12px 4px 0" }}>Title</th>
            <th style={{ padding: "4px 12px 4px 0" }}>Status</th>
            <th style={{ padding: "4px 12px 4px 0" }}>Pool</th>
            <th style={{ padding: "4px 12px 4px 0" }}>Email</th>
            <th style={{ padding: "4px 12px 4px 0" }}>Manage link</th>
            <th style={{ padding: "4px 12px 4px 0" }}>Created</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <tr key={p.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "4px 12px 4px 0" }}>
                <a href={`/en/p/${p.slug}`}>{p.title}</a>
              </td>
              <td style={{ padding: "4px 12px 4px 0" }}>{p.status}</td>
              <td style={{ padding: "4px 12px 4px 0" }}>{p.pool}</td>
              <td style={{ padding: "4px 12px 4px 0" }}>{p.maintainerEmail}</td>
              <td style={{ padding: "4px 12px 4px 0" }}>
                <a href={`/en/p/${p.slug}/manage?t=${p.maintainerToken}`}>
                  manage
                </a>
                {" "}
                <span style={{ color: "#999", userSelect: "all" }}>{p.maintainerToken}</span>
              </td>
              <td style={{ padding: "4px 12px 4px 0", color: "#999" }}>
                {p.createdAt.toISOString().slice(0, 10)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
