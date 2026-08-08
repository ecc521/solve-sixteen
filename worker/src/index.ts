export interface Env {
    DB: D1Database;
}

interface Word {
    id: string;
    text?: string;
    imageUrl?: string;
    imageAlt?: string;
    category: string;
    difficulty: string;
}

interface NYTCategory {
    title: string;
    cards: { content?: string; image_url?: string; image_alt_text?: string }[];
}

interface NYTResponse {
    status: string;
    categories: NYTCategory[];
}

const DIFF_MAP: { [key: number]: string } = { 0: 'easy', 1: 'medium', 2: 'hard', 3: 'tricky' };

const CORS: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json', ...CORS, ...extra },
    });
}

// Puzzles are keyed to the New York Times' own date, so resolve dates in ET
// rather than trusting the Worker's UTC clock. 'en-CA' formats as YYYY-MM-DD.
function nytDate(offsetDays = 0): string {
    const d = new Date(Date.now() + offsetDays * 86_400_000);
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(d);
}

function transform(data: NYTResponse): Word[] {
    const words: Word[] = [];

    data.categories.forEach((cat, index) => {
        const difficulty = DIFF_MAP[index] || 'unknown';

        cat.cards.forEach((card, cardIndex) => {
            const word: Word = {
                id: `${index}-${cardIndex}`,
                category: cat.title,
                difficulty: difficulty,
            };

            if (card.content) {
                word.text = card.content;
            } else if (card.image_url) {
                word.imageUrl = card.image_url;
                if (card.image_alt_text) {
                    word.imageAlt = card.image_alt_text;
                }
            }

            words.push(word);
        });
    });

    return words;
}

async function scrapeAndStore(env: Env, date: string): Promise<Word[] | null> {
    const url = `https://www.nytimes.com/svc/connections/v2/${date}.json`;

    try {
        const res = await fetch(url, { headers: { 'User-Agent': 'solve-sixteen' } });
        if (!res.ok) {
            console.error(`NYT ${date}: HTTP ${res.status}`);
            return null;
        }

        const data = (await res.json()) as NYTResponse;
        if (data.status !== 'OK') {
            console.error(`NYT ${date}: status ${data.status}`);
            return null;
        }

        const words = transform(data);
        if (words.length !== 16) {
            console.error(`NYT ${date}: expected 16 words, got ${words.length}`);
            return null;
        }

        await env.DB.prepare(
            `INSERT INTO games (date, words, updated_at) VALUES (?, ?, datetime('now'))
             ON CONFLICT(date) DO UPDATE SET words = excluded.words, updated_at = excluded.updated_at`
        ).bind(date, JSON.stringify(words)).run();

        return words;
    } catch (error) {
        console.error(`Error scraping game for ${date}:`, error);
        return null;
    }
}

// Always refresh today, and fill in any of the previous three days that are
// missing. A failed run then self-heals on the next trigger rather than
// leaving a permanent hole the way the Cloud Function did.
async function runScrape(env: Env): Promise<Record<string, string>> {
    const candidates = [0, -1, -2, -3].map((offset) => nytDate(offset));
    const [today, ...backfill] = candidates;

    const { results } = await env.DB.prepare(
        `SELECT date FROM games WHERE date IN (?, ?, ?)`
    ).bind(...backfill).all<{ date: string }>();
    const present = new Set(results.map((r) => r.date));

    const outcome: Record<string, string> = {};
    for (const date of candidates) {
        if (date !== today && present.has(date)) {
            outcome[date] = 'present';
            continue;
        }
        outcome[date] = (await scrapeAndStore(env, date)) ? 'stored' : 'failed';
    }
    return outcome;
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: CORS });
        }
        if (request.method !== 'GET') {
            return json({ error: 'method not allowed' }, 405);
        }

        const path = new URL(request.url).pathname.replace(/\/+$/, '');

        if (path === '' || path === '/api') {
            return json({
                service: 'solve-sixteen-api',
                endpoints: ['/api/dates', '/api/games/{YYYY-MM-DD}'],
            });
        }

        if (path === '/api/dates') {
            const { results } = await env.DB.prepare(
                `SELECT date FROM games ORDER BY date DESC`
            ).all<{ date: string }>();
            return json({ dates: results.map((r) => r.date) }, 200, {
                'Cache-Control': 'public, max-age=300',
            });
        }

        const match = path.match(/^\/api\/games\/(\d{4}-\d{2}-\d{2})$/);
        if (match) {
            const date = match[1];
            const row = await env.DB.prepare(
                `SELECT words FROM games WHERE date = ?`
            ).bind(date).first<{ words: string }>();

            if (!row) {
                return json({ error: 'not found', date }, 404);
            }
            // Past puzzles never change, so they cache hard.
            return json({ date, words: JSON.parse(row.words) }, 200, {
                'Cache-Control': 'public, max-age=86400',
            });
        }

        return json({ error: 'not found' }, 404);
    },

    async scheduled(_event: ScheduledController, env: Env): Promise<void> {
        const outcome = await runScrape(env);
        console.log('scrape:', JSON.stringify(outcome));
    },
};
