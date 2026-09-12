# `progress` collection

One document, `_id: "main"`, `data` holds the whole progress map exactly as
`data/progress.json` did — keyed by entry id:

```ts
{
  _id: "main",
  data: {
    [entryId: string]: {
      correct: number,
      wrong: number,
      streak: number,
      lastSeen: number,   // epoch ms
    }
  },
  updatedAt: Date,
}
```

Merge-by-newer-`lastSeen` (never field-by-field, never summed) happens
client-side in `src/lib/progressStore.ts` / `src/lib/progress.ts`, exactly as
before — the API just stores whatever whole map it's given, same as the old
file writer did.

## `progress_history` collection

Up to 5 previous copies, `{ data, savedAt }`, mirrors `progress.backup.json`.
