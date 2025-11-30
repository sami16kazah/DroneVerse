FROM node:20-alpine

# Set working directory to /app
WORKDIR /app

# Copy package*.json files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Expose port 3000
EXPOSE 3000

# Run command when container starts
CMD ["npm", "run", "dev"]