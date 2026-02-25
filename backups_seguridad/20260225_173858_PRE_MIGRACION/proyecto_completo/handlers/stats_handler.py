from telegram import Update
from telegram.ext import ContextTypes
from database import obtener_gastos_mes, obtener_gastos_por_categoria
from utils.charts import generar_grafico_pastel, generar_grafico_barras, generar_estadisticas_texto, procesar_gastos_por_dia
from datetime import datetime

async def stats(update: Update, context: ContextTypes.DEFAULT_TYPE):
    usuario_id = update.effective_user.id
    
    gastos = obtener_gastos_mes(usuario_id)
    
    if not gastos:
        await update.message.reply_text("No hay suficientes datos este mes para generar estadísticas.")
        return
        
    hoy = datetime.now()
    primer_dia = hoy.replace(day=1).date()
    
    gastos_cat = obtener_gastos_por_categoria(usuario_id, primer_dia, hoy.date())
    
    mensaje = generar_estadisticas_texto(gastos, gastos_cat)
    await update.message.reply_text(mensaje)
    
    buf_pastel = generar_grafico_pastel(gastos_cat)
    if buf_pastel:
        await update.message.reply_photo(photo=buf_pastel, caption="Gastos por Categoría")
        
    datos_diarios = procesar_gastos_por_dia(gastos)
    buf_barras = generar_grafico_barras(datos_diarios)
    if buf_barras:
        await update.message.reply_photo(photo=buf_barras, caption="Gastos por Día")
