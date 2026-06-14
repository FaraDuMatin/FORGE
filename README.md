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
  app/[locale]/      routes: / , /new , /projects , /spotlight , /pc , /wins , /p/[slug] , /p/[slug]/manage
  app/api/           projects/search route handler (JSON, for the directory type-ahead)
  lib/               db (Neon adapter), allocation, readiness, pools, week, home, directory, cardStyle, token
  server/            server-only data + actions (directory search, wins, peopleschoice, succession)
  i18n/              next-intl routing / request / navigation
  components/        Header, LocaleSwitch, home/, project/, pc/, manage/, ui/
  generated/prisma/  Prisma client (generated, gitignored)
prisma/schema.prisma five models: Project, Member, Task, Update, PCVote
messages/            en.json, fr.json
```

## Styling notes (cards / spotlight glow)

Note to self for tuning the spotlight look.

**Glow** — a slight emerald glow in the bottom-left corner marks a spotlight card.
- All project cards (home strip, `/spotlight`, `/projects`): [`src/lib/cardStyle.ts`](src/lib/cardStyle.ts), constants `GLOW` (spotlight) + `GLOW_STRONG` (People's Choice).
- Big home PC card: [`src/components/home/PeoplesChoiceFeature.tsx`](src/components/home/PeoplesChoiceFeature.tsx) (its own inline gradient).

Inside each `radial-gradient(ellipse 42% 55% at 0% 100%, rgba(16,185,129,0.10), transparent)`:
- **Intensity** = the last number `0.10` → lower = fainter, higher = stronger.
- **Reach / size** = `42% 55%` → smaller = tighter corner spot.
- **Corner** = `at 0% 100%` = bottom-left (`100% 100%` = bottom-right, etc.).

Current values: spotlight `0.10 / 42% 55%`, PC card `0.15 / 48% 60%`, big PC card `0.14 / 45% 60%`.

**Border** — same `cardStyle.ts`: the `border-neutral-200 dark:border-neutral-800` on each branch. Fainter → `dark:border-neutral-800/50`. No border at all → remove `border` from `BASE` and the `border-*` classes.

**Status pill colours** — [`src/components/project/StatusBadge.tsx`](src/components/project/StatusBadge.tsx): Spotlight = emerald, Queued = neutral, Finished = blue, Needs-maintainer = amber, Cancelled = red.

## Roadmap / deferred

- **Magic-link vote verification.** People's Choice voting is honor-system in the MVP: email + cookie dedup (one vote per email per project), bounded by READY-only eligibility, a 3-vote threshold to claim the slot, a persistent holder that keeps the slot until it finishes (tie at the top waits for more votes), and steward cancellation. A later upgrade verifies the voter's email via a magic link (verification only — no accounts, no user table) to harden one-person-one-vote without adding a login wall. We deliberately do **not** gate voting behind joining a project (no forced participation).
- **Steward / admin console.** A privileged view to confirm a project is genuinely READY (real crew, real tasks) and to cancel spam or off-topic People's Choice entries. Deferred — it's an identity/permissions shift, not a small add.
- **Account migration (if ever).** tokens-in-URL → Better Auth (self-hosted, data stays in our Postgres; preferred over Clerk for data custody). ~1–2 days, low data-risk because email is already the universal key, so backfill is a clean join. Kept out by choice — token-in-URL *is* the minimal-data Equitable story.

Built solo for the Green Hackathon, June 2026.
