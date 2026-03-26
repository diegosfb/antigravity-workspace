FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --include=dev

# Copy the rest of the application
COPY . .

# Build the Vite React frontend
RUN npm run build

# Cloud Run sets the PORT environment variable (default 8080)
EXPOSE 8080

# Start the backend server using the npm start script
CMD ["npm", "start"]
