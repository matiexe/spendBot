from telegram import Update
from telegram.ext import ContextTypes
from config import MENSAJES
from database import obtener_o_crear_usuario

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    usuario = update.effective_user
    obtener_o_crear_usuario(usuario.id, usuario.first_name, usuario.username)
    
    mensaje = MENSAJES['bienvenida'].format(nombre=usuario.first_name)
    await update.message.reply_text(mensaje)

async def ayuda(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(MENSAJES['ayuda'])

async def error_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    import logging
    logger = logging.getLogger(__name__)
    logger.error(f'Error: {context.error}')
    if update:
        await update.message.reply_text(MENSAJES['error_generico'])
