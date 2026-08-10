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
    
    # Tabla de usuarios con campos para Registro Web + Telegram
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS usuarios (
            id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT,
            username TEXT,
            email TEXT UNIQUE,
            password_hash TEXT,
            telegram_id INTEGER UNIQUE,
            token_vinculacion TEXT UNIQUE,
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Migración defensiva si la tabla existía con el esquema antiguo (sin UNIQUE en ADD COLUMN)
    cursor.execute("PRAGMA table_info(usuarios)")
    columnas = [column[1] for column in cursor.fetchall()]
    if 'email' not in columnas:
        cursor.execute("ALTER TABLE usuarios ADD COLUMN email TEXT")
    if 'password_hash' not in columnas:
        cursor.execute("ALTER TABLE usuarios ADD COLUMN password_hash TEXT")
    if 'telegram_id' not in columnas:
        cursor.execute("ALTER TABLE usuarios ADD COLUMN telegram_id INTEGER")
    if 'token_vinculacion' not in columnas:
        cursor.execute("ALTER TABLE usuarios ADD COLUMN token_vinculacion TEXT")
    
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
            tipo TEXT DEFAULT 'GASTO',
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

    # Migración defensiva para agregar la columna 'tipo' si no existía en bases creadas anteriormente
    cursor.execute("PRAGMA table_info(gastos)")
    cols_gastos = [c[1] for c in cursor.fetchall()]
    if 'tipo' not in cols_gastos:
        cursor.execute("ALTER TABLE gastos ADD COLUMN tipo TEXT DEFAULT 'GASTO'")
    
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
    
    # Tabla de transacciones recurrentes
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS transacciones_recurrentes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            id_usuario INTEGER NOT NULL,
            tipo TEXT NOT NULL DEFAULT 'GASTO',
            monto REAL NOT NULL,
            categoria_id INTEGER NOT NULL,
            descripcion TEXT,
            dia_cobro INTEGER NOT NULL DEFAULT 1,
            duracion_meses INTEGER DEFAULT NULL,
            meses_procesados INTEGER DEFAULT 0,
            fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ultima_ejecucion TEXT DEFAULT NULL,
            activo INTEGER DEFAULT 1,
            cuenta TEXT DEFAULT '-',
            origen TEXT DEFAULT 'Recurrente',
            FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
            FOREIGN KEY (categoria_id) REFERENCES categorias(id)
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

# ============= FUNCIONES DE USUARIOS Y AUTENTICACIÓN =============

def registrar_usuario_web(nombre, email, password_hash):
    """Registra un usuario desde la web y genera un token único VIN-XXXX para Telegram"""
    import secrets
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    token = f"VIN-{secrets.token_hex(3).upper()}"
    try:
        cursor.execute(
            '''INSERT INTO usuarios (nombre, email, password_hash, token_vinculacion)
               VALUES (?, ?, ?, ?)''',
            (nombre, email, password_hash, token)
        )
        conn.commit()
        user_id = cursor.lastrowid
        conn.close()
        return {'id_usuario': user_id, 'nombre': nombre, 'email': email, 'token_vinculacion': token}
    except sqlite3.IntegrityError:
        conn.close()
        return None

def vincular_telegram(telegram_id, username, token_vinculacion):
    """Vincula un usuario de Telegram a su cuenta de Web utilizando el token VIN-XXXX"""
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    cursor.execute('SELECT id_usuario, nombre FROM usuarios WHERE token_vinculacion = ?', (token_vinculacion.strip(),))
    user = cursor.fetchone()
    if user:
        cursor.execute(
            '''UPDATE usuarios 
               SET telegram_id = ?, username = ?, token_vinculacion = NULL 
               WHERE id_usuario = ?''',
            (telegram_id, username, user[0])
        )
        conn.commit()
        conn.close()
        return {'id_usuario': user[0], 'nombre': user[1]}
    conn.close()
    return None

def obtener_usuario_por_email(email):
    """Obtiene usuario por email"""
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    cursor.execute('SELECT id_usuario, nombre, email, password_hash, telegram_id, token_vinculacion FROM usuarios WHERE email = ?', (email.strip().lower(),))
    row = cursor.fetchone()
    conn.close()
    if row:
        return {
            'id_usuario': row[0],
            'nombre': row[1],
            'email': row[2],
            'password_hash': row[3],
            'telegram_id': row[4],
            'token_vinculacion': row[5]
        }
    return None

def obtener_o_crear_usuario(id_usuario, nombre, username):
    """Obtiene o crea un usuario desde el Telegram bot"""
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    
    cursor.execute('SELECT id_usuario, nombre FROM usuarios WHERE telegram_id = ? OR id_usuario = ?', (id_usuario, id_usuario))
    usuario = cursor.fetchone()
    
    if not usuario:
        cursor.execute(
            'INSERT INTO usuarios (nombre, username, telegram_id) VALUES (?, ?, ?)',
            (nombre, username, id_usuario)
        )
        conn.commit()
        user_id = cursor.lastrowid
    else:
        user_id = usuario[0]
        
    conn.close()
    return user_id

# ============= FUNCIONES DE GASTOS =============

def registrar_gasto(id_usuario, monto, categoria, descripcion='', origen='Telegram', tipo=None):
    """Registra un nuevo gasto/ingreso"""
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    
    # Derivar tipo si no se pasa explícitamente (compatibilidad con código viejo)
    if tipo is None:
        tipo = 'GASTO' if monto <= 0 else 'INGRESO'
    tipo = tipo.upper()
    
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
            raise ValueError("No hay categorías en la base de datos")
    
    categoria_id = result[0]
    
    # Insertar gasto con tipo incluido
    cursor.execute(
        '''INSERT INTO gastos 
           (id_usuario, tipo, monto, categoria_id, descripcion, fecha, cuenta, origen) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
        (id_usuario, tipo, abs(monto), categoria_id, descripcion, datetime.now(), '-', origen)
    )
    
    conn.commit()
    conn.close()
    logger.info(f"Transacción registrada: {id_usuario} - {tipo} ${abs(monto):.2f} en {categoria} [{origen}]")

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

# ============= FUNCIONES DE TRANSACCIONES RECURRENTES =============

def registrar_transaccion_recurrente(id_usuario, tipo, monto, categoria, descripcion='', dia_cobro=1, duracion_meses=None, cuenta='-', origen='Recurrente'):
    """Registra una transacción recurrente mensual"""
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    
    tipo = tipo.upper()
    
    # Obtener ID de categoría
    cursor.execute('SELECT id FROM categorias WHERE LOWER(nombre) = LOWER(?)', (categoria,))
    res = cursor.fetchone()
    if not res:
        cursor.execute('SELECT id FROM categorias LIMIT 1')
        res = cursor.fetchone()
        if not res:
            conn.close()
            raise ValueError("No hay categorías en la base de datos")
    categoria_id = res[0]
    
    cursor.execute('''
        INSERT INTO transacciones_recurrentes 
        (id_usuario, tipo, monto, categoria_id, descripcion, dia_cobro, duracion_meses, cuenta, origen)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (id_usuario, tipo, abs(monto), categoria_id, descripcion, dia_cobro, duracion_meses, cuenta, origen))
    
    conn.commit()
    conn.close()
    logger.info(f"Transacción recurrente creada: {id_usuario} - {tipo} ${abs(monto)} cada día {dia_cobro}")

def obtener_transacciones_recurrentes(id_usuario=None, solo_activas=False):
    """Obtiene las transacciones recurrentes registradas"""
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    
    sql = '''
        SELECT r.id, r.id_usuario, r.tipo, r.monto, r.categoria_id, r.descripcion, 
               r.dia_cobro, r.duracion_meses, r.meses_procesados, r.fecha_inicio, 
               r.ultima_ejecucion, r.activo, r.cuenta, r.origen,
               c.nombre as categoriaNombre, c.emoji as categoriaEmoji
        FROM transacciones_recurrentes r
        JOIN categorias c ON r.categoria_id = c.id
    '''
    conds = []
    params = []
    
    if id_usuario is not None:
        conds.append('r.id_usuario = ?')
        params.append(id_usuario)
    if solo_activas:
        conds.append('r.activo = 1')
        
    if conds:
        sql += ' WHERE ' + ' AND '.join(conds)
        
    sql += ' ORDER BY r.activo DESC, r.id DESC'
    
    cursor.execute(sql, params)
    rows = cursor.fetchall()
    conn.close()
    return rows

def alternar_estado_recurrente(id_recurrente):
    """Alterna el estado activo (1/0) de una transacción recurrente"""
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    
    cursor.execute('UPDATE transacciones_recurrentes SET activo = CASE WHEN activo = 1 THEN 0 ELSE 1 END WHERE id = ?', (id_recurrente,))
    conn.commit()
    conn.close()

def eliminar_transaccion_recurrente(id_recurrente):
    """Elimina una transacción recurrente"""
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM transacciones_recurrentes WHERE id = ?', (id_recurrente,))
    conn.commit()
    conn.close()

def procesar_transacciones_recurrentes_pendientes():
    """
    Verifica y genera automáticamente las transacciones del mes actual para todas
    las transacciones recurrentes activas que le correspondan por fecha.
    """
    ahora = datetime.now()
    mes_actual_str = ahora.strftime('%Y-%m') # ej: '2026-08'
    dia_actual = ahora.day
    
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT r.id, r.id_usuario, r.tipo, r.monto, r.categoria_id, r.descripcion, 
               r.dia_cobro, r.duracion_meses, r.meses_procesados, r.ultima_ejecucion, r.cuenta, r.origen
        FROM transacciones_recurrentes r
        WHERE r.activo = 1
    ''')
    
    recurrentes = cursor.fetchall()
    procesadas_count = 0
    
    for rec in recurrentes:
        (rec_id, id_usuario, tipo, monto, categoria_id, descripcion, 
         dia_cobro, duracion_meses, meses_procesados, ultima_ejecucion, cuenta, origen) = rec
        
        # Verificar si ya se procesó este mes
        if ultima_ejecucion == mes_actual_str:
            continue
            
        # Verificar si ya llegamos al día de cobro o si el mes avanzó
        if dia_actual >= dia_cobro:
            nuevo_meses_proc = meses_procesados + 1
            desc_final = f"{descripcion} (Recurrente {nuevo_meses_proc}/{duracion_meses if duracion_meses else '∞'})"
            
            # Registrar en la tabla 'gastos'
            cursor.execute('''
                INSERT INTO gastos 
                (id_usuario, tipo, monto, categoria_id, descripcion, fecha, cuenta, origen)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (id_usuario, tipo, monto, categoria_id, desc_final, ahora, cuenta, origen))
            
            # Verificar si llegó al límite de duración
            se_desactiva = 0
            if duracion_meses is not None and nuevo_meses_proc >= duracion_meses:
                se_desactiva = 1
                
            cursor.execute('''
                UPDATE transacciones_recurrentes 
                SET ultima_ejecucion = ?, meses_procesados = ?, activo = CASE WHEN ? = 1 THEN 0 ELSE activo END
                WHERE id = ?
            ''', (mes_actual_str, nuevo_meses_proc, se_desactiva, rec_id))
            
            procesadas_count += 1
            logger.info(f"Transacción recurrente #{rec_id} procesada para {mes_actual_str}: {desc_final}")
            
    conn.commit()
    conn.close()
    return procesadas_count

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
