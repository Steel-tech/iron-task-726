FROM node:18-alpine

WORKDIR /app

# Install dependencies for Sharp (image processing) and OpenSSL compatibility
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    vips-dev \
    openssl \
    openssl-dev

COPY package*.json ./
RUN npm install
COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 3001

CMD ["npm", "run", "dev"]