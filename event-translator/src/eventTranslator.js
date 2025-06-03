const rabbitmq = require('./rabbitmq');
const db = require('./db');
const crypto = require('crypto');

class EventTranslator {
  constructor() {
    this.channel = null;
    this.isConsuming = false;
  }

  async start() {
    if (this.isConsuming) return;
    
    // Initialize database
    await db.init();
    console.log('Database initialized');
    
    // Connect to RabbitMQ
    await rabbitmq.connect();
    this.channel = rabbitmq.channel;
    console.log('Connected to RabbitMQ');

    // Start consuming
    await this.channel.consume('test-queue', async (msg) => {
      if (msg !== null) {
        try {
          console.log('Received message from queue');
          const event = JSON.parse(msg.content.toString());
          console.log('Parsed event:', JSON.stringify(event, null, 2));
          
          const significantEvent = this.translateToSignificantEvent(event);
          console.log('Translated event:', significantEvent ? JSON.stringify(significantEvent, null, 2) : 'No translation found');
          
          if (significantEvent) {
            console.log('Saving to significant_events table...');
            await db.saveSignificantEvent(significantEvent);
            console.log('Successfully saved significant event');
          }
          
          this.channel.ack(msg);
          console.log('Message acknowledged');
        } catch (error) {
          console.error('Error processing message:', error);
          // Reject the message and requeue it
          this.channel.nack(msg, false, true);
        }
      }
    });

    this.isConsuming = true;
    console.log('Started consuming and translating events from test-queue');
  }

  translateToSignificantEvent(domainEvent) {
    console.log('Translating event type:', domainEvent.type);
    // Define your translation logic here based on event type
    const translations = {
      'PlayerLocked': (event) => ({
        id: crypto.randomUUID(),
        type: 'PLAYER_ACCOUNT_LOCKED',
        version: '1.0',
        payload: {
          playerId: event.data.playerId,
          reason: event.data.reason,
          lockedAt: event.data.lockedAt,
          source: event.source,
          correlationId: event.correlationId
        }
      }),
      'user.created': (event) => ({
        id: crypto.randomUUID(),
        type: 'USER_REGISTERED',
        version: '1.0',
        payload: {
          userId: event.payload.id,
          email: event.payload.email,
          timestamp: event.timestamp
        }
      }),
      'order.completed': (event) => ({
        id: crypto.randomUUID(),
        type: 'PURCHASE_COMPLETED',
        version: '1.0',
        payload: {
          orderId: event.payload.id,
          amount: event.payload.total,
          customerId: event.payload.customerId,
          timestamp: event.timestamp
        }
      })
    };

    const translator = translations[domainEvent.type];
    if (!translator) {
      console.log(`No translation found for event type: ${domainEvent.type}`);
      return null;
    }

    return translator(domainEvent);
  }

  async stop() {
    if (this.channel) {
      await this.channel.cancel('test-queue');
      this.isConsuming = false;
      console.log('Stopped consuming events');
    }
    await rabbitmq.close();
  }
}

module.exports = new EventTranslator(); 