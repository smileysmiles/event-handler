const rabbitmq = require('./rabbitmq');
const db = require('./db');

class EventConsumer {
  constructor() {
    this.channel = null;
    this.isConsuming = false;
  }

  async start() {
    if (this.isConsuming) return;
    
    await rabbitmq.connect();
    this.channel = rabbitmq.channel;
    
    // Create a queue for significant events
    await this.channel.assertQueue('significant_events', {
      durable: true
    });

    // Bind to the events exchange with a pattern that matches all events
    await this.channel.bindQueue('significant_events', 'events', '#');

    // Start consuming
    await this.channel.consume('significant_events', async (msg) => {
      if (msg !== null) {
        try {
          const event = JSON.parse(msg.content.toString());
          const significantEvent = this.translateToSignificantEvent(event);
          
          if (significantEvent) {
            await db.saveSignificantEvent(significantEvent);
          }
          
          this.channel.ack(msg);
        } catch (error) {
          console.error('Error processing message:', error);
          // Reject the message and requeue it
          this.channel.nack(msg, false, true);
        }
      }
    });

    this.isConsuming = true;
    console.log('Started consuming events from RabbitMQ');
  }

  translateToSignificantEvent(domainEvent) {
    // Define your translation logic here based on event type
    const translations = {
      'user.created': (event) => ({
        type: 'USER_REGISTERED',
        version: '1.0',
        payload: {
          userId: event.payload.id,
          email: event.payload.email,
          timestamp: event.timestamp
        }
      }),
      'order.completed': (event) => ({
        type: 'PURCHASE_COMPLETED',
        version: '1.0',
        payload: {
          orderId: event.payload.id,
          amount: event.payload.total,
          customerId: event.payload.customerId,
          timestamp: event.timestamp
        }
      })
      // Add more translations as needed
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
      await this.channel.cancel('significant_events');
      this.isConsuming = false;
      console.log('Stopped consuming events from RabbitMQ');
    }
  }
}

module.exports = new EventConsumer(); 