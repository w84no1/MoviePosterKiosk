# Build Stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Serve Stage (using Nginx)
FROM nginx:alpine
# Copy built assets to Nginx
COPY --from=build /app/dist /usr/share/nginx/html
# Also copy a custom Nginx config if needed, otherwise default is mostly fine
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
