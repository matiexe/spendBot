from telegram import Update
from telegram.ext import ContextTypes
from database import obtener_gastos_hoy, obtener_gastos_mes, obtener_gastos_rango
from utils.charts import generar_mensaje_resumen
from datetime import datetime, timedelta

async def resumen_hoy(update: Update, context: ContextTypes.DEFAULT_TYPE):
    usuario_id = update.effective_user.id
    gastos = obtener_gastos_hoy(usuario_id)
    mensaje = generar_mensaje_resumen(gastos, "de hoy")
    await update.message.reply_text(mensaje)

async def resumen_mes(update: Update, context: ContextTypes.DEFAULT_TYPE):
    usuario_id = update.effective_user.id
    gastos = obtener_gastos_mes(usuario_id)
    mensaje = generar_mensaje_resumen(gastos, "de este mes")
    await update.message.reply_text(mensaje)

async def resumen_custom(update: Update, context: ContextTypes.DEFAULT_TYPE):
    usuario_id = update.effective_user.id
    if len(context.args) == 2:
        try:
            inicio = datetime.strptime(context.args[0], '%Y-%m-%d').date()
            fin = datetime.strptime(context.args[1], '%Y-%m-%d').date()
            gastos = obtener_gastos_rango(usuario_id, inicio, fin)
            mensaje = generar_mensaje_resumen(gastos, f"desde {inicio} hasta {fin}")
        except ValueError:
             mensaje = "Formato de fecha inválido. Usar AAAA-MM-DD AAAA-MM-DD"
    else:
        hoy = datetime.now().date()
        inicio = hoy - timedelta(days=7)
        gastos = obtener_gastos_rango(usuario_id, inicio, hoy)
        mensaje = generar_mensaje_resumen(gastos, "de los últimos 7 días")
        mensaje += "\n\nTip: Para un rango específico, usa: /resumen AAAA-MM-DD AAAA-MM-DD"
    
    await update.message.reply_text(mensaje)

async def ver_categorias(update: Update, context: ContextTypes.DEFAULT_TYPE):
    from config import CATEGORIAS_DEFECTO
    mensaje = "📂 CATEGORÍAS DISPONIBLES:\n\n"
    for cat, emoji in CATEGORIAS_DEFECTO.items():
        mensaje += f"{emoji} {cat.capitalize()}\n"
    await update.message.reply_text(mensaje)
