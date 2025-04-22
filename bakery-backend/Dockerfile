FROM node:18-alpine

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate --schema prisma/schema.prisma

# Copy application code
COPY . .

EXPOSE 3001
CMD ["npm", "start"]