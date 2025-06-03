const outbox = require('./db');

async function checkOutbox() {
    try {
        const events = await outbox.getUnprocessedEvents();
        console.log('\nEvents in Outbox:');
        console.log('================');
        
        if (events.length === 0) {
            console.log('No unprocessed events found in the outbox.');
            return;
        }

        events.forEach((event, index) => {
            console.log(`\nEvent #${index + 1}:`);
            console.log(`ID: ${event.id}`);
            console.log(`Type: ${event.event_type}`);
            console.log(`Version: ${event.event_version}`);
            console.log('Payload:', JSON.stringify(JSON.parse(event.payload), null, 2));
            console.log(`Created At: ${event.created_at}`);
            console.log(`Processed: ${event.processed ? 'Yes' : 'No'}`);
            console.log('----------------------------');
        });

        console.log(`\nTotal events found: ${events.length}`);
    } catch (error) {
        console.error('Error checking outbox:', error);
    } finally {
        process.exit(0);
    }
}

checkOutbox(); 