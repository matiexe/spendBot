from telegram import Update
from telegram.ext import ContextTypes
from config import MENSAJES
from database import obtener_o_crear_usuario, vincular_telegram

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    usuario = update.effective_user
    
    # Verificar si el usuario está enviando un código de vinculación Web (ej: /start VIN-A1B2C3)
    if context.args and len(context.args) > 0 and context.args[0].startswith('VIN-'):
        token = context.args[0]
        res = vincular_telegram(usuario.id, usuario.username, token)
        if res:
            await update.message.reply_text(
                f"🎉 ¡Vinculación Exitosa, {res['nombre']}!\n\n"
                f"Tu cuenta de Telegram ha sido conectada correctamente a tu Dashboard de SpendBot Web.\n\n"
                f"Cualquier gasto o ingreso que registres por este chat aparecerá automáticamente en tu panel personal."
            )
            return
        else:
            await update.message.reply_text(
                "❌ Código de vinculación inválido o expirado.\n"
                "Iniciá sesión en el Dashboard Web para obtener un nuevo código."
            )
            return

    obtener_o_crear_usuario(usuario.id, usuario.first_name, usuario.username)
    mensaje = MENSAJES['bienvenida'].format(nombre=usuario.first_name)
    await update.message.reply_text(mensaje)

async def ayuda(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(MENSAJES['ayuda'])

async def error_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    import logging
    logger = logging.getLogger(__name__)
    logger.error(f'Error: {context.error}')
    if update and update.message:
        await update.message.reply_text(MENSAJES['error_generico'])
