# AGENTS.md

## Env files — never read, never write

AI assistants must **never** read or write `.env` files in this repo — not to
check a value, fix a typo, debug a connection, or verify anything. By default,
assume `.env` doesn't exist to you: everything you need to know about
environment configuration lives in `.env.example` only. If an env-related
change is needed, edit `.env.example` and tell Duchess to apply it to her own
`.env` herself.

## Git — manual only, never AI

AI assistants (Claude or any other coding agent) working in this repo must
**never** run `git commit`, `git push`, `git fetch`, or `git pull`, and must
never stage, commit, publish, or sync changes to the remote — not even if a
task explicitly asks for it. Publishing changes to git is done manually, by
Duchess, only. Read-only inspection (`git status`, `git diff`, `git log`) is
fine when it helps understand the current state.

Schema docs and one-off migration/backup scripts for the polski-trainer
MongoDB Atlas database. Not a running service. See `README.md`.
