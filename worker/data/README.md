# Local data exports

This directory is where local backups of the puzzle store live. **Nothing here
is committed** — `.gitignore` excludes `*.json` and `*.sql` on purpose.

Puzzle exports are bulk NYT content. They include each category's `title`,
which is precisely what this project otherwise refuses to surface (see the
copyright note in the root README — the game deliberately does not validate
picks or show category names). Publishing that in a public repository would
contradict that stance, so the data stays behind the database.

## Making a backup

```bash
wrangler d1 export solve-sixteen --remote --output=worker/data/backup.sql
```

That captures both `words` and `original_data`, the latter being the NYT feed
response verbatim — per-card `position`, plus the puzzle's `editor`, `id` and
`print_date`, none of which are recoverable from `words` alone.

## Historical note

The original Firestore export taken at migration on 2026-08-08 (175 puzzles,
2026-02-15 through 2026-08-08) was briefly committed here and has since been
removed from history. It is retained locally only. All of its content now lives
in D1, and the Worker persists the same raw payload on every scrape.
