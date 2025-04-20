const prisma = require('../utils/prisma');
const amqp = require('amqplib');

let channel;

// Connect to RabbitMQ
async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertQueue('orders', { durable: true });
    console.log('Connected to RabbitMQ');
  } catch (error) {
    console.error('Error connecting to RabbitMQ:', error);
    // Retry connection after 5 seconds
    setTimeout(connectRabbitMQ, 5000);
  }
}

// Connect to RabbitMQ when service is initialized
connectRabbitMQ();

const bakeryService = {
  // Products
  async getAllProducts() {
    return prisma.product.findMany();
  },

  async getProductById(id) {
    return prisma.product.findUnique({
      where: { id: Number(id) },
    });
  },

  async createProduct(data) {
    return prisma.product.create({
      data,
    });
  },

  // Orders
  async placeOrder(orderData) {
    const { userId, items } = orderData;

    // Calculate the total price
    let total = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: Number(item.productId) },
      });

      if (!product) {
        throw new Error(`Product with ID ${item.productId} not found`);
      }

      total += product.price * item.quantity;
      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
      });
    }

    // Create the order in the database
    const order = await prisma.order.create({
      data: {
        userId: Number(userId),
        total,
        status: 'PENDING',
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Send the order to RabbitMQ for processing
    if (channel) {
      channel.sendToQueue(
        'orders',
        Buffer.from(JSON.stringify({ orderId: order.id })),
        {
          persistent: true,
        }
      );
    }

    return order;
  },

  async getOrderStatus(orderId) {
    return prisma.order.findUnique({
      where: { id: Number(orderId) },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  },

  async getAllOrders() {
    return prisma.order.findMany({
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  },

  // Users
  async createUser(userData) {
    return prisma.user.create({
      data: userData,
    });
  },

  async getUserById(id) {
    return prisma.user.findUnique({
      where: { id: Number(id) },
    });
  },

  async getUserByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
    });
  }
};

module.exports = bakeryService;
