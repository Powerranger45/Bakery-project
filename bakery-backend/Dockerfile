FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose the API port
EXPOSE 3001

# Command to run the application
CMD ["npm", "start"]
