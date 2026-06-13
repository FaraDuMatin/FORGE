# FORGE

**Communities build real-world projects the way open source builds software:** in public, with claimable tasks and credited contributors, concentrated on a few spotlighted projects at a time, and built to outlive their founders.

> Nobody acts alone.

The name is the method. **FORGE** = **F**ocus · **O**pen · **R**elay · **G**row · **E**ngage.

- **Focus** (borrowed from boycott strategy) — instead of a thousand half-finished projects, the community concentrates on a few at a time. Projects sit in duration pools (1 week / 1 month / 6 months / 1 year), three spotlight slots each.
- **Open** (borrowed from open source) — every project is documented and forkable by default: public build log, claimable task board, credit for every contributor.
- **Relay** — when a maintainer steps away, someone else picks up the baton, so no project dies with its founder.
- **Grow** — a finished project becomes a playbook anyone can copy and run in their own city.
- **Engage** — spotlights are earned by readiness and filled by lottery, so the person with five neighbors has the same odds as someone with fifty thousand followers. One extra slot, People's Choice, is voted freely.

Green first, for climate projects. The same machinery carries any cause that needs hands.

## How it works

1. **Post a project** — goal, city, a duration pool, first tasks, a small crew.
2. **Get ready** — fixed readiness bars per pool (a real goal, ≥3 claimable tasks, a build-log entry, a crew minimum, longer pools need named roles and a successor). Bars, never votes.
3. **Take a slot** — *fill-on-ready*: cross the bar while a slot is open and the project is spotlighted instantly. When ready projects outnumber open slots, a public **lottery** decides, with an anti-starvation guarantee for projects that keep missing.
4. **Build in public** — anyone claims a task with a name and email, every contributor is credited, the build log is readable by all.
5. **Relay or finish** — a maintainer can hand off (succession), or close with an outcome. Closed projects become **playbooks** on the win wall, forkable into other cities with credit back to the origin crew.

No accounts. No ads. No leaderboards or points (ranking people reproduces the popularity dynamics the lottery removes). No AI writing or filtering anything. Joining is a link, a first name, and an email — that is the whole data footprint.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind 4)
- **Prisma 7** with the **Neon serverless driver adapter** (`@prisma/adapter-neon`) → **Neon Postgres** everywhere (no SQLite)
- **next-intl** — English and French from day one
- Stateless / serverless, all state-transitions synchronous (no cron), built to hold 10,000 users
- Deploy: **Vercel** (kept portable — Neon + plain Prisma, no Vercel-only services — so a later move to Cloudflare Workers is a half-day, not a rewrite)

### Prisma 7 note

Prisma 7 carries **no `url` in `schema.prisma`**. The connection string flows through the Neon driver adapter in [`src/lib/db.ts`](src/lib/db.ts) at runtime, and [`prisma.config.ts`](prisma.config.ts) holds it for migrations.

## Run locally

```bash
# 1. install
npm install

# 2. set the database url
cp .env.example .env
# edit .env -> paste your Neon pooled connection string (free at https://neon.tech)

# 3. create the tables
npm run db:push          # or: npm run db:migrate

# 4. start
npm run dev              # http://localhost:3000
```

## Deploy (Vercel)

1. Import the repo into Vercel.
2. Set `DATABASE_URL` in the project's environment variables (Neon prod branch).
3. Deploy. `prisma generate` runs automatically (`postinstall` + `build`).
4. Set a **$0 hard spend cap** in Vercel billing as insurance.

## Project layout

```
src/
  app/[locale]/      routes: / , /new , /wins , /p/[slug] , /p/[slug]/manage
  lib/               db (Neon adapter), allocation, readiness, pools, week, home
  i18n/              next-intl routing / request / navigation
  components/        Header, LocaleSwitch, shared UI
  generated/prisma/  Prisma client (generated, gitignored)
prisma/schema.prisma five models: Project, Member, Task, Update, PCVote
messages/            en.json, fr.json
```

Built solo for the Green Hackathon, June 2026.
