# polski-trainer-db

Schema docs and one-off scripts for the MongoDB Atlas database behind
[polski-trainer-api](https://github.com/AnastasiyaFatPanda/polski-trainer-api).
Not a running service — you run these by hand when you need them.

See `schema/vocabulary.md` and `schema/progress.md` for the collection shapes.

## Setup

```bash
cp .env.example .env   # fill in MONGODB_URI and FRONTEND_DATA_DIR
npm install
```

## One-time: seed Atlas from your existing local data

```bash
npm run migrate-up
```

Refuses to run if `vocabulary`/`progress` documents already exist in Atlas —
pass `-- --force` to overwrite intentionally.

## Ongoing: back up the live data

MongoDB Atlas's free M0 tier has **no automated backups**. Run this
periodically (weekly is plenty for a slow-growing vocab list) and keep the
`backups/` folder somewhere safe (it's gitignored — don't commit real data):

```bash
npm run export-backup
```
