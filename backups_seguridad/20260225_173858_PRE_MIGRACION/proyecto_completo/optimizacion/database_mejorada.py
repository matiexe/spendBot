# database_mejorada.py - Gestión de BD con soporte para gastos e ingresos

import sqlite3
from datetime import datetime, timedelta
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

DATABASE_FILE = 'gastos_mejorada.db'

# ============= INICIALIZACIÓN DE LA BASE DE DATOS =============

def inicializar_bd():
    """Crea las tablas si no existen"""
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    
    # Tabla de usuarios
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS usuarios (
            id_usuario INTEGER PRIMARY KEY,
            nombre TEXT,
            username TEXT,
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Tabla de categorías (ahora con tipo)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS categorias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            emoji TEXT,
            tipo TEXT NOT NULL,
            UNIQUE(nombre, tipo)
        )
    ''')
    
    # Tabla de transacciones (gastos + ingresos)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS transacciones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            id_usuario INTEGER NOT NULL,
            tipo TEXT NOT NULL,
            monto REAL NOT NULL,
            categoria_id INTEGER NOT NULL,
            descripcion TEXT,
            fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            detectado_por_ia INTEGER DEFAULT 0,
            confianza_ia TEXT,
            FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
            FOREIGN KEY (categoria_id) REFERENCES categorias(id)
        )
    ''')
    
    # Tabla de presupuestos (también separados por tipo)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS presupuestos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            id_usuario INTEGER NOT NULL,
            categoria_id INTEGER NOT NULL,
            tipo TEXT NOT NULL,
            limite_mensual REAL NOT NULL,
            mes_ano TEXT NOT NULL,
            FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
            FOREIGN KEY (categoria_id) REFERENCES categorias(id),
            UNIQUE(id_usuario, categoria_id, tipo, mes_ano)
        )
    ''')
    
    # Tabla de análisis/estadísticas (para cache)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS estadisticas_cache (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            id_usuario INTEGER NOT NULL,
            tipo TEXT NOT NULL,
            periodo TEXT,
            datos JSON,
            fecha_calculo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
        )
    ''')
    
    conn.commit()
    conn.close()
    logger.info("Base de datos inicializada")

def insertar_categorias_defecto():
    """Inserta las categorías por defecto"""
    from config_mejorada import CATEGORIAS_GASTOS, CATEGORIAS_INGRESOS
    
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    
    # Insertar categorías de gastos
    for key, cat in CATEGORIAS_GASTOS.items():
        try:
            cursor.execute(
                'INSERT INTO categorias (nombre, emoji, tipo) VALUES (?, ?, ?)',
                (cat['nombre'], cat['emoji'], 'GASTO')
            )
        except sqlite3.IntegrityError:
            pass  # Ya existe
    
    # Insertar categorías de ingresos
    for key, cat in CATEGORIAS_INGRESOS.items():
        try:
            cursor.execute(
                'INSERT INTO categorias (nombre, emoji, tipo) VALUES (?, ?, ?)',
                (cat['nombre'], cat['emoji'], 'INGRESO')
            )
        except sqlite3.IntegrityError:
            pass  # Ya existe
    
    conn.commit()
    conn.close()
    logger.info("Categorías por defecto insertadas")

# ============= FUNCIONES DE USUARIOS =============

def obtener_o_crear_usuario(id_usuario, nombre, username):
    """Obtiene o crea un usuario"""
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    
    cursor.execute(
        'SELECT * FROM usuarios WHERE id_usuario = ?',
        (id_usuario,)
    )
    
    usuario = cursor.fetchone()
    
    if not usuario:
        cursor.execute(
            'INSERT INTO usuarios (id_usuario, nombre, username) VALUES (?, ?, ?)',
            (id_usuario, nombre, username)
        )
        conn.commit()
        logger.info(f"Nuevo usuario creado: {nombre} ({id_usuario})")
    
    conn.close()
    return usuario

# ============= FUNCIONES DE TRANSACCIONES (GASTOS E INGRESOS) =============

