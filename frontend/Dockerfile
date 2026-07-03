# Stage 1 — Build
# Use Node to install dependencies and run vite build
FROM node:20-alpine AS builder

WORKDIR /app


COPY package*.json ./
RUN npm install

# Copy source and build
# VITE_REACT_BASE_URL is passed at build time as a build argument
ARG VITE_REACT_BASE_URL=/api
ENV VITE_REACT_BASE_URL=$VITE_REACT_BASE_URL

COPY . .
RUN npm run build
# Output is in /app/dist

# Stage 2 
# Only copy the compiled /dist output into a minimal Nginx image
FROM nginx:alpine


RUN rm -rf /usr/share/nginx/html/*

#
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom nginx config to handle React Router (client-side routing)
# Without this, refreshing any route other than / returns 404
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
