# config_mejorada.py - Configuración mejorada con IA integrada

import os
from dotenv import load_dotenv
from pathlib import Path

# Cargar variables de entorno
load_dotenv()

# ============= CONFIGURACIÓN DE TELEGRAM =============
TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN', '')
WEBHOOK_URL = os.getenv('WEBHOOK_URL', '')
PORT = int(os.getenv('PORT', 8000))

# ============= CONFIGURACIÓN DE IA (Google Gemini) =============
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
GEMINI_MODEL = os.getenv('GEMINI_MODEL', 'gemini-1.5-flash')
GEMINI_MAX_TOKENS = 500

# ============= CONFIGURACIÓN DE BASE DE DATOS =============
DATABASE_URL = os.getenv(
    'DATABASE_URL',
    'sqlite:///./gastos.db'
)

# ============= CATEGORÍAS EXPANDIDAS =============

# GASTOS - 15 categorías
CATEGORIAS_GASTOS = {
    'comida': {
        'emoji': '🍔',
        'nombre': 'Comida',
        'palabras_clave': ['comida', 'almuerzo', 'cena', 'desayuno', 'restaurante', 'café', 'pizza', 'hamburgesa', 'hamburguesa', 'comidas', 'delivery']
    },
    'transporte': {
        'emoji': '🚗',
        'nombre': 'Transporte',
        'palabras_clave': ['transporte', 'uber', 'taxi', 'bus', 'colectivo', 'gasolina', 'nafta', 'estacionamiento', 'parking', 'viaje', 'pasaje']
    },
    'diversión': {
        'emoji': '🎮',
        'nombre': 'Diversión',
        'palabras_clave': ['cine', 'película', 'juego', 'diversión', 'entretenimiento', 'parque', 'discoteca', 'bar', 'concierto', 'evento']
    },
    'educación': {
        'emoji': '📚',
        'nombre': 'Educación',
        'palabras_clave': ['educación', 'libro', 'curso', 'clases', 'universidad', 'escuela', 'matrícula', 'capacitación', 'estudio', 'tutorial']
    },
    'salud': {
        'emoji': '💊',
        'nombre': 'Salud',
        'palabras_clave': ['medicina', 'medicamento', 'doctor', 'médico', 'hospital', 'farmacia', 'salud', 'vacuna', 'chequeo', 'odontología']
    },
    'hogar': {
        'emoji': '🏠',
        'nombre': 'Hogar',
        'palabras_clave': ['alquiler', 'casa', 'luz', 'agua', 'gas', 'electricidad', 'reparación', 'mantenimiento', 'muebles', 'decoración', 'internet']
    },
    'ropa': {
        'emoji': '👕',
        'nombre': 'Ropa',
        'palabras_clave': ['ropa', 'zapatos', 'camiseta', 'pantalón', 'vestido', 'chaqueta', 'prenda', 'tienda', 'moda', 'accesorios']
    },
    'belleza': {
        'emoji': '💄',
        'nombre': 'Belleza',
        'palabras_clave': ['belleza', 'peluquería', 'corte', 'cabello', 'spa', 'cosméticos', 'maquillaje', 'crema', 'masaje', 'manicura']
    },
    'regalo': {
        'emoji': '🎁',
        'nombre': 'Regalo',
        'palabras_clave': ['regalo', 'presente', 'cumpleaños', 'navidad', 'sorpresa', 'detalle', 'obsequio']
    },
    'viaje': {
        'emoji': '✈️',
        'nombre': 'Viaje',
        'palabras_clave': ['viaje', 'hotel', 'vuelo', 'avión', 'hostel', 'vacation', 'tour', 'maleta', 'pasaje', 'turismo']
    },
    'deporte': {
        'emoji': '⚽',
        'nombre': 'Deporte',
        'palabras_clave': ['deporte', 'gimnasio', 'membresía', 'entrenamiento', 'fútbol', 'tenis', 'yoga', 'equipo deportivo', 'entrenador']
    },
    'mascotas': {
        'emoji': '🐾',
        'nombre': 'Mascotas',
        'palabras_clave': ['mascota', 'perro', 'gato', 'veterinario', 'comida para mascotas', 'juguete', 'alimento animal', 'veterinaria']
    },
    'suscripciones': {
        'emoji': '🔔',
        'nombre': 'Suscripciones',
        'palabras_clave': ['suscripción', 'netflix', 'spotify', 'membresía', 'premium', 'app', 'software', 'licencia', 'streaming']
    },
    'servicios': {
        'emoji': '🔧',
        'nombre': 'Servicios',
        'palabras_clave': ['servicio', 'plomería', 'electricista', 'carpintería', 'limpieza', 'jardinería', 'técnico', 'reparador']
    },
    'otros': {
        'emoji': '💳',
        'nombre': 'Otros',
        'palabras_clave': ['otro', 'misc', 'varios', 'otros gastos']
    }
}

