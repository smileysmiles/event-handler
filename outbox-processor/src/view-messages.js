const amqp = require('amqplib');

async function viewMessages() {
  try {
    // Connect to RabbitMQ
    const connection = await amqp.connect('amqp://eventuser:eventpass@localhost:5672');
    const channel = await connection.createChannel();

    // Create a temporary queue
    const { queue } = await channel.assertQueue('', { exclusive: true });
    
    // Bind to all PlayerLocked events
    await channel.bindQueue(queue, 'events', 'PlayerLocked.*');

    console.log('Waiting for messages...');

    // Consume messages
    channel.consume(queue, (msg) => {
      if (msg !== null) {
        console.log('\nReceived message:');
        console.log('Routing key:', msg.fields.routingKey);
        console.log('Headers:', msg.properties.headers);
        console.log('Content:', msg.content.toString());
        channel.ack(msg);
      }
    });

    // Keep the script running
    console.log('Press Ctrl+C to exit');
  } catch (error) {
    console.error('Error:', error);
  }
}

viewMessages(); 