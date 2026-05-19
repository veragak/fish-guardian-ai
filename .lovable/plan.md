# AquaSense — Build Plan

A 3-page static demo app (no backend) for an AI-powered salmon farm disease warning system. All data is hardcoded per the spec.

## Design tokens (src/styles.css)

Replace current palette with:
- `--background`: #0a1628 (dark navy) for nav/hero surfaces
- `--foreground`: near-white
- `--primary`: #0ea5e9 (ocean blue) + `--primary-foreground`: white
- `--card`: white, `--card-foreground`: navy (for dashboard cards on light section)
- `--destructive`: #ef4444, `--success`: #22c55e (new token)
- `--muted`, `--border`: cool slate tones
- Typography: Inter (already system-safe) — headings tight tracking, data uses tabular-nums

Two surface contexts:
- Dark sections (nav, hero, AI assistant background): navy bg, white text
- Light sections (dashboard body, how-it-works): light slate bg, white cards, navy text

## Routes (TanStack Start file-based)

```
src/routes/
  __root.tsx          (existing — add <Nav /> + <Outlet />)
  index.tsx           Landing
  dashboard.tsx       Dashboard
  ai-assistant.tsx    AI Assistant
  about.tsx           About (brief content so nav link works)
```

Each route gets its own `head()` with unique title + description + og tags.

## Components

```
src/components/
  Nav.tsx              Sticky dark navy nav: "AquaSense" wordmark + 3 Links with active state
  Footer.tsx           Footnote about Fiskehelserapporten 2022 (landing only)
  StatCard.tsx         Big number + label (landing hero stats)
  StepCard.tsx         Numbered step (how it works)
  MetricCard.tsx       Dashboard top-row metric (4 cards)
  CageCard.tsx         Single cage tile w/ risk score, readings, sparkline, badge, button
  Sparkline.tsx        Lightweight inline SVG sparkline (no chart lib needed)
  RiskBadge.tsx        CRITICAL / LOW pill
  AlertBanner.tsx      Red critical alert banner
  ChatMessage.tsx      User/AI bubble component
  ChatComposer.tsx     Textarea + send button (non-functional, decorative)
```

## Page details

**Landing (`/`)**
- Dark navy hero: H1 "Detect fish disease 48 hours before it's visible", subhead, two CTAs (primary `<Link to="/dashboard">View Live Dashboard`, secondary anchor to #how)
- 3 StatCards row (on dark, subtle border)
- Light section "How it works" with 3 numbered StepCards
- Footer note

**Dashboard (`/dashboard`)**
- Red AlertBanner pinned at top
- Subheader bar: "Hardangerfjord Site A — License NOR-42540 — Atlantic Salmon (Salmo salar)"
- 4 MetricCards row
- "Cages" heading + responsive grid (3 cols desktop, 2 tablet, 1 mobile) of 6 CageCards
- Data file `src/data/cages.ts` with the 6 cage objects + DO sparkline arrays (Cage 1 declining series, others flat)
- "View AI Analysis" button on Cage 1 links to `/ai-assistant`

**AI Assistant (`/ai-assistant`)**
- Dark navy page background, centered max-w-3xl chat column
- Title + subtitle header
- Hardcoded conversation (3 user + 3 AI messages) from `src/data/conversation.ts`
- iMessage-style bubbles: user = ocean blue right-aligned, AI = slate-700 left-aligned, white text
- Composer at bottom (textarea + send icon button) — decorative, prevents default on submit

**About (`/about`)**
- Brief section explaining product so nav link doesn't 404. Same theme.

## Technical notes
- All data static — no Supabase / no server fns needed
- Sparklines built as pure SVG `<polyline>` — no recharts dependency required
- Responsive: Tailwind `md:` / `lg:` breakpoints; grid collapses to single column on mobile
- Use lucide-react icons (already available) for nav, send button, alert icon, badges
- Each route's `head()` gets distinct title/description/og:title/og:description
- Replace the placeholder `index.tsx` content entirely

## Out of scope
- No real chat backend (input is decorative)
- No auth, no DB
- No animations beyond subtle hover transitions

## App
https://fish-guardian-ai.lovable.app
