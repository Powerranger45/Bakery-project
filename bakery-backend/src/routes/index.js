const express = require('express');
const adminAuth = require('../middleware/adminAuth');
const bakeryController = require('../controllers/bakeryController');

const router = express.Router();

// Product routes
router.get('/products', bakeryController.getAllProducts); // Public
router.get('/products/:id', bakeryController.getProductById); // Public
router.post('/products', adminAuth, bakeryController.createProduct); // Admin-only

// Cart routes
router.post('/cart', bakeryController.addToCart);
router.get('/cart/:userId', bakeryController.getCart);
router.put('/cart/:userId/:productId', bakeryController.updateCartItem);
router.delete('/cart/:userId/:productId', bakeryController.removeFromCart);

// Order routes
router.post('/orders', bakeryController.placeOrder);
router.get('/orders/:id', bakeryController.getOrderStatus);

// Auth routes
router.post('/register', bakeryController.register);
router.post('/login', bakeryController.login);

module.exports = router;