# INGRESOS - 12 categorías
CATEGORIAS_INGRESOS = {
    'salario': {
        'emoji': '💼',
        'nombre': 'Salario',
        'palabras_clave': ['salario', 'sueldo', 'pago', 'quincena', 'payroll', 'nómina', 'sueldo', 'ganancias']
    },
    'freelance': {
        'emoji': '💻',
        'nombre': 'Freelance',
        'palabras_clave': ['freelance', 'proyecto', 'consultoría', 'honorarios', 'servicio prestado', 'trabajo independiente']
    },
    'inversión': {
        'emoji': '📈',
        'nombre': 'Inversión',
        'palabras_clave': ['inversión', 'dividendos', 'ganancias', 'retorno', 'interés', 'rendimiento']
    },
    'venta': {
        'emoji': '🛍️',
        'nombre': 'Venta',
        'palabras_clave': ['venta', 'vendido', 'vendí', 'producto', 'ecommerce', 'online', 'mercado libre']
    },
    'negocio': {
        'emoji': '🏪',
        'nombre': 'Negocio',
        'palabras_clave': ['negocio', 'empresa', 'comercio', 'ingresos empresa', 'ventas', 'facturación']
    },
    'beca': {
        'emoji': '🎓',
        'nombre': 'Beca',
        'palabras_clave': ['beca', 'ayuda educativa', 'subsidio educación', 'fondo educativo']
    },
    'regalo_ingreso': {
        'emoji': '🎁',
        'nombre': 'Regalo',
        'palabras_clave': ['regalo', 'recibí regalo', 'dinero regalado']
    },
    'reembolso': {
        'emoji': '↩️',
        'nombre': 'Reembolso',
        'palabras_clave': ['reembolso', 'devolución', 'devuelto', 'retorno dinero', 'reintegro']
    },
    'bonus': {
        'emoji': '🎉',
        'nombre': 'Bonus',
        'palabras_clave': ['bonus', 'bonificación', 'aguinaldo', 'prima', 'extra']
    },
    'ahorro': {
        'emoji': '🏦',
        'nombre': 'Ahorro',
        'palabras_clave': ['ahorro', 'depósito', 'interés banco', 'cuenta', 'inversión fija']
    },
    'herencia': {
        'emoji': '👨‍⚖️',
        'nombre': 'Herencia',
        'palabras_clave': ['herencia', 'legado', 'testamento', 'sucesión']
    },
    'otros_ingresos': {
        'emoji': '💰',
        'nombre': 'Otros',
        'palabras_clave': ['otro ingreso', 'ingreso', 'dinero']
    }
}

# ============= CONFIGURACIÓN DE IA PARA DETECCIÓN =============

PROMPT_DETECCION_IA = """Eres un asistente especializado en clasificación financiera. 

Analiza el siguiente mensaje y extrae:
1. TIPO: ¿Es un GASTO o INGRESO?
2. CATEGORÍA: De la lista proporcionada, ¿cuál es la categoría?
3. MONTO: Si se menciona, extrae el monto (solo el número)
4. CONFIANZA: (alta/media/baja) - Qué tan seguro estás

IMPORTANTE:
- Sé muy específico en la categoría
- Si hay múltiples gastos/ingresos, menciona el principal
- Si no hay monto pero es detectable, responde "No especificado"

Responde en formato JSON:
{{
    "tipo": "GASTO|INGRESO",
    "categoria": "nombre_categoria",
    "monto": "número o null",
    "confianza": "alta|media|baja",
    "descripcion": "resumen de lo entendido"
}}

CATEGORÍAS GASTOS: {gastos_list}
CATEGORÍAS INGRESOS: {ingresos_list}

Mensaje a clasificar:
"{mensaje}"
"""

# ============= CONFIGURACIÓN DE LOGGING =============
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'

