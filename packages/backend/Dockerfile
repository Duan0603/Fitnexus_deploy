FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json package-lock.json* ./
# Use npm install because this package does not ship a per-package lockfile
RUN npm install

# Copy source
COPY . .

EXPOSE 3001

# Default to dev mode with nodemon. For production, override CMD to `node ./bin/www`.
CMD ["npm","run","dev"]
