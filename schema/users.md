# `users` collection

One document per person using the app. No self-signup — provisioned by hand
with `add-user.ts` (or created automatically by `migrate-up.ts` for the first
user). A handful of documents, ever.

```ts
{
  _id: ObjectId,
  name: string,             // display name, also the lookup key for add-user
  passphraseHash: string,   // bcrypt hash — the passphrase itself is never stored
  createdAt: Date,
}
```

Login is passphrase-only: the API scans every user and `bcrypt.compare`s the
presented passphrase against each hash (see `polski-trainer-api/src/middleware/auth.ts`).
Whichever matches identifies the user for that request. Fine at "a few users"
scale; would not scale to public signup, which this app deliberately has none of.