def registrar_transaccion(id_usuario, tipo, monto, categoria, descripcion='', 
                         detectado_por_ia=False, confianza_ia=None):
    """
    Registra una transacción (gasto o ingreso)
    
    Args:
        id_usuario: ID del usuario
        tipo: 'GASTO' o 'INGRESO'
        monto: Cantidad
        categoria: Nombre de la categoría
        descripcion: Descripción opcional
        detectado_por_ia: Si fue detectado automáticamente
        confianza_ia: Nivel de confianza ('alta', 'media', 'baja')
    """
    
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    
    # Obtener ID de la categoría
    cursor.execute(
        'SELECT id FROM categorias WHERE nombre = ? AND tipo = ?',
        (categoria, tipo.upper())
    )
    result = cursor.fetchone()
    
    if not result:
        conn.close()
        raise ValueError(f"Categoría no encontrada: {categoria}")
    
    categoria_id = result[0]
    
    # Insertar transacción
    cursor.execute(
        '''INSERT INTO transacciones 
           (id_usuario, tipo, monto, categoria_id, descripcion, 
            detectado_por_ia, confianza_ia, fecha) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
        (id_usuario, tipo.upper(), monto, categoria_id, descripcion,
         1 if detectado_por_ia else 0, confianza_ia, datetime.now())
    )
    
    conn.commit()
    conn.close()
    logger.info(f"Transacción registrada: {id_usuario} - {tipo} - ${monto} en {categoria}")

def obtener_transacciones(id_usuario, tipo=None, fecha_inicio=None, fecha_fin=None):
    """Obtiene transacciones con filtros opcionales"""
    
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    
    query = '''
        SELECT t.id, t.tipo, t.monto, c.nombre, c.emoji, t.descripcion, t.fecha, 
               t.detectado_por_ia, t.confianza_ia
        FROM transacciones t
        JOIN categorias c ON t.categoria_id = c.id
        WHERE t.id_usuario = ?
    '''
    params = [id_usuario]
    
    if tipo:
        query += ' AND t.tipo = ?'
        params.append(tipo.upper())
    
    if fecha_inicio:
        query += ' AND DATE(t.fecha) >= ?'
        params.append(fecha_inicio)
    
    if fecha_fin:
        query += ' AND DATE(t.fecha) <= ?'
        params.append(fecha_fin)
    
    query += ' ORDER BY t.fecha DESC'
    
    cursor.execute(query, params)
    transacciones = cursor.fetchall()
    conn.close()
    
    return transacciones

def obtener_transacciones_hoy(id_usuario, tipo=None):
    """Obtiene transacciones de hoy"""
    hoy = datetime.now().date()
    return obtener_transacciones(id_usuario, tipo=tipo, 
                                 fecha_inicio=hoy, fecha_fin=hoy)

def obtener_transacciones_mes(id_usuario, tipo=None):
    """Obtiene transacciones del mes actual"""
    ahora = datetime.now()
    primer_dia = ahora.replace(day=1)
    return obtener_transacciones(id_usuario, tipo=tipo, 
                                 fecha_inicio=primer_dia.date())

# ============= FUNCIONES DE ANÁLISIS =============

def obtener_total_transacciones(transacciones):
    """Calcula el total"""
    return sum(t[2] for t in transacciones)

def obtener_transacciones_por_categoria(id_usuario, tipo=None, 
                                        fecha_inicio=None, fecha_fin=None):
    """Obtiene transacciones agrupadas por categoría"""
    
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    
    query = '''
        SELECT c.nombre, c.emoji, SUM(t.monto) as total, COUNT(*) as cantidad
        FROM transacciones t
        JOIN categorias c ON t.categoria_id = c.id
        WHERE t.id_usuario = ?
    '''
    params = [id_usuario]
    
    if tipo:
        query += ' AND t.tipo = ?'
        params.append(tipo.upper())
    
    if fecha_inicio:
        query += ' AND DATE(t.fecha) >= ?'
        params.append(fecha_inicio)
    
    if fecha_fin:
        query += ' AND DATE(t.fecha) <= ?'
        params.append(fecha_fin)
    
    query += ' GROUP BY c.id ORDER BY total DESC'
    
    cursor.execute(query, params)
    datos = cursor.fetchall()
    conn.close()
    
    return datos

def obtener_balance_mes(id_usuario):
    """Obtiene el balance mensual (ingresos - gastos)"""
    
    ahora = datetime.now()
    primer_dia = ahora.replace(day=1)
    
    # Obtener gastos del mes
    gastos = obtener_transacciones(id_usuario, tipo='GASTO', 
                                   fecha_inicio=primer_dia.date())
    total_gastos = obtener_total_transacciones(gastos)
    
    # Obtener ingresos del mes
    ingresos = obtener_transacciones(id_usuario, tipo='INGRESO', 
                                     fecha_inicio=primer_dia.date())
    total_ingresos = obtener_total_transacciones(ingresos)
    
    balance = total_ingresos - total_gastos
    
    return {
        'ingresos': total_ingresos,
        'gastos': total_gastos,
        'balance': balance,
        'mes': ahora.strftime('%B %Y')
    }

# ============= FUNCIONES DE PRESUPUESTOS =============

def establecer_presupuesto(id_usuario, categoria, tipo, limite_mensual):
    """Establece un presupuesto"""
    
    ahora = datetime.now()
    mes_ano = ahora.strftime('%Y-%m')
    
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    
    # Obtener ID de la categoría
    cursor.execute(
        'SELECT id FROM categorias WHERE nombre = ? AND tipo = ?',
        (categoria, tipo.upper())
    )
    result = cursor.fetchone()
    
    if not result:
        conn.close()
        raise ValueError(f"Categoría no encontrada: {categoria}")
    
    categoria_id = result[0]
    
    # Insertar o actualizar presupuesto
    cursor.execute('''
        INSERT OR REPLACE INTO presupuestos 
        (id_usuario, categoria_id, tipo, limite_mensual, mes_ano)
        VALUES (?, ?, ?, ?, ?)
    ''', (id_usuario, categoria_id, tipo.upper(), limite_mensual, mes_ano))
    
    conn.commit()
    conn.close()
    logger.info(f"Presupuesto establecido: {id_usuario} - {categoria}: ${limite_mensual}")

def obtener_presupuestos(id_usuario, tipo=None):
    """Obtiene los presupuestos del usuario"""
    
    ahora = datetime.now()
    mes_ano = ahora.strftime('%Y-%m')
    
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    
    query = '''
        SELECT c.nombre, c.emoji, p.tipo, p.limite_mensual
        FROM presupuestos p
        JOIN categorias c ON p.categoria_id = c.id
        WHERE p.id_usuario = ? AND p.mes_ano = ?
    '''
    params = [id_usuario, mes_ano]
    
    if tipo:
        query += ' AND p.tipo = ?'
        params.append(tipo.upper())
    
    query += ' ORDER BY c.nombre'
    
    cursor.execute(query, params)
    presupuestos = cursor.fetchall()
    conn.close()
    
    return presupuestos

def verificar_sobregasto(id_usuario, categoria, tipo='GASTO'):
    """Verifica si se pasó del presupuesto"""
    
    ahora = datetime.now()
    primer_dia = ahora.replace(day=1)
    mes_ano = ahora.strftime('%Y-%m')
    
    # Obtener presupuesto
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT p.limite_mensual
        FROM presupuestos p
        JOIN categorias c ON p.categoria_id = c.id
        WHERE p.id_usuario = ? AND c.nombre = ? 
              AND p.tipo = ? AND p.mes_ano = ?
    ''', (id_usuario, categoria, tipo.upper(), mes_ano))
    
    result = cursor.fetchone()
    
    if not result:
        conn.close()
        return None  # No hay presupuesto
    
    limite = result[0]
    
    # Obtener gasto actual
    cursor.execute('''
        SELECT SUM(t.monto)
        FROM transacciones t
        JOIN categorias c ON t.categoria_id = c.id
        WHERE t.id_usuario = ? AND c.nombre = ? 
              AND t.tipo = ? AND DATE(t.fecha) >= ?
    ''', (id_usuario, categoria, tipo.upper(), primer_dia.date()))
    
    result = cursor.fetchone()
    conn.close()
    
    gasto_actual = result[0] if result[0] else 0
    
    return {
        'limite': limite,
        'gastado': gasto_actual,
        'disponible': limite - gasto_actual,
        'porcentaje': (gasto_actual / limite * 100) if limite > 0 else 0,
        'pasado': gasto_actual > limite
    }

# ============= FUNCIONES DE CATEGORÍAS =============

def obtener_categorias(tipo=None):
    """Obtiene todas las categorías o filtradas por tipo"""
    
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    
    query = 'SELECT nombre, emoji, tipo FROM categorias'
    params = []
    
    if tipo:
        query += ' WHERE tipo = ?'
        params.append(tipo.upper())
    
    query += ' ORDER BY tipo, nombre'
    
    cursor.execute(query, params)
    categorias = cursor.fetchall()
    conn.close()
    
    return categorias

# ============= INICIALIZACIÓN =============

if __name__ == '__main__':
    inicializar_bd()
    insertar_categorias_defecto()
    print("✅ Base de datos mejorada lista!")
    
    # Mostrar categorías
    categorias = obtener_categorias()
    print(f"\n📊 Categorías disponibles: {len(categorias)}")
    for nombre, emoji, tipo in categorias:
        print(f"  {emoji} {nombre:20} ({tipo})")
