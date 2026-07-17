# Stage 1: Build the frontend (Vite React)
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Build the backend (Node Express)
FROM node:20-alpine AS server-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

# Stage 3: Setup the production environment
FROM node:20-alpine
WORKDIR /app

# Copy built frontend
COPY --from=client-build /app/client/dist ./client/dist

# Copy built backend and its dependencies
COPY --from=server-build /app/server/dist ./server/dist
COPY --from=server-build /app/server/package*.json ./server/
WORKDIR /app/server
# Install only production dependencies
RUN npm ci --omit=dev

# Expose port (Cloud Run defaults to 8080)
EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

CMD ["npm", "start"]
