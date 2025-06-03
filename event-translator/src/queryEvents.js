const mariadb = require('mariadb');
require('dotenv').config();

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5
});

async function queryEvents() {
  const conn = await pool.getConnection();
  try {
    const events = await conn.query(`
      SELECT id, type, version, payload, created_at, processed 
      FROM significant_events 
      ORDER BY created_at DESC
    `);
    
    console.log('\nSignificant Events:');
    console.log('==================');
    
    if (events.length === 0) {
      console.log('No events found in the database.');
      return;
    }

    events.forEach(event => {
      console.log(`\nID: ${event.id}`);
      console.log(`Type: ${event.type}`);
      console.log(`Version: ${event.version}`);
      console.log('Payload:', event.payload);
      console.log(`Created: ${event.created_at}`);
      console.log(`Processed: ${event.processed ? 'Yes' : 'No'}`);
      console.log('------------------');
    });

    console.log(`\nTotal events: ${events.length}`);
  } catch (error) {
    console.error('Error querying events:', error);
  } finally {
    conn.release();
    process.exit(0);
  }
}

queryEvents(); 