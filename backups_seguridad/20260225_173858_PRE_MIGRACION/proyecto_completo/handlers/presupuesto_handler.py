from telegram import Update
from telegram.ext import ContextTypes, ConversationHandler
from config import CATEGORIAS_DEFECTO
from database import establecer_presupuesto, obtener_presupuestos, obtener_gasto_categoria_mes
from utils.validators import validar_monto, validar_categoria

CAT_PRESUPUESTO, MONTO_PRESUPUESTO = range(2)

async def presupuesto_inicio(update: Update, context: ContextTypes.DEFAULT_TYPE):
    mensaje = "¿Para qué categoría quieres establecer el presupuesto?\n\n"
    for i, (cat, emoji) in enumerate(CATEGORIAS_DEFECTO.items(), 1):
        mensaje += f"{i}. {emoji} {cat.capitalize()}\n"
    
    await update.message.reply_text(mensaje)
    return CAT_PRESUPUESTO

async def procesar_categoria_presupuesto(update: Update, context: ContextTypes.DEFAULT_TYPE):
    categoria = validar_categoria(update.message.text)
    if categoria is None:
        await update.message.reply_text("❌ Por favor selecciona una categoría válida")
        return CAT_PRESUPUESTO
    
    context.user_data['categoria_presupuesto'] = categoria.capitalize()
    
    await update.message.reply_text(f"Has seleccionado {categoria.capitalize()}. ¿Cuál será el límite mensual?")
    return MONTO_PRESUPUESTO

async def procesar_monto_presupuesto(update: Update, context: ContextTypes.DEFAULT_TYPE):
    monto = validar_monto(update.message.text)
    if monto is None:
        await update.message.reply_text("❌ Por favor ingresa un monto válido")
        return MONTO_PRESUPUESTO
        
    categoria = context.user_data['categoria_presupuesto']
    usuario_id = update.effective_user.id
    
    establecer_presupuesto(usuario_id, categoria, monto)
    
    await update.message.reply_text(f"✅ Presupuesto de ${monto:.2f} establecido para {categoria}.")
    return ConversationHandler.END

async def ver_presupuestos(update: Update, context: ContextTypes.DEFAULT_TYPE):
    usuario_id = update.effective_user.id
    presupuestos = obtener_presupuestos(usuario_id)
    
    if not presupuestos:
        await update.message.reply_text("No tienes presupuestos establecidos. Usa /presupuesto para crear uno.")
        return
        
    mensaje = "💰 TUS PRESUPUESTOS MENSUALES:\n\n"
    
    for nombre, emoji, limite in presupuestos:
        gasto_actual = obtener_gasto_categoria_mes(usuario_id, nombre)
        porcentaje = (gasto_actual / limite) * 100 if limite > 0 else 0
        
        estado = "🟢"
        if porcentaje >= 100:
            estado = "🔴"
        elif porcentaje >= 80:
            estado = "🟡"
            
        mensaje += f"{emoji} {nombre}: ${gasto_actual:.2f} / ${limite:.2f} {estado}\n"
        
    await update.message.reply_text(mensaje)

async def cancelar_presupuesto(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("❌ Operación cancelada")
    return ConversationHandler.END
