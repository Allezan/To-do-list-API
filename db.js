require('dotenv').config();
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:dev@localhost:5432/tasks';

const pool = new Pool({
  connectionString,
});

// Auto-initialize PostgreSQL database schema and seed data
const initDb = async () => {
  try {
    // Create tasks table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        done BOOLEAN NOT NULL DEFAULT FALSE
      );
    `);

    // Seed 3 example tasks ONLY if table is empty
    const countRes = await pool.query('SELECT COUNT(*) FROM tasks;');
    const rowCount = parseInt(countRes.rows[0].count, 10);

    if (rowCount === 0) {
      await pool.query(`
        INSERT INTO tasks (title, done) VALUES
        ('Learn Backend Engineering', TRUE),
        ('Build CRUD API', FALSE),
        ('Publish to GitHub', FALSE);
      `);
      console.log('PostgreSQL database seeded with initial 3 tasks.');
    }
  } catch (err) {
    console.error('Error initializing PostgreSQL database:', err.message);
  }
};

// Run initialization
initDb();

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
