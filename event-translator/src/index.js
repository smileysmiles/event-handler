const eventTranslator = require('./eventTranslator');

// Handle process termination
process.on('SIGINT', async () => {
  console.log('Received SIGINT. Cleaning up...');
  await eventTranslator.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM. Cleaning up...');
  await eventTranslator.stop();
  process.exit(0);
});

// Start the service
console.log('Starting Event Translator Service...');
eventTranslator.start().catch(error => {
  console.error('Failed to start service:', error);
  process.exit(1);
}); 