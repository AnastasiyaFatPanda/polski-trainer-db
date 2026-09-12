# AGENTS.md

## Git — manual only, never AI

AI assistants (Claude or any other coding agent) working in this repo must
**never** run `git commit`, `git push`, `git fetch`, or `git pull`, and must
never stage, commit, publish, or sync changes to the remote — not even if a
task explicitly asks for it. Publishing changes to git is done manually, by
Duchess, only. Read-only inspection (`git status`, `git diff`, `git log`) is
fine when it helps understand the current state.

Schema docs and one-off migration/backup scripts for the polski-trainer
MongoDB Atlas database. Not a running service. See `README.md`.
