# FROM node:18-alpine

# WORKDIR /app

# COPY package*.json ./
# COPY prisma ./prisma/

# RUN npm install

# COPY . .

# RUN npx prisma generate

# RUN npm run build

# EXPOSE 4000

# CMD ["npm", "start"]

FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy prisma files first
COPY prisma ./prisma/

# Generate Prisma Client (before copying all files)
RUN npx prisma generate

# Copy the rest of the application
COPY . .

# Build the project
RUN npm run build

# Expose the port
EXPOSE 4000

# Start the app
CMD ["npm", "start"]
