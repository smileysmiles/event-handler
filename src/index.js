const { v4: uuidv4 } = require('uuid');
const EventDispatcher = require('./dispatch');
const outbox = require('./db');

async function main() {
  const dispatcher = new EventDispatcher();

  // Register handlers for PlayerLocked event
  dispatcher.on('PlayerLocked', async (event) => {
    console.log('Handling PlayerLocked v1:', event.data);
    // Handle v1 event
  }, 1.0);

  dispatcher.on('PlayerLocked', async (event) => {
    console.log('Handling PlayerLocked v2:', event.data);
    // Handle v2 event with lockedAt field
  }, 2.0);

  // Create a v1 event
  const v1Event = {
    id: uuidv4(),
    type: 'PlayerLocked',
    createdAt: new Date().toISOString(),
    correlationId: uuidv4(),
    causationId: null,
    source: 'player-service',
    version: '1.0',
    data: {
      playerId: '123',
      reason: 'fraud'
    }
  };

  // Create a v2 event
  const v2Event = {
    ...v1Event,
    id: uuidv4(),
    version: '2.0',
    data: {
      ...v1Event.data,
      lockedAt: new Date().toISOString()
    }
  };

  try {
    // Dispatch v1 event
    console.log('\nDispatching v1 event:');
    await dispatcher.dispatch(v1Event);

    // Dispatch v2 event
    console.log('\nDispatching v2 event:');
    await dispatcher.dispatch(v2Event);

    // Show unprocessed events in outbox
    console.log('\nUnprocessed events in outbox:');
    const unprocessed = await outbox.getUnprocessedEvents();
    console.log(unprocessed);
  } catch (error) {
    console.error('Error dispatching events:', error);
  }
}

main().catch(console.error); 