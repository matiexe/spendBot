from telegram import Update
from telegram.ext import ContextTypes, ConversationHandler
from utils.validators import validar_monto, validar_categoria, validar_descripcion
from database import registrar_gasto, obtener_o_crear_usuario, obtener_presupuestos, obtener_gasto_categoria_mes
from config import CATEGORIAS_DEFECTO, MENSAJES

MONTO, CATEGORIA, DESCRIPCION = range(3)

async def registrar_gasto_inicio(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("¿Cuánto gastaste? (ejemplo: 250.50)")
    return MONTO

async def procesar_monto(update: Update, context: ContextTypes.DEFAULT_TYPE):
    monto = validar_monto(update.message.text)
    if monto is None:
        await update.message.reply_text(MENSAJES['error_monto'])
        return MONTO
    
    context.user_data['monto'] = monto
    
    mensaje = "¿En qué categoría?\n\n"
    for i, (cat, emoji) in enumerate(CATEGORIAS_DEFECTO.items(), 1):
        mensaje += f"{i}. {emoji} {cat.capitalize()}\n"
    
    await update.message.reply_text(mensaje)
    return CATEGORIA

async def procesar_categoria(update: Update, context: ContextTypes.DEFAULT_TYPE):
    categoria = validar_categoria(update.message.text)
    if categoria is None:
        await update.message.reply_text(MENSAJES['error_categoria'])
        return CATEGORIA
    
    context.user_data['categoria'] = categoria.capitalize()
    
    await update.message.reply_text(
        "¿Descripción? (opcional - o escribe /saltar)\n"
        "Ejemplo: Almuerzo en restaurante"
    )
    return DESCRIPCION

async def procesar_descripcion(update: Update, context: ContextTypes.DEFAULT_TYPE):
    descripcion = validar_descripcion(update.message.text)
    monto = context.user_data['monto']
    categoria = context.user_data['categoria']
    usuario = update.effective_user
    
    obtener_o_crear_usuario(usuario.id, usuario.first_name, usuario.username)
    
    registrar_gasto(usuario.id, monto, categoria, descripcion)
    emoji = CATEGORIAS_DEFECTO.get(categoria.lower(), '🏷️')
    
    gasto_actual = obtener_gasto_categoria_mes(usuario.id, categoria)
    presupuestos = obtener_presupuestos(usuario.id)
    limite = next((p[2] for p in presupuestos if p[0] == categoria), None)
    
    alerta = ""
    if limite:
        porcentaje = (gasto_actual / limite) * 100
        if porcentaje > 100:
            alerta = f"\n⚠️ ¡Alerta! Has superado tu presupuesto de ${limite:.2f} para {categoria}."
        elif porcentaje > 80:
            alerta = f"\n⚠️ Cuidado: Has usado el {porcentaje:.1f}% de tu presupuesto (${limite:.2f}) para {categoria}."
            
    mensaje = f"""
{MENSAJES['gasto_registrado']}

💰 Monto: ${monto:.2f}
📂 Categoría: {emoji} {categoria}
"""
    if descripcion:
        mensaje += f"📝 Nota: {descripcion}\n"
        
    mensaje += alerta
    
    await update.message.reply_text(mensaje)
    return ConversationHandler.END

async def cancelar(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(MENSAJES['cancelado'])
    return ConversationHandler.END
