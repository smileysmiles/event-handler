const mariadb = require('mariadb');
require('dotenv').config();

const pool = mariadb.createPool({
  host: 'localhost',
  port: 3307,
  user: 'eventuser',
  password: 'eventpass',
  database: 'eventdb',
  connectionLimit: 5
});

class SignificantEventRepository {
  async init() {
    console.log('Initializing database...');
    const conn = await pool.getConnection();
    try {
      // Create significant_events table if it doesn't exist
      await conn.query(`
        CREATE TABLE IF NOT EXISTS significant_events (
          id VARCHAR(36) PRIMARY KEY,
          type VARCHAR(100) NOT NULL,
          version VARCHAR(10) NOT NULL,
          payload JSON NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          processed BOOLEAN DEFAULT FALSE
        )
      `);
      console.log('Database table initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    } finally {
      conn.release();
    }
  }

  async saveSignificantEvent(event) {
    console.log('Attempting to save event:', event);
    const conn = await pool.getConnection();
    try {
      const result = await conn.query(
        'INSERT INTO significant_events (id, type, version, payload) VALUES (?, ?, ?, ?)',
        [
          event.id || crypto.randomUUID(),
          event.type,
          event.version,
          JSON.stringify(event.payload)
        ]
      );
      console.log('Save result:', result);
    } catch (error) {
      console.error('Error saving event:', error);
      throw error;
    } finally {
      conn.release();
    }
  }

  async getUnprocessedEvents() {
    const conn = await pool.getConnection();
    try {
      return await conn.query(
        'SELECT * FROM significant_events WHERE processed = 0 ORDER BY created_at ASC'
      );
    } finally {
      conn.release();
    }
  }

  async markAsProcessed(eventId) {
    const conn = await pool.getConnection();
    try {
      await conn.query(
        'UPDATE significant_events SET processed = 1 WHERE id = ?',
        [eventId]
      );
    } finally {
      conn.release();
    }
  }
}

module.exports = new SignificantEventRepository(); 