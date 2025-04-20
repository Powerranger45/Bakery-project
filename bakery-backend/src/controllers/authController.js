const { PrismaClient } = require('@prisma/client'); // Correctly import the Prisma client
const { generateToken, hashPassword, comparePassword } = require('../utils/auth');

const prisma = new PrismaClient(); // Instantiate the Prisma client

const authController = {
  register: async (req, res) => {
    const { email, password } = req.body;

    try {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) return res.status(400).json({ message: 'Email already in use' });

      const hashed = await hashPassword(password);
      const newUser = await prisma.user.create({
        data: { email, password: hashed }
      });

      const token = generateToken(newUser);
      res.json({ token, user: newUser });
    } catch (err) {
      res.status(500).json({ message: 'Registration failed', error: err.message });
    }
  },

  login: async (req, res) => {
    const { email, password } = req.body;

    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return res.status(404).json({ message: 'User not found' });

      const isMatch = await comparePassword(password, user.password);
      if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

      const token = generateToken(user);
      res.json({ token, user });
    } catch (err) {
      res.status(500).json({ message: 'Login failed', error: err.message });
    }
  }
};

module.exports = authController;
