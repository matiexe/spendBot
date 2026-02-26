# database.py - Gestión de la base de datos

import sqlite3
from datetime import datetime, timedelta
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

DATABASE_FILE = 'gastos.db'

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
    
    # Tabla de categorías
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS categorias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT UNIQUE,
            emoji TEXT
        )
    ''')
    
    # Tabla de gastos
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS gastos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            id_usuario INTEGER NOT NULL,
            monto REAL NOT NULL,
            categoria_id INTEGER NOT NULL,
            descripcion TEXT,
            fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            cuenta TEXT DEFAULT '-',
            origen TEXT DEFAULT 'N/A',
            FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
            FOREIGN KEY (categoria_id) REFERENCES categorias(id)
        )
    ''')
    
    # Tabla de presupuestos
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS presupuestos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            id_usuario INTEGER NOT NULL,
            categoria_id INTEGER NOT NULL,
            limite_mensual REAL NOT NULL,
            mes_ano TEXT NOT NULL,
            FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
            FOREIGN KEY (categoria_id) REFERENCES categorias(id),
            UNIQUE(id_usuario, categoria_id, mes_ano)
        )
    ''')
    
    conn.commit()
    conn.close()
    logger.info("Base de datos inicializada")

def insertar_categorias_defecto():
    """Inserta las categorías por defecto"""
    categorias = [
        ('Comida', '🍔'),
        ('Transporte', '🚗'),
        ('Diversión', '🎮'),
        ('Educación', '📚'),
        ('Salud', '💊'),
        ('Hogar', '🏠'),
        ('Otros', '💳')
    ]
    
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    
    for nombre, emoji in categorias:
        try:
            cursor.execute(
                'INSERT INTO categorias (nombre, emoji) VALUES (?, ?)',
                (nombre, emoji)
            )
        except sqlite3.IntegrityError:
            pass  # Ya existe
    
    conn.commit()
    conn.close()

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

# ============= FUNCIONES DE GASTOS =============

def registrar_gasto(id_usuario, monto, categoria, descripcion='', origen='Telegram'):
    """Registra un nuevo gasto"""
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    
    # Obtener ID de la categoría (búsqueda case-insensitive)
    cursor.execute(
        'SELECT id FROM categorias WHERE LOWER(nombre) = LOWER(?)',
        (categoria,)
    )
    result = cursor.fetchone()
    
    if not result:
        # Fallback a la primera categoría disponible
        cursor.execute('SELECT id FROM categorias LIMIT 1')
        result = cursor.fetchone()
        if not result:
            conn.close()
            raise ValueError(f"No hay categorías en la base de datos")
    
    categoria_id = result[0]
    
    # Insertar gasto
    cursor.execute(
        '''INSERT INTO gastos 
           (id_usuario, monto, categoria_id, descripcion, fecha, cuenta, origen) 
           VALUES (?, ?, ?, ?, ?, ?, ?)''',
        (id_usuario, monto, categoria_id, descripcion, datetime.now(), '-', origen)
    )
    
    conn.commit()
    conn.close()
    logger.info(f"Gasto registrado: {id_usuario} - ${monto} en {categoria} [{origen}]")

def obtener_gastos_hoy(id_usuario):
    """Obtiene los gastos de hoy"""
    hoy = datetime.now().date()
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT g.monto, c.nombre, c.emoji, g.descripcion, g.fecha
        FROM gastos g
        JOIN categorias c ON g.categoria_id = c.id
        WHERE g.id_usuario = ? AND DATE(g.fecha) = ?
        ORDER BY g.fecha DESC
    ''', (id_usuario, hoy))
    
    gastos = cursor.fetchall()
    conn.close()
    return gastos

def obtener_gastos_mes(id_usuario):
    """Obtiene los gastos del mes actual"""
    ahora = datetime.now()
    primer_dia = ahora.replace(day=1)
    
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT g.monto, c.nombre, c.emoji, g.descripcion, g.fecha
        FROM gastos g
        JOIN categorias c ON g.categoria_id = c.id
        WHERE g.id_usuario = ? AND g.fecha >= ?
        ORDER BY g.fecha DESC
    ''', (id_usuario, primer_dia))
    
    gastos = cursor.fetchall()
    conn.close()
    return gastos

def obtener_gastos_rango(id_usuario, fecha_inicio, fecha_fin):
    """Obtiene gastos en un rango de fechas"""
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT g.monto, c.nombre, c.emoji, g.descripcion, g.fecha
        FROM gastos g
        JOIN categorias c ON g.categoria_id = c.id
        WHERE g.id_usuario = ? AND DATE(g.fecha) BETWEEN ? AND ?
        ORDER BY g.fecha DESC
    ''', (id_usuario, fecha_inicio, fecha_fin))
    
    gastos = cursor.fetchall()
    conn.close()
    return gastos

