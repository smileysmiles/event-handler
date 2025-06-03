const mariadb = require('mariadb');

const pool = mariadb.createPool({
  host: 'localhost',
  port: 3307,
  user: 'eventuser',
  password: 'eventpass',
  database: 'eventdb',
  connectionLimit: 5
});

class OutboxRepository {
  async getUnprocessedEvents(limit = 10) {
    const conn = await pool.getConnection();
    try {
      return await conn.query(
        'SELECT * FROM outbox WHERE processed = 0 ORDER BY created_at ASC LIMIT ?',
        [limit]
      );
    } finally {
      conn.release();
    }
  }

  async markAsProcessed(eventId) {
    const conn = await pool.getConnection();
    try {
      await conn.query(
        'UPDATE outbox SET processed = 1 WHERE id = ?',
        [eventId]
      );
    } finally {
      conn.release();
    }
  }
}

module.exports = new OutboxRepository(); 