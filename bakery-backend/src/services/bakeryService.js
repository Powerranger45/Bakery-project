const prisma = require('../utils/prisma');
const amqp = require('amqplib');

let channel;

// RabbitMQ connection
async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertQueue('order-processing', { durable: true });
    console.log('Connected to RabbitMQ');
  } catch (error) {
    console.error('RabbitMQ connection failed:', error);
    setTimeout(connectRabbitMQ, 5000);
  }
}
connectRabbitMQ();

const bakeryService = {
  // Product operations (PUBLIC)
  async getAllProducts() {
    return prisma.product.findMany();
  },

  async getProductById(id) {
    return prisma.product.findUnique({ where: { id: Number(id) } });
  },

  // Admin-only product operations
  async createProduct(data) {
    return prisma.product.create({ data });
  },

  // Cart operations
  async addToCart(userId, productId, quantity = 1) {
    return prisma.addToCart.upsert({
      where: { userId_productId: { userId, productId } },
      update: { quantity: { increment: quantity } },
      create: { userId, productId, quantity },
      include: { product: true }
    });
  },

  async getCart(userId) {
    return prisma.addToCart.findMany({
      where: { userId },
      include: { product: true }
    });
  },

  async updateCartItem(userId, productId, quantity) {
    return prisma.addToCart.update({
      where: { userId_productId: { userId, productId } },
      data: { quantity },
      include: { product: true }
    });
  },

  async removeFromCart(userId, productId) {
    return prisma.addToCart.delete({
      where: { userId_productId: { userId, productId } }
    });
  },

  // Order operations
  async placeOrder(userId) {
    const cartItems = await prisma.addToCart.findMany({
      where: { userId },
      include: { product: true }
    });

    if (cartItems.length === 0) {
      throw new Error('Cart is empty');
    }

    const orderItems = cartItems.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.product.price
    }));

    const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order = await prisma.order.create({
      data: {
        userId,
        total,
        items: { create: orderItems }
      },
      include: { items: true }
    });

    // Send to RabbitMQ
    if (channel) {
      channel.sendToQueue(
        'order-processing',
        Buffer.from(JSON.stringify({ orderId: order.id })),
        { persistent: true }
      );
    }

    // Clear cart after order
    await prisma.addToCart.deleteMany({ where: { userId } });
    return order;
  },

  async getOrderStatus(orderId) {
    return prisma.order.findUnique({
      where: { id: Number(orderId) },
      include: { items: true }
    });
  },

  // User operations
// User operations
async createUser(userData) {
  return prisma.user.create({
    data: {
      email: userData.email,
      password: userData.password,
      isAdmin: userData.isAdmin || false // Explicitly set default to false
    }
  });
},

  async getUserByEmail(email) {
    return prisma.user.findUnique({ where: { email } });
  }
};

module.exports = bakeryService;