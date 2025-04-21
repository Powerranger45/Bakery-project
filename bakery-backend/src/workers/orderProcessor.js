const amqp = require('amqplib');
const prisma = require('./utils/prisma');
require('dotenv').config();

const MAX_RETRIES = 15; // Maximum number of retries to connect to RabbitMQ
const RETRY_DELAY_MS = 5000; // Delay between retries in milliseconds

// Order processing logic
async function processOrder(orderId) {
  console.log(`Processing order ${orderId}...`);

  try {
    // Update order status to PROCESSING
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'PROCESSING' },
    });

    // Simulate order processing time
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Update order status to COMPLETED
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'COMPLETED' },
    });

    console.log(`Order ${orderId} processed successfully`);
  } catch (error) {
    console.error(`Error processing order ${orderId}:`, error);

    // Attempt to update order status to CANCELLED on failure
    try {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
      });
    } catch (updateError) {
      console.error(`Error updating order ${orderId} status to CANCELLED:`, updateError);
    }
  }
}

// Retry logic for RabbitMQ connection
async function connectWithRetry() {
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      console.log(`Connecting to RabbitMQ... Attempt ${attempt + 1}`);
      const connection = await amqp.connect(process.env.RABBITMQ_URL);
      return connection;
    } catch (error) {
      console.error('Connection to RabbitMQ failed:', error.message);
      attempt++;
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }

  throw new Error('Failed to connect to RabbitMQ after multiple attempts.');
}

// Worker to listen for queues and process messages
async function startWorker() {
  try {
    // Establish RabbitMQ connection with retry logic
    const connection = await connectWithRetry();
    const channel = await connection.createChannel();

    // Declare durable queues
    await channel.assertQueue('user-activity', { durable: true });
    await channel.assertQueue('order-processing', { durable: true });

    // Order processing queue
    channel.prefetch(1); // Ensure only one message is processed at a time
    console.log('Worker ready to process orders...');
    channel.consume('order-processing', async (msg) => {
      if (msg) {
        try {
          const { orderId } = JSON.parse(msg.content.toString());
          await processOrder(orderId);
          channel.ack(msg); // Acknowledge successful processing
        } catch (error) {
          console.error('Error processing order message:', error);
          channel.reject(msg, true); // Requeue the message for retry
        }
      }
    });

    // User activity queue for logging activity
    console.log('Worker ready to log user activity...');
    channel.consume('user-activity', (msg) => {
      if (msg) {
        try {
          console.log('Activity Log:', JSON.parse(msg.content.toString()));
          channel.ack(msg); // Acknowledge successful logging
        } catch (error) {
          console.error('Error processing user activity message:', error);
          channel.reject(msg, true); // Requeue the message if error occurs
        }
      }
    });

    // Gracefully shut down the worker on interrupt signal
    process.on('SIGINT', async () => {
      console.log('Shutting down worker...');
      await channel.close();
      await connection.close();
      process.exit(0);
    });

  } catch (error) {
    console.error('Worker failed:', error.message);
    process.exit(1);
  }
}

// Start the worker process
startWorker();
