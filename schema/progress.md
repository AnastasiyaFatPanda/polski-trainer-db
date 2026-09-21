# `progress` collection

One document per (user, word) progress record.

```ts
{
  _id: `${userId}_${entryId}`,
  userId: ObjectId,
  entryId: string,
  correct: number,
  wrong: number,
  streak: number,
  lastSeen: number,   // epoch ms
}
```

Same "one small document, not one big map" reasoning as `words`. The frontend
still fetches/saves the whole map in one request
(`GET/PUT /api/progress`) — the API assembles it from these rows on GET and
upserts one row per changed word on PUT. Merge-by-newer-`lastSeen` still
happens client-side (`src/lib/progressStore.ts` in the frontend), exactly as
before; the API just stores whatever it's given, same as the old file writer.

Progress rows are never deleted by the API — an orphaned record (from a
deleted word) is harmless and left in place, same as the old file-based app.
