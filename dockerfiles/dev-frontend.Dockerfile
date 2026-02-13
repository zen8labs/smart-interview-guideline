# Development Dockerfile for frontend
FROM node:22-alpine

WORKDIR /app

# Install dependencies
RUN apk add --no-cache git

# Change ownership of /app to node user
RUN chown -R node:node /app

# Copy package files (node user already exists in the base image)
COPY --chown=node:node web/package.json web/yarn.lock ./

# Switch to node user before installing dependencies
USER node

# Install dependencies
RUN yarn install --frozen-lockfile

# Expose Vite dev server port
EXPOSE 5173

# Run Vite dev server with HMR
CMD ["yarn", "dev", "--host", "0.0.0.0"]
