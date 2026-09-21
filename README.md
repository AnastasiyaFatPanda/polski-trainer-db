# polski-trainer-db

Schema docs and one-off scripts for the MongoDB Atlas database behind
[polski-trainer-api](https://github.com/AnastasiyaFatPanda/polski-trainer-api).
Not a running service — you run these by hand when you need them.

See `schema/users.md`, `schema/vocabulary.md` and `schema/progress.md` for the
collection shapes. Four collections total: `users`, `words`, `sets`,
`progress` — each a normal collection of many small documents, not a
singleton blob.

## Setup

```bash
cp .env.example .env   # fill in MONGODB_URI and FRONTEND_DATA_DIR
npm install
```

## Add a person

```bash
npm run add-user -- --name "Ania" --passphrase "some long random string"
```

No self-signup on purpose — a few people use this app, and each is added by
hand. The passphrase is hashed before it's stored; give it to that person
directly, it's not recoverable from the database afterwards.

## One-time per person: seed Atlas from their existing local data

```bash
npm run migrate-up -- --name "Duchess" --passphrase "..."
```

Creates the user if they don't exist yet, then imports `data/vocabulary.json`
and `data/progress.json` (from `FRONTEND_DATA_DIR`) as per-word/per-set/
per-progress-record documents scoped to them. Refuses to touch an existing
user's data unless you add `--force`.

## Ongoing: back up the live data

MongoDB Atlas's free M0 tier has **no automated backups**. Run this
periodically (weekly is plenty for a slow-growing vocab list) and keep the
`backups/` folder somewhere safe (it's gitignored — don't commit real data):

```bash
npm run export-backup
```

Dumps every collection (`users`, `words`, `sets`, `progress`) to timestamped
JSON files.
