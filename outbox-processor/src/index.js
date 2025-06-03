const outbox = require('./db');
const rabbitmq = require('./rabbitmq');

async function processOutbox() {
  try {
    // Get unprocessed events
    const events = await outbox.getUnprocessedEvents();
    
    if (events.length === 0) {
      console.log('No unprocessed events found');
      return;
    }

    console.log(`Found ${events.length} unprocessed events`);

    // Process each event
    for (const event of events) {
      try {
        // The payload is already an object, no need to parse
        const eventData = event.payload;
        
        // Publish to RabbitMQ
        await rabbitmq.publishEvent(eventData);
        
        // Mark as processed
        await outbox.markAsProcessed(event.id);
        
        console.log(`Processed event ${event.id}`);
      } catch (error) {
        console.error(`Error processing event ${event.id}:`, error);
        // Event remains unprocessed for retry
      }
    }
  } catch (error) {
    console.error('Error in outbox processor:', error);
  }
}

// Process outbox every 5 seconds
async function startProcessor() {
  console.log('Starting outbox processor...');
  
  while (true) {
    await processOutbox();
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  await rabbitmq.close();
  process.exit(0);
});

startProcessor().catch(console.error); 