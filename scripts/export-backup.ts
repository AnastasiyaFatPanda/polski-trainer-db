import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { MongoClient } from 'mongodb';

/**
 * Dumps the two singleton documents (vocabulary, progress) back to timestamped
 * JSON files. Worth running regularly by hand (or as a cron / GitHub Action) —
 * MongoDB Atlas's free M0 tier has no automated backups, so this is the only
 * safety net besides the API's own vocabulary_history / progress_history
 * collections (which only keep the last 5 generations).
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var ${name}`);
  return value;
}

async function main() {
  const mongoUri = required('MONGODB_URI');
  const backupDir = process.env.BACKUP_DIR ?? './backups';
  await mkdir(backupDir, { recursive: true });

  const client = new MongoClient(mongoUri);
  await client.connect();
  try {
    const db = client.db();
    const vocabulary = await db.collection('vocabulary').findOne({ _id: 'main' as never });
    const progress = await db.collection('progress').findOne({ _id: 'main' as never });

    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const vocabOut = path.join(backupDir, `vocabulary.${stamp}.json`);
    const progressOut = path.join(backupDir, `progress.${stamp}.json`);

    await writeFile(vocabOut, `${JSON.stringify(vocabulary, null, 2)}\n`, 'utf8');
    await writeFile(progressOut, `${JSON.stringify(progress, null, 2)}\n`, 'utf8');

    console.log(`Wrote ${vocabOut}`);
    console.log(`Wrote ${progressOut}`);
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error('Backup failed:', error.message ?? error);
  process.exitCode = 1;
});
