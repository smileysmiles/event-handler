const { v4: uuidv4 } = require('uuid');
const EventDispatcher = require('./dispatch');

async function pushTestEvents() {
    const dispatcher = new EventDispatcher();

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
        console.log('\nPushing v1 event:');
        console.log(JSON.stringify(v1Event, null, 2));
        await dispatcher.dispatch(v1Event);

        // Dispatch v2 event
        console.log('\nPushing v2 event:');
        console.log(JSON.stringify(v2Event, null, 2));
        await dispatcher.dispatch(v2Event);

        console.log('\nEvents have been pushed to the outbox successfully!');
    } catch (error) {
        console.error('Error pushing events:', error);
    } finally {
        process.exit(0);
    }
}

pushTestEvents(); 