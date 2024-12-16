# Build stage
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --platform=linux --arch=x64
COPY . .
RUN npm i -g @rollup/rollup-linux-x64-gnu
RUN npm run build

# Production stage
FROM node:20-slim
WORKDIR /app
COPY --from=builder /app/dist ./dist
RUN npm install -g serve
EXPOSE 3001
CMD ["serve", "-s", "dist", "-p", "3001"]