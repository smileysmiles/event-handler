const mariadb = require('mariadb');

const pool = mariadb.createPool({
    host: 'localhost',
    port: 3307,
    user: 'eventuser',
    password: 'eventpass',
    database: 'eventdb',
    connectionLimit: 5
});

async function initDatabase() {
    const conn = await pool.getConnection();
    try {
        console.log('Initializing database...');
        
        // Create outbox table
        await conn.query(`
            CREATE TABLE IF NOT EXISTS outbox (
                id VARCHAR(36) PRIMARY KEY,
                event_type VARCHAR(100) NOT NULL,
                event_version VARCHAR(10) NOT NULL,
                payload JSON NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                processed BOOLEAN DEFAULT FALSE
            )
        `);
        
        console.log('Database initialized successfully!');
    } catch (error) {
        console.error('Error initializing database:', error);
    } finally {
        conn.release();
        process.exit(0);
    }
}

initDatabase(); 