# ============= CONFIGURACIÓN DE APLICACIÓN =============
TIMEZONE = 'America/Argentina/Buenos_Aires'
MONEDA = '$'

# ============= LÍMITES Y VALIDACIONES =============
MONTO_MINIMO = 0.01
MONTO_MAXIMO = 999999.99
DESCRIPCION_MAX_LENGTH = 500

# ============= MENSAJES DEL BOT MEJORADOS =============
MENSAJES = {
    'bienvenida': """
¡Hola {nombre}! 👋

Soy tu asistente de finanzas personal. Ahora puedo:
📝 Registrar gastos E ingresos
🤖 Detectar automáticamente la categoría
📊 Ver resúmenes detallados
📈 Mostrar gráficos y estadísticas
💰 Establecer presupuestos

Usa /ayuda para más información.
    """,
    
    'ayuda': """
📚 COMANDOS DISPONIBLES:

📝 REGISTRAR:
  /gasto - Registrar un gasto (con IA)
  /ingreso - Registrar un ingreso (con IA)
  
  Ejemplos:
  "Compré pizza por $50"
  "Me pagaron el sueldo de $5000"

📊 VER RESÚMENES:
  /resumen_hoy - Gastos de hoy
  /resumen_mes - Gastos del mes
  /balance - Ingresos vs Gastos
  /resumen - Rango de fechas

💰 PRESUPUESTOS:
  /presupuesto - Establecer límites
  /presupuestos - Ver presupuestos

📈 ESTADÍSTICAS:
  /stats - Gráficos y análisis
  /categorías - Ver todas las categorías

❓ OTROS:
  /ayuda - Este mensaje
    """,
    
    'error_monto': "❌ No encontré un monto válido. Por favor especifica una cantidad.",
    'error_categoria': "❌ No pude identificar la categoría. ¿Puedes ser más específico?",
    'error_generico': "❌ Ocurrió un error. Por favor intenta de nuevo.",
    'gasto_registrado': "✅ ¡Gasto registrado!",
    'ingreso_registrado': "✅ ¡Ingreso registrado!",
    'cancelado': "❌ Operación cancelada",
}

# ============= FUNCIONES AUXILIARES =============

def obtener_categorias_por_tipo(tipo):
    """Retorna el diccionario de categorías según el tipo"""
    if tipo.upper() == 'GASTO':
        return CATEGORIAS_GASTOS
    elif tipo.upper() == 'INGRESO':
        return CATEGORIAS_INGRESOS
    return {}

def obtener_lista_categorias_texto(tipo):
    """Retorna lista de categorías formateadas para IA"""
    categorias = obtener_categorias_por_tipo(tipo)
    return ', '.join([f"{cat['emoji']} {cat['nombre']}" for cat in categorias.values()])

def generar_prompt_deteccion(mensaje, tipo='GASTO'):
    """Genera el prompt para Claude con las categorías actuales"""
    categorias_gasto = ', '.join([f"{cat['emoji']} {cat['nombre']}" for cat in CATEGORIAS_GASTOS.values()])
    categorias_ingreso = ', '.join([f"{cat['emoji']} {cat['nombre']}" for cat in CATEGORIAS_INGRESOS.values()])
    
    return PROMPT_DETECCION_IA.format(
        mensaje=mensaje,
        gastos_list=categorias_gasto,
        ingresos_list=categorias_ingreso
    )

def validar_config():
    """Valida que la configuración sea correcta"""
    if not TELEGRAM_BOT_TOKEN:
        raise ValueError(
            "❌ TELEGRAM_BOT_TOKEN no está definido. "
            "Agrega tu token en el archivo .env"
        )
    if not GEMINI_API_KEY:
        raise ValueError(
            "❌ GEMINI_API_KEY no está definida. "
            "Obtené tu API key gratis en: https://aistudio.google.com/app/apikey\n"
            "Luego agregala al archivo .env como: GEMINI_API_KEY=tu_api_key"
        )
    return True

# Ejecutar validación al importar
try:
    validar_config()
except ValueError as e:
    print(e)

if __name__ == '__main__':
    print("✅ Configuración cargada correctamente")
    print(f"📊 Categorías de Gastos: {len(CATEGORIAS_GASTOS)}")
    print(f"💰 Categorías de Ingresos: {len(CATEGORIAS_INGRESOS)}")
