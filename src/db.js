const mariadb = require('mariadb');
const crypto = require('crypto');

const pool = mariadb.createPool({
  host: 'localhost',
  port: 3307,
  user: 'eventuser',
  password: 'eventpass',
  database: 'eventdb',
  connectionLimit: 5
});

class OutboxRepository {
  async saveEvent(event) {
    const conn = await pool.getConnection();
    try {
      await conn.query(
        'INSERT INTO outbox (id, event_type, event_version, payload) VALUES (?, ?, ?, ?)',
        [
          event.id,
          event.type,
          event.version,
          JSON.stringify(event)
        ]
      );
    } finally {
      conn.release();
    }
  }

  async getUnprocessedEvents() {
    const conn = await pool.getConnection();
    try {
      return await conn.query(
        'SELECT * FROM outbox WHERE processed = 0 ORDER BY created_at ASC'
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

  async saveSignificantEvent(event) {
    const conn = await pool.getConnection();
    try {
      await conn.query(
        'INSERT INTO significant_events_outbox (id, event_type, event_version, payload, created_at) VALUES (?, ?, ?, ?, NOW())',
        [
          event.id || crypto.randomUUID(),
          event.type,
          event.version,
          JSON.stringify(event)
        ]
      );
    } finally {
      conn.release();
    }
  }

  async getUnprocessedSignificantEvents() {
    const conn = await pool.getConnection();
    try {
      return await conn.query(
        'SELECT * FROM significant_events_outbox WHERE processed = 0 ORDER BY created_at ASC'
      );
    } finally {
      conn.release();
    }
  }

  async markSignificantEventAsProcessed(eventId) {
    const conn = await pool.getConnection();
    try {
      await conn.query(
        'UPDATE significant_events_outbox SET processed = 1 WHERE id = ?',
        [eventId]
      );
    } finally {
      conn.release();
    }
  }
}

module.exports = new OutboxRepository(); 