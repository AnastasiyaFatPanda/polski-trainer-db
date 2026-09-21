import 'dotenv/config';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

/**
 * Provisions one more named user with their own passphrase. There is no
 * self-signup in this app on purpose — a few people use it, and each is
 * added by hand.
 *
 * Usage:
 *   npm run add-user -- --name "Ania" --passphrase "some long random string"
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var ${name}`);
  return value;
}

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const name = arg('--name');
  const passphrase = arg('--passphrase');
  if (!name || !passphrase) {
    throw new Error('Usage: npm run add-user -- --name "Ania" --passphrase "..."');
  }
  if (passphrase.length < 12) {
    throw new Error('Pick a longer passphrase (12+ chars) — it is the only thing standing between the internet and this data.');
  }

  const mongoUri = required('MONGODB_URI');
  const client = new MongoClient(mongoUri);
  await client.connect();
  try {
    const users = client.db().collection('users');
    const existing = await users.findOne({ name });
    if (existing) {
      throw new Error(`A user named "${name}" already exists (id ${existing._id}). Pick a different name.`);
    }

    const passphraseHash = await bcrypt.hash(passphrase, 10);
    const result = await users.insertOne({ name, passphraseHash, createdAt: new Date() });
    console.log(`Created user "${name}" (id ${result.insertedId}).`);
    console.log('Give them their passphrase directly — it is hashed here and never stored in plain text.');
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error('add-user failed:', error.message ?? error);
  process.exitCode = 1;
});
