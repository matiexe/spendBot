# main_mejorado.py - Bot con detección automática de categorías

import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    CallbackQueryHandler,
    ContextTypes,
    ConversationHandler,
    filters,
)
import os
from dotenv import load_dotenv
from gemini_integration import detectar_gasto_o_ingreso, obtener_recomendaciones
from database_mejorada import (
    inicializar_bd, insertar_categorias_defecto, obtener_o_crear_usuario,
    registrar_transaccion, obtener_transacciones_hoy, obtener_transacciones_mes,
    obtener_balance_mes, obtener_transacciones_por_categoria, 
    establecer_presupuesto, obtener_presupuestos, verificar_sobregasto,
    obtener_categorias
)
from config_mejorada import MENSAJES, CATEGORIAS_GASTOS, CATEGORIAS_INGRESOS

# Cargar variables de entorno
load_dotenv()
TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')

# Configurar logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Estados para ConversationHandler
TIPO_TRANSACCION, MENSAJE_USUARIO, CONFIRMAR, PRESUPUESTO_CATEGORIA, PRESUPUESTO_MONTO = range(5)

# Inicializar base de datos
try:
    inicializar_bd()
    insertar_categorias_defecto()
except Exception as e:
    logger.error(f"Error inicializando BD: {e}")

# ============= HANDLERS DE COMANDOS =============

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Comando /start - Mensaje de bienvenida"""
    usuario = update.effective_user
    
    # Crear usuario en BD
    obtener_o_crear_usuario(usuario.id, usuario.first_name, usuario.username)
    
    mensaje = MENSAJES['bienvenida'].format(nombre=usuario.first_name)
    
    # Crear teclado con opciones
    keyboard = [
        [
            InlineKeyboardButton("📝 Gasto", callback_data='tipo_gasto'),
            InlineKeyboardButton("💰 Ingreso", callback_data='tipo_ingreso'),
        ],
        [
            InlineKeyboardButton("📊 Resumen", callback_data='resumen_mes'),
            InlineKeyboardButton("📈 Estadísticas", callback_data='stats'),
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(mensaje, reply_markup=reply_markup)

async def ayuda(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Comando /ayuda - Instrucciones"""
    await update.message.reply_text(MENSAJES['ayuda'])

