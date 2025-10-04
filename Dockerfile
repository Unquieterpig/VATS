# Use Node.js 18 Alpine image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY client-vite/package*.json ./client-vite/

# Install dependencies
RUN npm install && \
    cd server && npm install && \
    cd ../client-vite && npm install

# Copy source code
COPY . .

# Build frontend
RUN cd client-vite && npm run build

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "run", "server"]
