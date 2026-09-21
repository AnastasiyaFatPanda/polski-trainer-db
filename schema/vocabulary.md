# `words` and `sets` collections

**One document per word, one document per set** — not one giant document per
user. That's the whole point of using a database once a vocabulary can reach
thousands of entries: a single word is read, edited or deleted as its own
small document, not by rewriting everyone's entire list.

```ts
// words
{
  _id: `${userId}_${entryId}`,   // primary-key lookup, no extra index needed for a single word
  userId: ObjectId,
  entryId: string,               // the frontend's stable slug id — never recomputed, see its AGENTS.md
  pl: string,
  ru: string,
  type: "word" | "phrase",
  sets: string[],                 // ids into this user's `sets` documents; a word can be in several
  note?: string,
  examples: { pl: string; ru: string; source?: "file" | "generated" }[],
  addedAt?: number,                // write-once, epoch ms
}
```

```ts
// sets
{
  _id: `${userId}_${setId}`,
  userId: ObjectId,
  setId: string,
  name: string,
}
```

Indexes: `{ userId: 1 }` on both (list a user's words/sets), plus a unique
`{ userId: 1, entryId|setId: 1 }` as a belt-and-braces duplicate guard (the
`_id` already encodes this, but the explicit index makes intent clear and
gives Mongo a query plan for lookups by field rather than by `_id` string).

## How the API still speaks one JSON document

The frontend fetches/saves the whole vocabulary as one object
(`GET/PUT /api/vocabulary`, unchanged contract). The API assembles that shape
from these per-word/per-set documents on GET, and on PUT diffs the incoming
list against what's stored — upserting changed/new words and deleting removed
ones, each as its own small write. See `polski-trainer-api/src/routes/vocabulary.ts`.
At 10k words this is still a small JSON payload over the wire (a few MB at
most), so the wire contract didn't need to change — only the storage
underneath, from one blob to many rows.
