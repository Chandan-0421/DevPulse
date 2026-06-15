# DevPulse ⚡

A real-time GitHub activity dashboard that visualises your commit history, streaks, and repository activity — with live updates powered by WebSockets and Redis pub/sub.

**Live demo:** [dev-pulse-github.vercel.app](https://dev-pulse-github.vercel.app/)

---

## Overview

DevPulse connects to your GitHub account via OAuth and transforms raw API data into a clean, glassmorphism-styled dashboard. Instead of polling GitHub repeatedly, it uses an event-driven architecture: data is cached in Redis, and a WebSocket layer pushes live updates to the browser whenever the cache refreshes — no manual reloads.

## Features

- **GitHub OAuth login** — no manual token entry required
- **Real-time updates** via WebSocket + Redis pub/sub
- **Commit activity heatmap** — 90-day GitHub-style calendar with hover tooltips
- **Streak tracker** — consecutive active days, timezone-aware (IST)
- **Commits per repository** — bar chart across your top 10 most active repos
- **Code churn visualisation** — lines added vs deleted per week (Chart.js line chart)
- **Redis-backed rate limiting** — token-bucket strategy to stay within GitHub's API limits
- **Responsive design** — works across desktop, tablet, and mobile
- **Skeleton loading states** — smooth UX while data fetches

## Architecture

```
┌─────────────┐      OAuth + REST      ┌──────────────────┐      cached calls      ┌─────────────┐
│   React UI   │ ◄──────────────────► │  Express Backend  │ ◄──────────────────► │  GitHub API  │
│   (Vercel)   │                       │    (Railway)       │                       └─────────────┘
└─────────────┘                       └──────────────────┘
       ▲                                       │
       │            WebSocket push             │  cache + pub/sub
       └───────────────────────────────────────┤
                                                 ▼
                                          ┌─────────────┐
                                          │ Upstash Redis│
                                          └─────────────┘
```

**How the real-time flow works:**

1. Frontend authenticates via GitHub OAuth and receives an access token
2. Backend fetches repos, commits, PRs, and code frequency stats — caching every response in Redis (5-minute TTL)
3. Aggregated metrics (heatmap, streak, churn, etc.) are computed and cached separately (15-minute TTL)
4. When the metrics cache expires, the backend publishes an invalidation event to a Redis channel
5. The WebSocket server subscribes to that channel and pushes a `refresh` message to all connected clients
6. The frontend receives the push and re-fetches only the updated metrics — no polling, no full page reload

## Tech Stack

**Frontend:** React (Vite), Chart.js, WebSocket client — deployed on Vercel
**Backend:** Node.js, Express, `ws` (WebSocket server) — deployed on Railway
**Cache / Pub-Sub:** Upstash Redis (ioredis)
**Auth:** GitHub OAuth 2.0
**Styling:** Custom CSS — clay morphism + glassmorphism design system

## Key Technical Decisions

**Why Redis pub/sub instead of polling?**
Most dashboards poll an API on a fixed interval, wasting requests when nothing has changed. DevPulse instead caches GitHub responses and only notifies clients when the underlying data actually changes — cutting redundant API calls significantly while keeping the UI feeling live.

**Why a token-bucket rate limiter?**
GitHub allows 5,000 authenticated requests/hour. With heatmaps, PR data, and code frequency stats across 10 repos, naive fetching can burn through that quickly. The token bucket tracks usage per user in Redis and stops new requests before hitting the ceiling, instead of failing mid-aggregation.

**Why compute the heatmap in plain CSS/JS instead of a charting library?**
A 90-cell commit grid is simple enough that a library adds unnecessary weight. Building it manually also gave full control over hover tooltips and color theming to match the design system.

## Getting Started

### Prerequisites
- Node.js 18+
- A GitHub OAuth App ([create one here](https://github.com/settings/developers))
- An Upstash Redis database (free tier works)

### Backend setup

```bash
cd backend
npm install
```

Create a `.env` file:

```
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
SESSION_SECRET=any_random_string
FRONTEND_URL=http://localhost:5173
CALLBACK_URL=http://localhost:5000/auth/callback
REDIS_URL=your_upstash_redis_url
PORT=5000
```

```bash
npm run dev
```

### Frontend setup

```bash
cd frontend
npm install
```

Create a `.env.local` file:

```
VITE_API_URL=http://localhost:5000
```

```bash
npm run dev
```

Visit `http://localhost:5173` and click **Login with GitHub**.

## Future Improvements

- Pull request review-time analytics across organisations
- Configurable date ranges (30 / 90 / 180 days)
- Multi-user leaderboard for teams
- Dark mode toggle

---

Built by [Chandan Singh](https://github.com/Chandan-0421)
