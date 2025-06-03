const mariadb = require('mariadb');

const pool = mariadb.createPool({
    host: 'localhost',
    port: 3307,
    user: 'eventuser',
    password: 'eventpass',
    database: 'eventdb',
    connectionLimit: 5
});

async function checkSignificantEvents() {
    const conn = await pool.getConnection();
    try {
        console.log('\nChecking Significant Events:');
        console.log('==========================');
        
        const events = await conn.query(
            'SELECT * FROM significant_events ORDER BY created_at DESC'
        );
        
        if (events.length === 0) {
            console.log('No significant events found.');
            return;
        }

        events.forEach((event, index) => {
            console.log(`\nEvent #${index + 1}:`);
            console.log(`ID: ${event.id}`);
            console.log(`Type: ${event.type}`);
            console.log(`Version: ${event.version}`);
            console.log('Payload:', typeof event.payload === 'string' ? event.payload : JSON.stringify(event.payload, null, 2));
            console.log(`Created At: ${event.created_at}`);
            console.log(`Processed: ${event.processed ? 'Yes' : 'No'}`);
            console.log('----------------------------');
        });

        console.log(`\nTotal events found: ${events.length}`);
    } catch (error) {
        console.error('Error checking significant events:', error);
    } finally {
        conn.release();
        process.exit(0);
    }
}

checkSignificantEvents(); 