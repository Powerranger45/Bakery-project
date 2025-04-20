const bakeryService = require('../services/bakeryService');

const bakeryController = {
  // Product controllers
  async getAllProducts(req, res) {
    try {
      const products = await bakeryService.getAllProducts();
      res.json(products);
    } catch (error) {
      console.error('Error getting products:', error);
      res.status(500).json({ error: 'Failed to retrieve products' });
    }
  },

  async getProductById(req, res) {
    try {
      const { id } = req.params;
      const product = await bakeryService.getProductById(id);

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json(product);
    } catch (error) {
      console.error('Error getting product:', error);
      res.status(500).json({ error: 'Failed to retrieve product' });
    }
  },

  async createProduct(req, res) {
    try {
      const product = await bakeryService.createProduct(req.body);
      res.status(201).json(product);
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ error: 'Failed to create product' });
    }
  },

  // Order controllers
  async placeOrder(req, res) {
    try {
      const order = await bakeryService.placeOrder(req.body);
      res.status(201).json(order);
    } catch (error) {
      console.error('Error placing order:', error);
      res.status(500).json({ error: 'Failed to place order' });
    }
  },

  async getOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const order = await bakeryService.getOrderStatus(id);

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      res.json(order);
    } catch (error) {
      console.error('Error getting order status:', error);
      res.status(500).json({ error: 'Failed to retrieve order status' });
    }
  },

  async getAllOrders(req, res) {
    try {
      const orders = await bakeryService.getAllOrders();
      res.json(orders);
    } catch (error) {
      console.error('Error getting orders:', error);
      res.status(500).json({ error: 'Failed to retrieve orders' });
    }
  },

  // User controllers
  async createUser(req, res) {
    try {
      const user = await bakeryService.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  },

  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await bakeryService.getUserById(id);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      console.error('Error getting user:', error);
      res.status(500).json({ error: 'Failed to retrieve user' });
    }
  }
};

module.exports = bakeryController;
