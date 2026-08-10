import logging
import os
from dotenv import load_dotenv
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    filters,
    ConversationHandler
)

from config import TELEGRAM_BOT_TOKEN, WEBHOOK_URL
from handlers.start_handler import start, ayuda, error_handler
from handlers.gasto_handler import registrar_gasto_inicio, procesar_monto, procesar_categoria, procesar_descripcion, cancelar, MONTO, CATEGORIA, DESCRIPCION
from handlers.resumen_handler import resumen_hoy, resumen_mes, resumen_custom, ver_categorias
from handlers.presupuesto_handler import presupuesto_inicio, procesar_categoria_presupuesto, procesar_monto_presupuesto, ver_presupuestos, cancelar_presupuesto, CAT_PRESUPUESTO, MONTO_PRESUPUESTO
from handlers.stats_handler import stats
from handlers.ia_handler import get_ia_conversation_handler
from handlers.recurrente_handler import ver_recurrentes, callback_recurrente_actions, get_recurrente_conversation_handler
from telegram.ext import CallbackQueryHandler
from database import inicializar_bd, insertar_categorias_defecto, procesar_transacciones_recurrentes_pendientes

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

def main():
    inicializar_bd()
    insertar_categorias_defecto()
    
    # Procesar transacciones recurrentes pendientes al arrancar
    n_proc = procesar_transacciones_recurrentes_pendientes()
    if n_proc > 0:
        logger.info(f"Se procesaron {n_proc} transacciones recurrentes pendientes al inicio.")
    
    app = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
    
    # Comandos basicos
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("ayuda", ayuda))
    app.add_handler(CommandHandler("categorias", ver_categorias))
    
    # Resumenes
    app.add_handler(CommandHandler("resumen_hoy", resumen_hoy))
    app.add_handler(CommandHandler("resumen_mes", resumen_mes))
    app.add_handler(CommandHandler("resumen", resumen_custom))
    
    # Stats y Presupuestos
    app.add_handler(CommandHandler("stats", stats))
    app.add_handler(CommandHandler("presupuestos", ver_presupuestos))
    
    # Transacciones Recurrentes
    app.add_handler(CommandHandler("recurrentes", ver_recurrentes))
    app.add_handler(CallbackQueryHandler(callback_recurrente_actions, pattern="^(toggle_rec_|del_rec_|nueva_recurrente_start)"))
    app.add_handler(get_recurrente_conversation_handler())
    
    # Gasto Conversation
    conv_handler_gasto = ConversationHandler(
        entry_points=[CommandHandler("gasto", registrar_gasto_inicio)],
        states={
            MONTO: [MessageHandler(filters.TEXT & ~filters.COMMAND, procesar_monto)],
            CATEGORIA: [MessageHandler(filters.TEXT & ~filters.COMMAND, procesar_categoria)],
            DESCRIPCION: [MessageHandler(filters.TEXT & ~filters.COMMAND, procesar_descripcion)],
        },
        fallbacks=[CommandHandler("cancelar", cancelar)],
    )
    app.add_handler(conv_handler_gasto)
    
    # Presupuesto Conversation
    conv_handler_presupuesto = ConversationHandler(
        entry_points=[CommandHandler("presupuesto", presupuesto_inicio)],
        states={
            CAT_PRESUPUESTO: [MessageHandler(filters.TEXT & ~filters.COMMAND, procesar_categoria_presupuesto)],
            MONTO_PRESUPUESTO: [MessageHandler(filters.TEXT & ~filters.COMMAND, procesar_monto_presupuesto)],
        },
        fallbacks=[CommandHandler("cancelar", cancelar_presupuesto)],
    )
    app.add_handler(conv_handler_presupuesto)
    
    # IA con Gemini: registrar gastos/ingresos en lenguaje natural
    app.add_handler(get_ia_conversation_handler())
    
    app.add_error_handler(error_handler)
    
    logger.info("Bot iniciado")
    
    if WEBHOOK_URL:
        PORT = int(os.getenv('PORT', 8000))
        app.run_webhook(
            listen="0.0.0.0",
            port=PORT,
            url_path=TELEGRAM_BOT_TOKEN,
            webhook_url=f"{WEBHOOK_URL}/{TELEGRAM_BOT_TOKEN}"
        )
    else:
        app.run_polling()

if __name__ == '__main__':
    main()
