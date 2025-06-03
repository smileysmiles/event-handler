const outbox = require('./db');

async function republishEvents() {
  try {
    // Get all processed events
    const conn = await outbox.pool.getConnection();
    try {
      const events = await conn.query(
        'SELECT * FROM outbox WHERE processed = 1 ORDER BY created_at ASC'
      );

      if (events.length === 0) {
        console.log('No processed events found to republish');
        return;
      }

      console.log(`Found ${events.length} processed events to republish`);

      // Reset processed status for all events
      await conn.query(
        'UPDATE outbox SET processed = 0 WHERE processed = 1'
      );

      console.log('Successfully reset processed status for all events');
      console.log('Events will be picked up by the outbox processor and republished to RabbitMQ');
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Error republishing events:', error);
  } finally {
    process.exit(0);
  }
}

// Run the republish function
republishEvents(); 