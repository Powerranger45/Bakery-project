# Use official Node.js LTS image
FROM node:18-alpine

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy Prisma schema and migrations, then generate client
COPY prisma ./prisma
RUN npx prisma generate --schema prisma/schema.prisma

# Copy application code
COPY . .

# Expose application port
EXPOSE 3001

# On container start: apply migrations and then start
CMD ["sh", "-c", "npx prisma migrate deploy --schema prisma/schema.prisma && npm start"]