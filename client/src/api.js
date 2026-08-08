// Read API backed by the solve-sixteen Cloudflare Worker (see ../../worker).
// Override the base for local Worker development via VITE_API_BASE.
const API_BASE =
  import.meta.env.VITE_API_BASE ||
  'https://solve-sixteen-api.tuckerwillenborg.workers.dev';

async function getJSON(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    throw new Error(`${path} responded ${res.status}`);
  }
  return res.json();
}

/** Playable dates, newest first. */
export async function getAvailableDates() {
  const { dates } = await getJSON('/api/dates');
  return dates || [];
}

/** The 16 words for a given YYYY-MM-DD date. */
export async function getGame(date) {
  const { words } = await getJSON(`/api/games/${date}`);
  return words || [];
}
