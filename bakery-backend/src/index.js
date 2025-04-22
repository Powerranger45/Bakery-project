const express = require('express');
const morgan = require('morgan');
const cors = require('cors'); // Import CORS
const bakeryRouter = require('./routes/index.js');
const bakeryService = require('./services/bakeryService');
require('dotenv').config();

async function startServer() {
  try {
    // Wait for RabbitMQ connection to be established
    await bakeryService.connectPromise;

    const app = express();

    // Enable CORS middleware with configuration
    app.use(cors({
      origin: '*', // Allow frontend to access backend
      methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow these HTTP methods
      allowedHeaders: ['Content-Type', 'Authorization'], // Allow headers
    }));

    // Middleware setup
    app.use(express.json());
    app.use(morgan('dev'));

    // Register routes
    app.use('/api', bakeryRouter);  // Other routes (products, orders, etc.)

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.status(200).json({ status: 'OK', message: 'Bakery API is running' });
    });

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error('Global error:', err.stack);
      res.status(500).json({ error: 'Internal Server Error' });
    });

    // Start the server
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error('Startup failed:', error);
    process.exit(1); // Exit the process if RabbitMQ connection fails
  }
}

// Initialize server startup
startServer();
