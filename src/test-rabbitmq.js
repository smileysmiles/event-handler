const amqp = require('amqplib');

async function testRabbitMQ() {
  try {
    // Connect to RabbitMQ
    const connection = await amqp.connect('amqp://eventuser:eventpass@localhost:5672');
    const channel = await connection.createChannel();

    // Ensure exchange exists
    await channel.assertExchange('events', 'topic', { durable: true });

    // Create a test queue
    const { queue } = await channel.assertQueue('test-queue', { durable: true });
    
    // Bind queue to exchange with wildcard pattern
    await channel.bindQueue(queue, 'events', 'PlayerLocked.#');

    console.log('Connected to RabbitMQ successfully!');
    console.log('Queue name:', queue);

    // Set up consumer
    channel.consume(queue, (msg) => {
      if (msg !== null) {
        console.log('\nReceived message:');
        console.log('Routing key:', msg.fields.routingKey);
        console.log('Headers:', msg.properties.headers);
        console.log('Content:', msg.content.toString());
        channel.ack(msg);
      }
    });

    // Publish a test message
    const testEvent = {
      id: 'test-123',
      type: 'PlayerLocked',
      version: '1.0',
      createdAt: new Date().toISOString(),
      correlationId: 'corr-123',
      causationId: null,
      source: 'test-script',
      data: {
        playerId: 'test-player',
        reason: 'test'
      }
    };

    const routingKey = `${testEvent.type}.${testEvent.version}`;
    const message = Buffer.from(JSON.stringify(testEvent));

    await channel.publish('events', routingKey, message, {
      persistent: true,
      contentType: 'application/json',
      contentEncoding: 'utf-8',
      headers: {
        eventType: testEvent.type,
        eventVersion: testEvent.version,
        correlationId: testEvent.correlationId,
        causationId: testEvent.causationId
      }
    });

    console.log('\nPublished test message with routing key:', routingKey);

    // Keep the script running for a while to receive messages
    console.log('\nWaiting for messages... (Press Ctrl+C to exit)');
  } catch (error) {
    console.error('Error:', error);
  }
}

testRabbitMQ(); 