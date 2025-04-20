const amqp = require('amqplib');
const prisma = require('../utils/prisma');
require('dotenv').config();

const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 5000;

async function processOrder(orderId) {
  console.log(`Processing order ${orderId}...`);

  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'PROCESSING' },
    });

    await new Promise(resolve => setTimeout(resolve, 5000));

    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'COMPLETED' },
    });

    console.log(`Order ${orderId} processed successfully`);
  } catch (error) {
    console.error(`Error processing order ${orderId}:`, error);
    try {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
      });
    } catch (updateError) {
      console.error(`Error updating order ${orderId} status:`, updateError);
    }
  }
}

async function connectWithRetry() {
  let attempt = 0;
  while (attempt < MAX_RETRIES) {
    try {
      console.log(`Connecting to RabbitMQ... (Attempt ${attempt + 1})`);
      const connection = await amqp.connect(process.env.RABBITMQ_URL);
      return connection;
    } catch (error) {
      console.error('Connection to RabbitMQ failed:', error.message);
      attempt++;
      await new Promise(res => setTimeout(res, RETRY_DELAY_MS));
    }
  }

  throw new Error('Failed to connect to RabbitMQ after multiple attempts.');
}

async function startWorker() {
  try {
    const connection = await connectWithRetry();
    const channel = await connection.createChannel();

    await channel.assertQueue('orders', { durable: true });
    channel.prefetch(1);

    console.log('Worker ready to process orders');

    channel.consume('orders', async (msg) => {
      if (msg) {
        try {
          const { orderId } = JSON.parse(msg.content.toString());
          await processOrder(orderId);
          channel.ack(msg);
        } catch (error) {
          console.error('Error processing message:', error);
          channel.reject(msg, true);
        }
      }
    });

    process.on('SIGINT', async () => {
      console.log('Shutting down worker...');
      await channel.close();
      await connection.close();
      process.exit(0);
    });
  } catch (finalError) {
    console.error('Worker failed to start:', finalError.message);
    process.exit(1);
  }
}

startWorker();
