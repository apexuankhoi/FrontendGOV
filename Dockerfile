# Stage 1: Build Frontend
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve với Nginx
FROM nginx:alpine
# Xóa cấu hình mặc định của Nginx
RUN rm -rf /usr/share/nginx/html/*
# Copy thư mục dist từ bước build sang thư mục của nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Ghi đè file cấu hình nginx (xử lý React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
