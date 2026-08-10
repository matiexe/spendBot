# =========================================================
# DOCKERFILE PRODUCCIÓN - SPENDBOT SUITE (BOT + DASHBOARD)
# =========================================================

# Stage 1: Build de Next.js
FROM node:20-alpine AS node-builder
WORKDIR /app/dashboard
COPY dashboard/package*.json ./
RUN npm ci
COPY dashboard/ ./
RUN npm run build

# Stage 2: Imagen Final en Producción
FROM python:3.11-slim
WORKDIR /app

# Instalar Node.js para ejecutar el servidor Web Next.js
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Instalar dependencias de Python
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copiar archivos del Bot de Telegram
COPY *.py ./

# Copiar la aplicación compilada de Next.js
COPY --from=node-builder /app/dashboard /app/dashboard

# Script de arranque
COPY start.sh ./
RUN chmod +x start.sh

EXPOSE 3000

CMD ["./start.sh"]