def obtener_total_gastos(gastos):
    """Calcula el total de gastos"""
    return sum(gasto[0] for gasto in gastos)

def obtener_gastos_por_categoria(id_usuario, fecha_inicio=None, fecha_fin=None):
    """Obtiene gastos agrupados por categoría"""
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    
    if fecha_inicio and fecha_fin:
        cursor.execute('''
            SELECT c.nombre, c.emoji, SUM(g.monto) as total, COUNT(*) as cantidad
            FROM gastos g
            JOIN categorias c ON g.categoria_id = c.id
            WHERE g.id_usuario = ? AND DATE(g.fecha) BETWEEN ? AND ?
            GROUP BY c.id
            ORDER BY total DESC
        ''', (id_usuario, fecha_inicio, fecha_fin))
    else:
        cursor.execute('''
            SELECT c.nombre, c.emoji, SUM(g.monto) as total, COUNT(*) as cantidad
            FROM gastos g
            JOIN categorias c ON g.categoria_id = c.id
            WHERE g.id_usuario = ?
            GROUP BY c.id
            ORDER BY total DESC
        ''', (id_usuario,))
    
    datos = cursor.fetchall()
    conn.close()
    return datos

# ============= FUNCIONES DE PRESUPUESTOS =============

def establecer_presupuesto(id_usuario, categoria, limite_mensual):
    """Establece un presupuesto para una categoría"""
    ahora = datetime.now()
    mes_ano = ahora.strftime('%Y-%m')
    
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    
    # Obtener ID de la categoría
    cursor.execute(
        'SELECT id FROM categorias WHERE nombre = ?',
        (categoria,)
    )
    result = cursor.fetchone()
    
    if not result:
        conn.close()
        raise ValueError(f"Categoría no encontrada: {categoria}")
    
    categoria_id = result[0]
    
    # Insertar o actualizar presupuesto
    cursor.execute('''
        INSERT OR REPLACE INTO presupuestos 
        (id_usuario, categoria_id, limite_mensual, mes_ano)
        VALUES (?, ?, ?, ?)
    ''', (id_usuario, categoria_id, limite_mensual, mes_ano))
    
    conn.commit()
    conn.close()
    logger.info(f"Presupuesto establecido: {id_usuario} - {categoria}: ${limite_mensual}")

def obtener_presupuestos(id_usuario):
    """Obtiene los presupuestos del usuario"""
    ahora = datetime.now()
    mes_ano = ahora.strftime('%Y-%m')
    
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT c.nombre, c.emoji, p.limite_mensual
        FROM presupuestos p
        JOIN categorias c ON p.categoria_id = c.id
        WHERE p.id_usuario = ? AND p.mes_ano = ?
        ORDER BY c.nombre
    ''', (id_usuario, mes_ano))
    
    presupuestos = cursor.fetchall()
    conn.close()
    return presupuestos

def obtener_gasto_categoria_mes(id_usuario, categoria):
    """Obtiene el gasto total en una categoría este mes"""
    ahora = datetime.now()
    primer_dia = ahora.replace(day=1)
    
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT SUM(g.monto)
        FROM gastos g
        JOIN categorias c ON g.categoria_id = c.id
        WHERE g.id_usuario = ? AND c.nombre = ? AND g.fecha >= ?
    ''', (id_usuario, categoria, primer_dia))
    
    result = cursor.fetchone()
    conn.close()
    
    return result[0] if result[0] else 0

# ============= FUNCIONES DE CATEGORÍAS =============

def obtener_categorias():
    """Obtiene todas las categorías"""
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    
    cursor.execute('SELECT nombre, emoji FROM categorias ORDER BY nombre')
    categorias = cursor.fetchall()
    conn.close()
    
    return categorias

# ============= INICIALIZACIÓN =============

if __name__ == '__main__':
    inicializar_bd()
    insertar_categorias_defecto()
    print("Base de datos lista!")
