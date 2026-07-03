# Single stage — Node Alpine (smallest Node image)
FROM node:20-alpine

WORKDIR /app

#
COPY package*.json ./
RUN npm install --omit=dev



COPY . .

# Run as non-root user for security
# node user already exists in the node:alpine image
USER node

EXPOSE 5000

CMD ["node", "index.js"]
