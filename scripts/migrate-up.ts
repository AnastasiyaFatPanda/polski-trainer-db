import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { MongoClient, ObjectId, type AnyBulkWriteOperation } from 'mongodb';
import bcrypt from 'bcryptjs';

/**
 * Imports one person's existing data/vocabulary.json + data/progress.json
 * from the frontend repo into Atlas, as per-word/per-set/per-progress-record
 * documents scoped to a (created-if-needed) user — never as one giant blob.
 *
 * Usage:
 *   npm run migrate-up -- --name "Duchess" --passphrase "..."
 *   npm run migrate-up -- --name "Duchess" --passphrase "..." --force   # re-import on top of an existing user
 */

const force = process.argv.includes('--force');

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var ${name}`);
  return value;
}

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

interface VocabEntry {
  id: string;
  pl: string;
  ru: string;
  type: string;
  sets: string[];
  note?: string;
  examples: { pl: string; ru: string; source?: string }[];
  addedAt?: number;
}

interface VocabFile {
  version: number;
  sets: { id: string; name: string }[];
  entries: VocabEntry[];
}

type ProgressFile = Record<string, { correct: number; wrong: number; streak: number; lastSeen: number }>;

interface SetDoc {
  _id: string;
  userId: ObjectId;
  setId: string;
  name: string;
}

interface WordDoc {
  _id: string;
  userId: ObjectId;
  entryId: string;
  pl: string;
  ru: string;
  type: string;
  sets: string[];
  note?: string;
  examples: { pl: string; ru: string; source?: string }[];
  addedAt?: number;
}

interface ProgressDoc {
  _id: string;
  userId: ObjectId;
  entryId: string;
  correct: number;
  wrong: number;
  streak: number;
  lastSeen: number;
}

async function main() {
  const name = arg('--name');
  const passphrase = arg('--passphrase');
  if (!name || !passphrase) {
    throw new Error('Usage: npm run migrate-up -- --name "Duchess" --passphrase "..." [--force]');
  }

  const mongoUri = required('MONGODB_URI');
  const dataDir = required('FRONTEND_DATA_DIR');

  const vocabPath = path.resolve(dataDir, 'vocabulary.json');
  const progressPath = path.resolve(dataDir, 'progress.json');

  console.log(`Reading ${vocabPath}`);
  const vocabulary = JSON.parse(await readFile(vocabPath, 'utf8')) as VocabFile;

  console.log(`Reading ${progressPath}`);
  const progress = JSON.parse(await readFile(progressPath, 'utf8')) as ProgressFile;

  const client = new MongoClient(mongoUri);
  await client.connect();
  try {
    const db = client.db();
    const usersCol = db.collection('users');
    const wordsCol = db.collection<WordDoc>('words');
    const setsCol = db.collection<SetDoc>('sets');
    const progressCol = db.collection<ProgressDoc>('progress');

    let user = await usersCol.findOne({ name });
    if (user && !force) {
      throw new Error(
        `User "${name}" already exists (id ${user._id}). Re-run with --force to re-import on top of it, ` +
          'or run export-backup.ts first if you want a safety copy.',
      );
    }
    if (!user) {
      const passphraseHash = await bcrypt.hash(passphrase, 10);
      const result = await usersCol.insertOne({ name, passphraseHash, createdAt: new Date() });
      user = { _id: result.insertedId, name, passphraseHash, createdAt: new Date() };
      console.log(`Created user "${name}" (id ${user._id}).`);
    } else {
      console.log(`Using existing user "${name}" (id ${user._id}).`);
    }
    const userId = user._id;

    const setOps: AnyBulkWriteOperation<SetDoc>[] = vocabulary.sets.map((s) => ({
      updateOne: {
        filter: { _id: `${userId}_${s.id}` },
        update: { $set: { _id: `${userId}_${s.id}`, userId, setId: s.id, name: s.name } },
        upsert: true,
      },
    }));
    if (setOps.length) await setsCol.bulkWrite(setOps);

    const wordOps: AnyBulkWriteOperation<WordDoc>[] = vocabulary.entries.map((e) => ({
      updateOne: {
        filter: { _id: `${userId}_${e.id}` },
        update: {
          $set: {
            _id: `${userId}_${e.id}`,
            userId,
            entryId: e.id,
            pl: e.pl,
            ru: e.ru,
            type: e.type,
            sets: e.sets,
            note: e.note,
            examples: e.examples,
            addedAt: e.addedAt,
          },
        },
        upsert: true,
      },
    }));
    if (wordOps.length) await wordsCol.bulkWrite(wordOps);

    const progressOps: AnyBulkWriteOperation<ProgressDoc>[] = Object.entries(progress).map(([entryId, record]) => ({
      updateOne: {
        filter: { _id: `${userId}_${entryId}` },
        update: { $set: { _id: `${userId}_${entryId}`, userId, entryId, ...record } },
        upsert: true,
      },
    }));
    if (progressOps.length) await progressCol.bulkWrite(progressOps);

    console.log(
      `Imported ${vocabulary.entries.length} words, ${vocabulary.sets.length} sets, ` +
        `${progressOps.length} progress records for "${name}".`,
    );
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error('Migration failed:', error.message ?? error);
  process.exitCode = 1;
});
