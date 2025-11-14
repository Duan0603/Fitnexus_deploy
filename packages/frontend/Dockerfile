FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
# Use npm install because this package does not ship a per-package lockfile
RUN npm install

COPY . .

EXPOSE 5173

# Run Vite dev server bound to 0.0.0.0 so it is reachable from host
CMD ["npm","run","dev","--","--host","0.0.0.0"]
