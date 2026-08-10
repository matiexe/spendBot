# =========================================================
# DOCKERFILE PRODUCCIÓN - SPENDBOT SUITE (DEBIAN DEPLOYMENT)
# =========================================================

# Stage 1: Build de Next.js en Debian Slim (compatible con glibc)
FROM node:20-slim AS node-builder
WORKDIR /app/dashboard
COPY dashboard/package*.json ./
RUN npm ci
COPY dashboard/ ./
RUN npm run build

# Stage 2: Imagen Final en Producción (Python 3.11 Debian Slim)
FROM python:3.11-slim
WORKDIR /app

# Instalar Node.js y build-essential en la imagen Debian final
RUN apt-get update && apt-get install -y curl build-essential python3 && \
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

# Reconstruir binario nativo de better-sqlite3 para Debian glibc
WORKDIR /app/dashboard
RUN npm rebuild better-sqlite3

WORKDIR /app
COPY start.sh ./
RUN chmod +x start.sh

EXPOSE 3000

CMD ["./start.sh"]
