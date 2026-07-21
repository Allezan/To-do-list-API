const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'tasks.db');
const db = new Database(dbPath);

// Enable Write-Ahead Logging for better concurrency
db.pragma('journal_mode = WAL');

// Initialize tasks table if it does not exist
const initDb = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      done INTEGER NOT NULL DEFAULT 0
    )
  `);

  // Seed default 3 tasks ONLY if table is empty
  const countRow = db.prepare('SELECT COUNT(*) AS count FROM tasks').get();

  if (countRow.count === 0) {
    const insert = db.prepare('INSERT INTO tasks (title, done) VALUES (?, ?)');
    const seedMany = db.transaction((seedItems) => {
      for (const item of seedItems) {
        insert.run(item.title, item.done);
      }
    });

    seedMany([
      { title: 'Learn Backend Engineering', done: 1 },
      { title: 'Build CRUD API', done: 0 },
      { title: 'Publish to GitHub', done: 0 }
    ]);
  }
};

initDb();

module.exports = db;
