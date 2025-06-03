const db = require('./db');

async function checkEvents() {
  try {
    const events = await db.getUnprocessedEvents();
    console.log('\nSignificant Events in Outbox:');
    console.log('============================');
    
    if (events.length === 0) {
      console.log('No unprocessed events found in the outbox.');
      return;
    }

    events.forEach((event, index) => {
      console.log(`\nEvent #${index + 1}:`);
      console.log(`ID: ${event.id}`);
      console.log(`Type: ${event.type}`);
      console.log(`Version: ${event.version}`);
      console.log('Payload:', JSON.stringify(event.payload, null, 2));
      console.log(`Created At: ${event.created_at}`);
      console.log(`Processed: ${event.processed ? 'Yes' : 'No'}`);
      console.log('----------------------------');
    });

    console.log(`\nTotal events found: ${events.length}`);
  } catch (error) {
    console.error('Error checking events:', error);
  } finally {
    process.exit(0);
  }
}

checkEvents(); 