# handlers/recurrente_handler.py - Manejador de Transacciones Recurrentes

import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, ReplyKeyboardMarkup, ReplyKeyboardRemove
from telegram.ext import (
    ContextTypes,
    ConversationHandler,
    CommandHandler,
    MessageHandler,
    CallbackQueryHandler,
    filters
)
from database import (
    obtener_o_crear_usuario,
    obtener_categorias,
    registrar_transaccion_recurrente,
    obtener_transacciones_recurrentes,
    alternar_estado_recurrente,
    eliminar_transaccion_recurrente,
    procesar_transacciones_recurrentes_pendientes
)

logger = logging.getLogger(__name__)

# Estados de la conversación para crear recurrente
(
    TIPO_REC,
    MONTO_REC,
    CAT_REC,
    DESC_REC,
    DIA_REC,
    DURACION_REC
) = range(6)

async def ver_recurrentes(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Muestra la lista de transacciones recurrentes del usuario"""
    user = update.effective_user
    obtener_o_crear_usuario(user.id, user.first_name, user.username)
    
    # Procesar pendientes por si acaso
    procesar_transacciones_recurrentes_pendientes()
    
    recurrentes = obtener_transacciones_recurrentes(id_usuario=user.id)
    
    if not recurrentes:
        text = "🔄 *No tienes transacciones recurrentes configuradas.*\n\nUsa `/nueva_recurrente` para agregar un gasto o ingreso periódico."
        keyboard = [[InlineKeyboardButton("➕ Nueva Recurrente", callback_data="nueva_recurrente_start")]]
        reply_markup = InlineKeyboardMarkup(keyboard)
        if update.callback_query:
            await update.callback_query.answer()
            await update.callback_query.edit_message_text(text, parse_mode='Markdown', reply_markup=reply_markup)
        else:
            await update.message.reply_text(text, parse_mode='Markdown', reply_markup=reply_markup)
        return

    text = "🔄 *Tus Transacciones Recurrentes:*\n\n"
    keyboard = []
    
    for r in recurrentes:
        (rec_id, _, tipo, monto, _, desc, dia_cobro, duracion, procesados, _, _, activo, _, _, catNombre, catEmoji) = r
        
        estado_str = "🟢 Activa" if activo == 1 else "⏸️ Pausada"
        duracion_str = f"{procesados}/{duracion} meses" if duracion else f"{procesados} meses (Indefinido ∞)"
        signo = "+" if tipo == "INGRESO" else "-"
        
        text += (
            f"ID #{rec_id} | *{catEmoji} {desc or catNombre}*\n"
            f"💰 `{signo}${monto:,.2f} ARS` | Día {dia_cobro} de cada mes\n"
            f"📊 Progreso: {duracion_str} | Estado: {estado_str}\n"
            f"-----------------------------------------\n"
        )
        
        toggle_btn_text = "⏸️ Pausar" if activo == 1 else "▶️ Activar"
        keyboard.append([
            InlineKeyboardButton(f"{toggle_btn_text} #{rec_id}", callback_data=f"toggle_rec_{rec_id}"),
            InlineKeyboardButton(f"🗑️ Eliminar #{rec_id}", callback_data=f"del_rec_{rec_id}")
        ])
        
    keyboard.append([InlineKeyboardButton("➕ Nueva Transacción Recurrente", callback_data="nueva_recurrente_start")])
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    if update.callback_query:
        await update.callback_query.answer()
        await update.callback_query.edit_message_text(text, parse_mode='Markdown', reply_markup=reply_markup)
    else:
        await update.message.reply_text(text, parse_mode='Markdown', reply_markup=reply_markup)

async def callback_recurrente_actions(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Maneja las acciones inline de pausar/activar y eliminar"""
    query = update.callback_query
    await query.answer()
    data = query.data
    
    if data == "nueva_recurrente_start":
        await query.message.reply_text(
            "🔄 *Nueva Transacción Recurrente*\n\n¿Qué tipo de transacción deseas programar?",
            reply_markup=ReplyKeyboardMarkup([['🔴 GASTO', '🟢 INGRESO']], one_time_keyboard=True, resize_keyboard=True),
            parse_mode='Markdown'
        )
        return TIPO_REC
        
    if data.startswith("toggle_rec_"):
        rec_id = int(data.split("_")[2])
        alternar_estado_recurrente(rec_id)
        await ver_recurrentes(update, context)
        
    elif data.startswith("del_rec_"):
        rec_id = int(data.split("_")[2])
        eliminar_transaccion_recurrente(rec_id)
        await ver_recurrentes(update, context)

# --- CONVERSACIÓN NUEVA RECURRENTE ---

async def inicio_nueva_recurrente(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Punto de entrada comando /nueva_recurrente"""
    user = update.effective_user
    obtener_o_crear_usuario(user.id, user.first_name, user.username)
    
    reply_keyboard = [['🔴 GASTO', '🟢 INGRESO']]
    await update.message.reply_text(
        "🔄 *Programar Transacción Recurrente*\n\n¿Es un Gasto o un Ingreso mensual?",
        reply_markup=ReplyKeyboardMarkup(reply_keyboard, one_time_keyboard=True, resize_keyboard=True),
        parse_mode='Markdown'
    )
    return TIPO_REC

async def procesar_tipo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text.upper()
    tipo = 'INGRESO' if 'INGRESO' in text else 'GASTO'
    context.user_data['rec_tipo'] = tipo
    
    await update.message.reply_text(
        f"Has seleccionado *{tipo}*.\n\nIngresa el monto mensual en ARS (ej: 400000 o 48804.44):",
        reply_markup=ReplyKeyboardRemove(),
        parse_mode='Markdown'
    )
    return MONTO_REC

async def procesar_monto(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text.replace('$', '').replace('.', '').replace(',', '.').strip()
    try:
        monto = float(text)
        if monto <= 0:
            raise ValueError()
        context.user_data['rec_monto'] = monto
    except ValueError:
        await update.message.reply_text("❌ Por favor ingresa un número válido mayor a 0.")
        return MONTO_REC
        
    cats = obtener_categorias()
    keyboard = []
    row = []
    for nombre, emoji in cats:
        row.append(f"{emoji} {nombre}")
        if len(row) == 2:
            keyboard.append(row)
            row = []
    if row:
        keyboard.append(row)
        
    await update.message.reply_text(
        "Selecciona la categoría:",
        reply_markup=ReplyKeyboardMarkup(keyboard, one_time_keyboard=True, resize_keyboard=True)
    )
    return CAT_REC

async def procesar_categoria(update: Update, context: ContextTypes.DEFAULT_TYPE):
    cat_raw = update.message.text
    cat_nombre = cat_raw.split()[-1] if len(cat_raw.split()) > 1 else cat_raw
    context.user_data['rec_categoria'] = cat_nombre
    
    await update.message.reply_text(
        "Ingresa una breve descripción (ej: Alquiler, Subscripción Netflix, Expensas, Sueldo):",
        reply_markup=ReplyKeyboardRemove()
    )
    return DESC_REC

async def procesar_descripcion(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data['rec_desc'] = update.message.text
    
    await update.message.reply_text(
        "¿Qué día de cada mes se cobra/paga? (Ingresa un día del 1 al 31):"
    )
    return DIA_REC

async def procesar_dia(update: Update, context: ContextTypes.DEFAULT_TYPE):
    try:
        dia = int(update.message.text.strip())
        if dia < 1 or dia > 31:
            raise ValueError()
        context.user_data['rec_dia'] = dia
    except ValueError:
        await update.message.reply_text("❌ Por favor ingresa un número entre 1 y 31.")
        return DIA_REC
        
    duraciones_kb = [['∞ Indefinido (Siempre)'], ['3 Meses', '6 Meses'], ['12 Meses (1 año)', '24 Meses (2 años)']]
    await update.message.reply_text(
        "¿Cuál es la duración periódica de esta transacción?",
        reply_markup=ReplyKeyboardMarkup(duraciones_kb, one_time_keyboard=True, resize_keyboard=True)
    )
    return DURACION_REC

async def procesar_duracion(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text.lower()
    duracion = None
    
    if '3' in text:
        duracion = 3
    elif '6' in text:
        duracion = 6
    elif '12' in text or '1 año' in text:
        duracion = 12
    elif '24' in text or '2 años' in text:
        duracion = 24
    elif 'indefinido' in text or 'siempre' in text:
        duracion = None
    else:
        try:
            duracion = int(text.split()[0])
        except Exception:
            duracion = None

    user = update.effective_user
    tipo = context.user_data.get('rec_tipo', 'GASTO')
    monto = context.user_data.get('rec_monto', 0)
    categoria = context.user_data.get('rec_categoria', 'Otros')
    desc = context.user_data.get('rec_desc', 'Recurrente')
    dia = context.user_data.get('rec_dia', 1)
    
    registrar_transaccion_recurrente(
        id_usuario=user.id,
        tipo=tipo,
        monto=monto,
        categoria=categoria,
        descripcion=desc,
        dia_cobro=dia,
        duracion_meses=duracion
    )
    
    dur_str = f"{duracion} meses" if duracion else "Indefinida (Siempre)"
    
    await update.message.reply_text(
        f"✅ *¡Transacción Recurrente Programada!*\n\n"
        f"📌 *Tipo:* {tipo}\n"
        f"💵 *Monto:* ${monto:,.2f} ARS\n"
        f"🏷️ *Categoría:* {categoria}\n"
        f"📝 *Descripción:* {desc}\n"
        f"📅 *Día de cobro:* Día {dia} de cada mes\n"
        f"⏳ *Duración:* {dur_str}\n\n"
        f"Se ejecutará automáticamente cada mes. Puedes gestionarla con `/recurrentes`.",
        reply_markup=ReplyKeyboardRemove(),
        parse_mode='Markdown'
    )
    return ConversationHandler.END

async def cancelar_recurrente(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("❌ Operación cancelada.", reply_markup=ReplyKeyboardRemove())
    return ConversationHandler.END

def get_recurrente_conversation_handler():
    return ConversationHandler(
        entry_points=[
            CommandHandler("nueva_recurrente", inicio_nueva_recurrente),
            CallbackQueryHandler(callback_recurrente_actions, pattern="^nueva_recurrente_start$")
        ],
        states={
            TIPO_REC: [MessageHandler(filters.TEXT & ~filters.COMMAND, procesar_tipo)],
            MONTO_REC: [MessageHandler(filters.TEXT & ~filters.COMMAND, procesar_monto)],
            CAT_REC: [MessageHandler(filters.TEXT & ~filters.COMMAND, procesar_categoria)],
            DESC_REC: [MessageHandler(filters.TEXT & ~filters.COMMAND, procesar_descripcion)],
            DIA_REC: [MessageHandler(filters.TEXT & ~filters.COMMAND, procesar_dia)],
            DURACION_REC: [MessageHandler(filters.TEXT & ~filters.COMMAND, procesar_duracion)],
        },
        fallbacks=[CommandHandler("cancelar", cancelar_recurrente)]
    )
