# config.py - Configuración centralizada

import os
from dotenv import load_dotenv
from pathlib import Path

# Cargar variables de entorno
load_dotenv()

# ============= CONFIGURACIÓN DE TELEGRAM =============
TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN', '')
WEBHOOK_URL = os.getenv('WEBHOOK_URL', '')
PORT = int(os.getenv('PORT', 8000))

# ============= CONFIGURACIÓN DE BASE DE DATOS =============

# Para desarrollo local (SQLite)
DATABASE_URL = os.getenv(
    'DATABASE_URL',
    'sqlite:///./gastos.db'
)

# Para producción (PostgreSQL en Railway/Render)
# DATABASE_URL = os.getenv(
#     'DATABASE_URL',
#     'postgresql://user:password@localhost/gastos_db'
# )

# ============= CATEGORÍAS POR DEFECTO =============
CATEGORIAS_DEFECTO = {
    'comida': '🍔',
    'transporte': '🚗',
    'diversión': '🎮',
    'educación': '📚',
    'salud': '💊',
    'hogar': '🏠',
    'otros': '💳'
}

# ============= CONFIGURACIÓN DE LOGGING =============
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'

# ============= CONFIGURACIÓN DE APLICACIÓN =============
TIMEZONE = 'America/Argentina/Buenos_Aires'  # Cambiar según tu zona horaria
MONEDA = '$'  # Símbolo de moneda

# ============= LÍMITES Y VALIDACIONES =============
MONTO_MINIMO = 0.01
MONTO_MAXIMO = 999999.99
DESCRIPCION_MAX_LENGTH = 500

# ============= MENSAJES DEL BOT =============
MENSAJES = {
    'bienvenida': """
¡Hola {nombre}! 👋

Soy tu asistente de gastos. Aquí puedes:
🤖 Registrar gastos con IA en lenguaje natural
📝 Registrar tus gastos paso a paso
📊 Ver resúmenes de gastos
💰 Establecer presupuestos
📈 Ver gráficos y estadísticas

Usa /registrar para hablarle a la IA, o /ayuda para más opciones.
    """,
    
    'ayuda': """
📚 COMANDOS DISPONIBLES:

🤖 Registrar con IA (NUEVO):
  /registrar - Describe tu gasto o ingreso en lenguaje natural
  Ej: "Compré pizza por 4500"

📝 Registrar Gastos (modo clásico):
  /gasto - Registrar un nuevo gasto paso a paso

📊 Ver Resúmenes:
  /resumen_hoy - Gastos de hoy
  /resumen_mes - Gastos de este mes
  /resumen - Gastos en rango de fechas

💰 Presupuestos:
  /presupuesto - Establecer presupuesto por categoría
  /presupuestos - Ver presupuestos actuales

📈 Estadísticas:
  /stats - Ver gráficos y estadísticas

❓ Otros:
  /categorias - Ver categorías disponibles
  /ayuda - Este mensaje
    """,
    
    'error_monto': "❌ Por favor ingresa un número válido (ejemplo: 250 o 250.50)",
    'error_categoria': "❌ Por favor selecciona una categoría válida",
    'error_generico': "❌ Ocurrió un error. Por favor intenta de nuevo.",
    'gasto_registrado': "✅ ¡Gasto registrado!",
    'cancelado': "❌ Operación cancelada",
}

# ============= VALIDACIÓN DE CONFIGURACIÓN =============
def validar_config():
    """Valida que la configuración sea correcta"""
    if not TELEGRAM_BOT_TOKEN:
        raise ValueError(
            "❌ TELEGRAM_BOT_TOKEN no está definido. "
            "Agrega tu token en el archivo .env"
        )
    return True

# Ejecutar validación al importar
try:
    validar_config()
except ValueError as e:
    print(e)
