#!/bin/sh
echo "=========================================="
echo "🚀 Iniciando SpendBot Suite en Producción..."
echo "=========================================="

# 1. Inicializar la base de datos SQLite y verificar tablas
python database.py

# 2. Iniciar el bot de Telegram en segundo plano
python main.py &
BOT_PID=$!
echo "✅ Bot de Telegram iniciado (PID: $BOT_PID)"

# 3. Iniciar el servidor web de Next.js
cd dashboard
echo "🌐 Iniciando Servidor Web Next.js en puerto 3000..."
npm start
