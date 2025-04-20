  const bcrypt = require('bcrypt');
  const jwt = require('jsonwebtoken');
  const bakeryService = require('../services/bakeryService');

  const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // replace with env for production

  const bakeryController = {
    // Product controllers
    async getAllProducts(req, res) {
      try {
        const products = await bakeryService.getAllProducts();
        res.json(products);
      } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve products' });
      }
    },

    async getProductById(req, res) {
      try {
        const product = await bakeryService.getProductById(req.params.id);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json(product);
      } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve product' });
      }
    },

    async createProduct(req, res) {
      try {
        const product = await bakeryService.createProduct(req.body);
        res.status(201).json(product);
      } catch (error) {
        res.status(500).json({ error: 'Failed to create product' });
      }
    },

    // Cart controllers
    async addToCart(req, res) {
      try {
        const { userId, productId } = req.body;
        const cartItem = await bakeryService.addToCart(userId, productId);
        res.json(cartItem);
      } catch (error) {
        res.status(500).json({ error: 'Failed to update cart' });
      }
    },

    async getCart(req, res) {
      try {
        const cart = await bakeryService.getCart(req.params.userId);
        res.json(cart);
      } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve cart' });
      }
    },

    async updateCartItem(req, res) {
      try {
        const { userId, productId } = req.params;
        const { quantity } = req.body;
        const item = await bakeryService.updateCartItem(userId, productId, quantity);
        res.json(item);
      } catch (error) {
        res.status(500).json({ error: 'Failed to update cart item' });
      }
    },

    async removeFromCart(req, res) {
      try {
        await bakeryService.removeFromCart(req.params.userId, req.params.productId);
        res.status(204).send();
      } catch (error) {
        res.status(500).json({ error: 'Failed to remove item' });
      }
    },

    // Order controllers
    async placeOrder(req, res) {
      try {
        const order = await bakeryService.placeOrder(req.body.userId);
        res.status(201).json(order);
      } catch (error) {
        res.status(500).json({ error: 'Failed to place order' });
      }
    },

    async getOrderStatus(req, res) {
      try {
        const order = await bakeryService.getOrderStatus(req.params.id);
        if (!order) return res.status(404).json({ error: 'Order not found' });
        res.json(order);
      } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve order status' });
      }
    },

    // Auth controllers
    async register(req, res) {
      const { email, password, isAdmin = false } = req.body;
    
      try {
        const existingUser = await bakeryService.getUserByEmail(email);
        if (existingUser) {
          return res.status(400).json({ message: 'Email already in use' });
        }
    
        const hashedPassword = await bcrypt.hash(password, 10);
    
        const newUser = await bakeryService.createUser({
          email,
          password: hashedPassword,
          isAdmin, // This is now passed correctly to the service
        });
    
        const token = jwt.sign(
          { id: newUser.id, email: newUser.email, isAdmin: newUser.isAdmin },
          JWT_SECRET,
          { expiresIn: '1h' }
        );
    
        res.status(201).json({ token, user: newUser });
      } catch (error) {
        res.status(500).json({ message: 'Registration failed', error: error.message });
      }
    },

    async login(req, res) {
      const { email, password } = req.body;

      try {
        const user = await bakeryService.getUserByEmail(email);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
          { id: user.id, email: user.email, isAdmin: user.isAdmin },
          JWT_SECRET,
          { expiresIn: '1h' }
        );

        res.json({ token, user });
      } catch (error) {
        res.status(500).json({ message: 'Login failed', error: error.message });
      }
    },
  };

  module.exports = bakeryController;
