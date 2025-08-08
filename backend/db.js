import Datastore from 'nedb';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine the database path based on the environment
const isNetlify = process.env.NETLIFY === 'true';
const dbPath = isNetlify ? path.join(os.tmpdir(), 'data') : path.join(__dirname, 'data');

// Create the data directory if it doesn't exist (especially for /tmp)
if (isNetlify && !fs.existsSync(dbPath)) {
  fs.mkdirSync(dbPath, { recursive: true });
}

const db = {};

console.log(`Initializing NeDB in: ${dbPath}`);

db.users = new Datastore({ filename: path.join(dbPath, 'users.db'), autoload: true });
db.messages = new Datastore({ filename: path.join(dbPath, 'messages.db'), autoload: true });
db.wellness = new Datastore({ filename: path.join(dbPath, 'wellness.db'), autoload: true });
db.facts = new Datastore({ filename: path.join(dbPath, 'facts.db'), autoload: true });

// Ensure indexes for faster lookups
db.users.ensureIndex({ fieldName: 'userId', unique: true }, function (err) {
  if (err) console.error('Error ensuring user index:', err);
  else console.log('User index ensured.');
});
db.messages.ensureIndex({ fieldName: 'userId' }, function (err) {
  if (err) console.error('Error ensuring message user index:', err);
  else console.log('Message user index ensured.');
});
db.wellness.ensureIndex({ fieldName: 'userId' }, function (err) {
  if (err) console.error('Error ensuring wellness user index:', err);
  else console.log('Wellness user index ensured.');
});
db.facts.ensureIndex({ fieldName: 'userId' }, function (err) {
  if (err) console.error('Error ensuring facts user index:', err);
  else console.log('Facts user index ensured.');
});

console.log('NeDB databases initialized.');

export default db;
