import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { MongoClient } from 'mongodb';

/**
 * Dumps every collection to timestamped JSON files. Worth running regularly
 * by hand (or as a cron / GitHub Action) — MongoDB Atlas's free M0 tier has
 * no automated backups, so this is the only safety net. Includes users'
 * bcrypt hashes (never plaintext passphrases) so a restore doesn't also
 * require re-provisioning everyone.
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
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');

    const collections = ['users', 'words', 'sets', 'progress'];
    for (const name of collections) {
      const docs = await db.collection(name).find({}).toArray();
      const out = path.join(backupDir, `${name}.${stamp}.json`);
      await writeFile(out, `${JSON.stringify(docs, null, 2)}\n`, 'utf8');
      console.log(`Wrote ${out} (${docs.length} docs)`);
    }
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error('Backup failed:', error.message ?? error);
  process.exitCode = 1;
});
