const express = require('express');
const bakeryController = require('../controllers/bakeryController');

const router = express.Router();

// Product routes
router.get('/products', bakeryController.getAllProducts);
router.get('/products/:id', bakeryController.getProductById);
router.post('/products', bakeryController.createProduct);

// Order routes
router.post('/orders', bakeryController.placeOrder);
router.get('/orders/:id', bakeryController.getOrderStatus);
router.get('/orders', bakeryController.getAllOrders);

// User routes
router.post('/users', bakeryController.createUser);
router.get('/users/:id', bakeryController.getUserById);

module.exports = router;
