const express = require('express');
const adminAuth = require('../middleware/adminAuth');
const bakeryController = require('../controllers/bakeryController');
const bakeryService = require('../services/bakeryService'); // Use the service object
const router = express.Router();

// Product routes
router.get('/products', bakeryController.getAllProducts); // Public
router.get('/products/:id', bakeryController.getProductById); // Public
router.post('/products', adminAuth, bakeryController.createProduct); // Admin-only

// Cart routes
router.post('/cart', bakeryController.addToCart);
// Cart route (protected, gets cart for logged-in user only)
router.get('/cart', adminAuth, bakeryController.getCart);

// Order routes
router.post('/orders', bakeryController.placeOrder);
router.get('/orders/:id', bakeryController.getOrderStatus);

// Auth routes
router.post('/register', bakeryController.register);
router.post('/login', bakeryController.login);
router.get('/user', adminAuth, bakeryController.getUser);

bakeryService.connectPromise.then(() => {
    console.log('RabbitMQ connection established');
  }).catch((error) => {
    console.error('Failed to connect to RabbitMQ:', error);
  });
// Publish route for sending messages to RabbitMQ
router.post('/publish', async (req, res) => {
    try {
      const testMessage = { test: 'Hello RabbitMQ' };

      // Ensure channel is defined before using it
      if (!bakeryService.channel) {
        return res.status(500).json({ error: 'RabbitMQ channel not available' });
      }

      bakeryService.channel.sendToQueue(
        'user-activity',
        Buffer.from(JSON.stringify(testMessage)),
        { persistent: true }
      );

      res.json({ status: 'Message published' });
    } catch (error) {
      console.error('Error publishing message:', error);
      res.status(500).json({ error: 'Failed to publish message' });
    }
  });

module.exports = router;
