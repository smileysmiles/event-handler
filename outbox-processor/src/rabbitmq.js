const amqp = require('amqplib');

class RabbitMQService {
  constructor() {
    this.connection = null;
    this.channel = null;
  }

  async connect() {
    if (this.connection) return;

    this.connection = await amqp.connect('amqp://eventuser:eventpass@localhost:5672');
    this.channel = await this.connection.createChannel();
    
    // Ensure the exchange exists
    await this.channel.assertExchange('events', 'topic', {
      durable: true
    });

    // Handle connection errors
    this.connection.on('error', (err) => {
      console.error('RabbitMQ connection error:', err);
      this.connection = null;
      this.channel = null;
    });

    this.connection.on('close', () => {
      console.log('RabbitMQ connection closed');
      this.connection = null;
      this.channel = null;
    });
  }

  async publishEvent(event) {
    if (!this.channel) {
      await this.connect();
    }

    const routingKey = `${event.type}.${event.version}`;
    const message = Buffer.from(JSON.stringify(event));

    await this.channel.publish('events', routingKey, message, {
      persistent: true,
      contentType: 'application/json',
      contentEncoding: 'utf-8',
      headers: {
        eventType: event.type,
        eventVersion: event.version,
        correlationId: event.correlationId,
        causationId: event.causationId
      }
    });

    console.log(`Published event ${event.id} to ${routingKey}`);
  }

  async close() {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
  }
}

module.exports = new RabbitMQService(); 