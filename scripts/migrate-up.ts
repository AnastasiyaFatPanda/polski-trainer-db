import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { MongoClient } from 'mongodb';

/**
 * One-time (or re-run-safe with --force) import of the frontend's
 * data/vocabulary.json and data/progress.json into Atlas, matching the
 * singleton-document shape polski-trainer-api expects (_id: 'main').
 *
 * Usage:
 *   npm run migrate-up            # refuses to overwrite existing data
 *   npm run migrate-up -- --force # overwrites whatever is already there
 */

const force = process.argv.includes('--force');

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var ${name}`);
  return value;
}

async function main() {
  const mongoUri = required('MONGODB_URI');
  const dataDir = required('FRONTEND_DATA_DIR');

  const vocabPath = path.resolve(dataDir, 'vocabulary.json');
  const progressPath = path.resolve(dataDir, 'progress.json');

  console.log(`Reading ${vocabPath}`);
  const vocabulary = JSON.parse(await readFile(vocabPath, 'utf8')) as {
    version: number;
    sets: unknown[];
    entries: unknown[];
  };

  console.log(`Reading ${progressPath}`);
  const progress = JSON.parse(await readFile(progressPath, 'utf8')) as Record<string, unknown>;

  const client = new MongoClient(mongoUri);
  await client.connect();
  try {
    const db = client.db();

    const existingVocab = await db.collection('vocabulary').findOne({ _id: 'main' as never });
    const existingProgress = await db.collection('progress').findOne({ _id: 'main' as never });
    if ((existingVocab || existingProgress) && !force) {
      throw new Error(
        'Atlas already has a "main" document in vocabulary and/or progress. ' +
          'Re-run with --force to overwrite, or use export-backup.ts first if you want a copy.',
      );
    }

    await db.collection('vocabulary').replaceOne(
      { _id: 'main' as never },
      { _id: 'main', version: vocabulary.version, sets: vocabulary.sets, entries: vocabulary.entries, updatedAt: new Date() } as never,
      { upsert: true },
    );
    console.log(`vocabulary: wrote ${vocabulary.entries.length} entries, ${vocabulary.sets.length} sets`);

    await db.collection('progress').replaceOne(
      { _id: 'main' as never },
      { _id: 'main', data: progress, updatedAt: new Date() } as never,
      { upsert: true },
    );
    console.log(`progress: wrote ${Object.keys(progress).length} word records`);

    console.log('Migration complete.');
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error('Migration failed:', error.message ?? error);
  process.exitCode = 1;
});
