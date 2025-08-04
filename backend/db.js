import Datastore from 'nedb';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = {};

db.users = new Datastore({ filename: path.join(__dirname, 'data/users.db'), autoload: true });
db.messages = new Datastore({ filename: path.join(__dirname, 'data/messages.db'), autoload: true });
db.wellness = new Datastore({ filename: path.join(__dirname, 'data/wellness.db'), autoload: true });
db.facts = new Datastore({ filename: path.join(__dirname, 'data/facts.db'), autoload: true });

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