async def registrar_transaccion_comando(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Inicia el flujo para registrar una transacción con IA"""
    
    # Detectar si es gasto o ingreso desde el comando
    comando = update.message.text.split()[0]
    
    if '/gasto' in comando:
        context.user_data['tipo'] = 'GASTO'
    elif '/ingreso' in comando:
        context.user_data['tipo'] = 'INGRESO'
    
    await update.message.reply_text(
        f"📝 Descríbeme el {context.user_data['tipo'].lower()}\n\n"
        "Ejemplo: 'Compré una hamburguesa por $50'\n"
        "O: 'Me pagaron el sueldo de $5000'"
    )
    
    return MENSAJE_USUARIO

async def procesar_mensaje_usuario(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Procesa el mensaje del usuario y usa IA para detectar categoría"""
    
    mensaje = update.message.text
    usuario = update.effective_user
    
    # Detectar tipo, categoría y monto usando Claude
    await update.message.reply_text("🤖 Analizando el mensaje con IA...")
    
    try:
        deteccion = detectar_gasto_o_ingreso(mensaje)
        
        logger.info(f"Detección: {deteccion}")
        
        # Guardar en contexto
        context.user_data['deteccion'] = deteccion
        context.user_data['tipo'] = deteccion.get('tipo', 'GASTO')
        context.user_data['categoria'] = deteccion.get('categoria')
        context.user_data['monto'] = deteccion.get('monto')
        context.user_data['descripcion'] = mensaje
        
        # Construir mensaje de confirmación
        confianza_emoji = {
            'alta': '✅',
            'media': '⚠️',
            'baja': '❓'
        }
        
        emoji_confianza = confianza_emoji.get(deteccion.get('confianza', 'media'), '❓')
        
        mensaje_confirmacion = f"""
{emoji_confianza} Detección automática:

💵 Tipo: {deteccion.get('tipo', 'Desconocido')}
📂 Categoría: {deteccion.get('categoria', 'No detectada')}
💰 Monto: ${deteccion.get('monto', 'No especificado')}
📝 Descripción: {deteccion.get('descripcion', 'N/A')}
🎯 Confianza: {deteccion.get('confianza', 'media').title()}

¿Es correcto?
"""
        
        # Crear teclado de confirmación
        keyboard = [
            [
                InlineKeyboardButton("✅ Sí, guardar", callback_data='confirmar_si'),
                InlineKeyboardButton("❌ No, cancelar", callback_data='confirmar_no'),
            ]
        ]
        
        # Si la confianza es media o baja, mostrar alternativas
        if deteccion.get('confianza') in ['media', 'baja']:
            recomendaciones = obtener_recomendaciones(
                mensaje, 
                tipo=deteccion.get('tipo', 'GASTO')
            )
            
            if recomendaciones:
                mensaje_confirmacion += f"\n💡 Otras opciones: {', '.join(recomendaciones)}"
        
        await update.message.reply_text(
            mensaje_confirmacion,
            reply_markup=InlineKeyboardMarkup(keyboard)
        )
        
        return CONFIRMAR
        
    except Exception as e:
        logger.error(f"Error en detección: {e}")
        await update.message.reply_text(
            f"❌ Error al procesar el mensaje: {e}\n\n"
            "Por favor intenta de nuevo o sé más específico."
        )
        return MENSAJE_USUARIO

async def confirmar_transaccion(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Confirma y guarda la transacción"""
    
    query = update.callback_query
    usuario = update.effective_user
    
    await query.answer()
    
    if 'si' in query.data:
        try:
            deteccion = context.user_data.get('deteccion', {})
            
            # Registrar transacción
            registrar_transaccion(
                id_usuario=usuario.id,
                tipo=deteccion.get('tipo', 'GASTO'),
                monto=deteccion.get('monto', 0),
                categoria=deteccion.get('categoria', 'Otros'),
                descripcion=context.user_data.get('descripcion', ''),
                detectado_por_ia=True,
                confianza_ia=deteccion.get('confianza')
            )
            
            # Verificar presupuesto
            sobregasto = verificar_sobregasto(
                usuario.id,
                deteccion.get('categoria', 'Otros'),
                deteccion.get('tipo', 'GASTO')
            )
            
            mensaje = f"✅ ¡{MENSAJES['gasto_registrado' if deteccion.get('tipo') == 'GASTO' else 'ingreso_registrado']}!\n\n"
            
            if sobregasto and sobregasto['pasado']:
                mensaje += f"⚠️ ALERTA: ¡Has pasado el presupuesto!\n"
                mensaje += f"Límite: ${sobregasto['limite']:.2f}\n"
                mensaje += f"Gastado: ${sobregasto['gastado']:.2f}\n"
                mensaje += f"Exceso: ${abs(sobregasto['disponible']):.2f}\n"
            elif sobregasto:
                porcentaje_restante = (sobregasto['disponible'] / sobregasto['limite'] * 100)
                mensaje += f"📊 Presupuesto: {sobregasto['porcentaje']:.1f}% utilizado\n"
                mensaje += f"💵 Disponible: ${sobregasto['disponible']:.2f}\n"
            
            await query.edit_message_text(mensaje)
            
        except Exception as e:
            logger.error(f"Error guardando transacción: {e}")
            await query.edit_message_text(f"❌ Error: {e}")
    else:
        await query.edit_message_text("❌ Operación cancelada")
    
    return ConversationHandler.END

async def ver_resumen(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Muestra el resumen del mes"""
    
    query = update.callback_query
    usuario = update.effective_user
    
    await query.answer()
    
    # Obtener transacciones del mes
    balance = obtener_balance_mes(usuario.id)
    
    # Obtener transacciones por categoría
    transacciones_por_cat = obtener_transacciones_por_categoria(usuario.id)
    
    mensaje = f"""
📊 RESUMEN DE {balance['mes'].upper()}

💰 INGRESOS: ${balance['ingresos']:.2f}
💸 GASTOS: ${balance['gastos']:.2f}
═══════════════════
📈 BALANCE: ${balance['balance']:.2f}

📂 TOP GASTOS POR CATEGORÍA:
"""
    
    for nombre, emoji, total, cantidad in transacciones_por_cat[:5]:
        mensaje += f"{emoji} {nombre:15} ${total:8.2f} ({cantidad} {'gasto' if cantidad == 1 else 'gastos'})\n"
    
    await query.edit_message_text(mensaje)

async def ver_estadisticas(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Muestra estadísticas básicas"""
    
    query = update.callback_query
    usuario = update.effective_user
    
    await query.answer()
    
    balance = obtener_balance_mes(usuario.id)
    
    mensaje = f"""
📈 ESTADÍSTICAS DEL MES

💼 INGRESOS: ${balance['ingresos']:.2f}
🛒 GASTOS: ${balance['gastos']:.2f}

💡 RATIO: {(balance['gastos']/balance['ingresos']*100) if balance['ingresos'] > 0 else 0:.1f}% de los ingresos se gastan

🎯 RECOMENDACIÓN:
"""
    
    ratio = (balance['gastos']/balance['ingresos']) if balance['ingresos'] > 0 else 0
    
    if ratio > 1:
        mensaje += "⚠️ ¡Cuidado! Estás gastando más de lo que ganas"
    elif ratio > 0.8:
        mensaje += "⚡ Estás gastando bastante, considera reducir"
    else:
        mensaje += "✅ ¡Muy bien! Estás ahorrando dinero"
    
    await query.edit_message_text(mensaje)

async def listar_categorias(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Muestra todas las categorías"""
    
    usuario = update.effective_user
    
    categorias = obtener_categorias()
    
    mensaje = "📂 CATEGORÍAS DISPONIBLES\n\n"
    
    mensaje += "GASTOS:\n"
    for nombre, emoji, tipo in categorias:
        if tipo == 'GASTO':
            mensaje += f"{emoji} {nombre}\n"
    
    mensaje += "\nINGRESOS:\n"
    for nombre, emoji, tipo in categorias:
        if tipo == 'INGRESO':
            mensaje += f"{emoji} {nombre}\n"
    
    await update.message.reply_text(mensaje)

async def cancelar(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Cancela la operación actual"""
    await update.message.reply_text("❌ Operación cancelada")
    return ConversationHandler.END

async def error_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Maneja errores"""
    logger.error(f'Error: {context.error}')
    if update:
        try:
            await update.message.reply_text(
                "❌ Ocurrió un error. Por favor intenta de nuevo."
            )
        except:
            pass

# ============= FUNCIÓN PRINCIPAL =============

def main():
    """Inicia el bot"""
    
    # Crear aplicación
    app = Application.builder().token(TOKEN).build()
    
    # Handlers de comandos simples
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("ayuda", ayuda))
    app.add_handler(CommandHandler("categorias", listar_categorias))
    
    # Conversation handler para registrar transacción
    conv_handler = ConversationHandler(
        entry_points=[
            CommandHandler("gasto", registrar_transaccion_comando),
            CommandHandler("ingreso", registrar_transaccion_comando),
        ],
        states={
            MENSAJE_USUARIO: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, procesar_mensaje_usuario)
            ],
            CONFIRMAR: [
                CallbackQueryHandler(confirmar_transaccion)
            ],
        },
        fallbacks=[CommandHandler("cancelar", cancelar)],
    )
    
    app.add_handler(conv_handler)
    
    # Handlers de botones
    app.add_handler(CallbackQueryHandler(ver_resumen, pattern='resumen_mes'))
    app.add_handler(CallbackQueryHandler(ver_estadisticas, pattern='stats'))
    app.add_handler(CallbackQueryHandler(registrar_transaccion_callback, pattern='tipo_'))
    
    # Error handler
    app.add_error_handler(error_handler)
    
    # Iniciar bot
    logger.info("Bot iniciado")
    app.run_polling()

async def registrar_transaccion_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Maneja el callback del tipo de transacción"""
    
    query = update.callback_query
    await query.answer()
    
    if 'gasto' in query.data:
        context.user_data['tipo'] = 'GASTO'
    else:
        context.user_data['tipo'] = 'INGRESO'
    
    await query.edit_message_text(
        f"📝 Descríbeme el {context.user_data['tipo'].lower()}\n\n"
        "Ejemplo: 'Compré una hamburguesa por $50'"
    )

if __name__ == '__main__':
    main()
