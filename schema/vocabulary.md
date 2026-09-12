# `vocabulary` collection

One document, `_id: "main"` — a singleton, same as `data/vocabulary.json` was a
single file. Not modeled as one document per word on purpose: all merge/import
logic (`applyImport`, enrich-never-overwrite, `addedAt` write-once, id-as-slug)
already lives client-side in the frontend and operates on the whole document at
once. Splitting it into per-word documents would mean re-implementing that
logic server-side for no benefit at this data size (a few hundred KB).

```ts
{
  _id: "main",
  version: number,
  sets: { id: string; name: string }[],
  entries: {
    id: string,            // slug of `pl`, assigned once, never recomputed
    pl: string,
    ru: string,
    type: "word" | "phrase",
    sets: string[],        // ids into `sets` above; a word can be in several
    note?: string,
    examples: { pl: string; ru: string; source?: "file" | "generated" }[],
    addedAt?: number,      // write-once, epoch ms
  }[],
  updatedAt: Date,         // set by the API on every write
}
```

## `vocabulary_history` collection

Up to 5 previous full copies of the document above, each `{ doc, savedAt }`,
oldest trimmed on every write. Mirrors the old `vocabulary.backup.json` (one
generation) but keeps a short rolling window instead of just one.
