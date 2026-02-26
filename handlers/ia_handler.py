# handlers/ia_handler.py
# Registra gastos/ingresos con lenguaje natural usando Google Gemini

import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    ContextTypes,
    ConversationHandler,
    CommandHandler,
    MessageHandler,
    CallbackQueryHandler,
    filters,
)
from database import registrar_gasto, obtener_o_crear_usuario

logger = logging.getLogger(__name__)

# Estados del ConversationHandler
IA_MENSAJE, IA_CONFIRMAR = range(10, 12)

# ----------- Lazy import para no fallar si el módulo no está listo -----------
def _get_detector():
    import sys, os
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'optimizacion'))
    from gemini_integration import detectar_gasto_o_ingreso, obtener_recomendaciones
    return detectar_gasto_o_ingreso, obtener_recomendaciones


# ====================== HANDLERS ======================

async def ia_inicio(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Entrada: /registrar  — pide descripción libre al usuario."""
    await update.message.reply_text(
        "🤖 *Registrar con IA*\n\n"
        "Describí tu gasto o ingreso en lenguaje natural.\n\n"
        "Ejemplos:\n"
        "• _Compré pizza por 4500 pesos_\n"
        "• _Me pagaron el sueldo de 350000_\n"
        "• _Gasté 2000 en nafta_\n\n"
        "Escribí tu mensaje 👇",
        parse_mode="Markdown"
    )
    return IA_MENSAJE


async def ia_procesar_mensaje(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Llama a Gemini y pide confirmación al usuario."""
    mensaje = update.message.text
    usuario = update.effective_user

    procesando = await update.message.reply_text("🤖 Analizando con Gemini...")

    try:
        detectar_gasto_o_ingreso, _ = _get_detector()
        deteccion = detectar_gasto_o_ingreso(mensaje)
    except Exception as e:
        await procesando.edit_text(f"❌ Error al conectar con la IA: {e}")
        return ConversationHandler.END

    # Guardar en contexto
    context.user_data['ia_deteccion'] = deteccion
    context.user_data['ia_mensaje_original'] = mensaje
    context.user_data['ia_usuario_id'] = usuario.id
    context.user_data['ia_usuario_nombre'] = usuario.first_name
    context.user_data['ia_usuario_username'] = usuario.username

    tipo = deteccion.get('tipo', 'GASTO')
    categoria = deteccion.get('categoria', 'otros')
    monto = deteccion.get('monto')
    confianza = deteccion.get('confianza', 'baja')

    # Emoji de confianza
    emoji_conf = {'alta': '✅', 'media': '⚠️', 'baja': '❓'}.get(confianza, '❓')
    tipo_emoji = '💸' if tipo == 'GASTO' else '💰'

    texto_conf = (
        f"{emoji_conf} *Detección automática:*\n\n"
        f"{tipo_emoji} Tipo: *{tipo}*\n"
        f"📂 Categoría: *{categoria}*\n"
        f"💵 Monto: *{'$' + str(monto) if monto else 'No detectado'}* ARS\n"
        f"🎯 Confianza: *{confianza.title()}*\n\n"
        f"¿Guardamos este registro?"
    )

    keyboard = [
        [
            InlineKeyboardButton("✅ Sí, guardar", callback_data='ia_confirmar_si'),
            InlineKeyboardButton("❌ Cancelar", callback_data='ia_confirmar_no'),
        ]
    ]

    # Si no detectó monto, avisar
    if not monto:
        texto_conf += "\n\n⚠️ _No se detectó monto — se guardará en $0. Podés cancelar y ser más específico._"

    await procesando.edit_text(texto_conf, parse_mode="Markdown",
                               reply_markup=InlineKeyboardMarkup(keyboard))
    return IA_CONFIRMAR


async def ia_confirmar(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Guarda la transacción si el usuario confirmó."""
    query = update.callback_query
    await query.answer()

    if query.data == 'ia_confirmar_no':
        await query.edit_message_text("❌ Operación cancelada.")
        return ConversationHandler.END

    deteccion = context.user_data.get('ia_deteccion', {})
    usuario_id = context.user_data.get('ia_usuario_id')
    nombre = context.user_data.get('ia_usuario_nombre', '')
    username = context.user_data.get('ia_usuario_username', '')
    mensaje_original = context.user_data.get('ia_mensaje_original', '')

    tipo = deteccion.get('tipo', 'GASTO')
    categoria = deteccion.get('categoria', 'Otros').capitalize()
    monto_raw = deteccion.get('monto') or 0
    monto = float(monto_raw)

    try:
        obtener_o_crear_usuario(usuario_id, nombre, username)
        registrar_gasto(
            usuario_id,
            monto,           # siempre positivo, tipo indica dirección
            categoria,
            mensaje_original,
            origen='Telegram',
            tipo=tipo        # pasamos explícitamente GASTO o INGRESO
        )
        tipo_emoji = '💸' if tipo == 'GASTO' else '💰'
        await query.edit_message_text(
            f"✅ *¡Registrado con IA!*\n\n"
            f"{tipo_emoji} {tipo}: *${abs(monto):.2f}* en *{categoria}*\n"
            f"📝 _{mensaje_original}_",
            parse_mode="Markdown"
        )
    except Exception as e:
        logger.error(f"Error guardando transacción IA: {e}")
        await query.edit_message_text(f"❌ Error al guardar: {e}")

    return ConversationHandler.END


async def ia_cancelar(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("❌ Operación cancelada.")
    return ConversationHandler.END


# ====================== CONVERSATION HANDLER ======================

def get_ia_conversation_handler():
    return ConversationHandler(
        entry_points=[CommandHandler("registrar", ia_inicio)],
        states={
            IA_MENSAJE: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, ia_procesar_mensaje)
            ],
            IA_CONFIRMAR: [
                CallbackQueryHandler(ia_confirmar, pattern='^ia_confirmar_')
            ],
        },
        fallbacks=[CommandHandler("cancelar", ia_cancelar)],
    )
