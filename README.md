# Solve Sixteen

Solve Sixteen is a React-based web application designed for those who prefer to play NYT Connections in hard mode - solving all 4 rows at once.

- Due to copyright constraints, this project does NOT validate your picks. It is purely intended as a thought organizer. You must visit the official NYT website to check your answers and see category names.

## Architecture

| Piece | Where it runs |
| --- | --- |
| `client/` | React + Vite, deployed to GitHub Pages |
| `worker/` | Cloudflare Worker: daily scrape + read API |
| Puzzle storage | Cloudflare D1 (`solve-sixteen`) |

The Worker scrapes the NYT Connections feed on a cron trigger and stores each
day's puzzle in D1. The client is fully static and reads two endpoints:

- `GET /api/dates` — playable dates, newest first
- `GET /api/games/{YYYY-MM-DD}` — the 16 words for that date
- `GET /api/games/{YYYY-MM-DD}?raw=1` — same, plus `originalData`, the NYT feed
  response verbatim (per-card `position`, `editor`, `id`, `print_date`). Opt-in
  because it roughly doubles the payload; the game client never requests it.

Every scrape stores both the transformed words and the raw feed response, so
nothing the feed sends is discarded. Bulk puzzle exports are kept out of this
repository on purpose — see [worker/data/](worker/data/).

## Development

### Prerequisites

-   Node.js (v24+)
-   Wrangler (`npm install -g wrangler`), authenticated with `wrangler login`

### Local Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/ecc521/solve-sixteen.git
    cd solve-sixteen
    ```

2.  **Install dependencies:**
    ```bash
    cd client && npm install
    cd ../worker && npm install
    ```

3.  **Start the frontend:**
    ```bash
    cd client
    npm run dev
    ```
    Available at `http://localhost:5173/solve-sixteen/`. By default it talks to
    the deployed Worker, so no configuration is needed to develop the UI.

### Working on the Worker

Run it locally against the real D1 database:

```bash
cd worker
npm run dev
```

Point the client at it by creating `client/.env` from `client/.env.example` and
setting `VITE_API_BASE=http://localhost:8787`.

To exercise the scheduled scrape without waiting for the cron:

```bash
wrangler dev --remote --test-scheduled
curl "http://localhost:8787/__scheduled?cron=0+6+*+*+*"
```

The scrape is idempotent — it refreshes today and backfills any of the previous
three days missing from D1, so a failed run self-heals on the next trigger.

## Deployment

**Client** — deployed to GitHub Pages by `.github/workflows/deploy-client.yml`
on every push to `main`. No repository secrets are required; `VITE_API_BASE`
falls back to the deployed Worker URL if unset.

**Worker** — deployed manually:

```bash
cd worker
npm run deploy
```

Schema changes go through `worker/schema.sql`:

```bash
npm run schema
```

### Backing up puzzle data

```bash
wrangler d1 export solve-sixteen --remote --output=backup.sql
```
