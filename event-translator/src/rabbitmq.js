const amqp = require('amqplib');
require('dotenv').config();

class RabbitMQService {
  constructor() {
    this.connection = null;
    this.channel = null;
  }

  async connect() {
    if (this.connection) return;

    this.connection = await amqp.connect('amqp://eventuser:eventpass@localhost:5672');
    this.channel = await this.connection.createChannel();
    
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