import sqlite3
import os
from pathlib import Path

# Paths
DB_FILE = 'gastos.db'

def migrate():
    if not os.path.exists(DB_FILE):
        print(f"Buscando {DB_FILE}...")
        return

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    # 1. Backup de tablas viejas si existen y no se han renombrado antes
    print("Renombrando tablas viejas...")
    try:
        cursor.execute("ALTER TABLE gastos RENAME TO gastos_v1;")
        print("✅ Tabla 'gastos' renombrada a 'gastos_v1'")
    except sqlite3.OperationalError as e:
        print(f"⚠️  No se pudo renombrar 'gastos': {e}")

    try:
        cursor.execute("ALTER TABLE categorias RENAME TO categorias_v1;")
        print("✅ Tabla 'categorias' renombrada a 'categorias_v1'")
    except sqlite3.OperationalError as e:
        print(f"⚠️  No se pudo renombrar 'categorias': {e}")

    conn.commit()
    conn.close()

    # 2. Inicializar base de datos mejorada
    print("\nInicializando base de datos mejorada...")
    # Importar desde el archivo de optimización que ya modifiqué
    import sys
    sys.path.append(os.path.join(os.getcwd(), 'optimizacion'))
    from database_mejorada import inicializar_bd, insertar_categorias_defecto, obtener_categorias
    
    inicializar_bd()
    insertar_categorias_defecto()
    print("✅ Tablas nuevas creadas y categorías insertadas")

    # 3. Migrar datos
    print("\nMigrando datos...")
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    # Obtener mapeo de categorías nuevas (nombre -> id)
    cursor.execute("SELECT id, nombre, tipo FROM categorias;")
    nuevas_cats = cursor.fetchall()
    cat_map = {} # (nombre, tipo) -> id
    for cid, nombre, tipo in nuevas_cats:
        cat_map[(nombre.lower(), tipo)] = cid

    # Mapeo de IDs viejos a nombres (basado en lo que vimos en check_db.py)
    # 1: 'Comida', 2: 'Transporte', 3: 'Diversión', 4: 'Educación', 5: 'Salud', 6: 'Hogar', 7: 'Otros'
    old_cat_names = {
        1: 'Comida',
        2: 'Transporte',
        3: 'Diversión',
        4: 'Educación',
        5: 'Salud',
        6: 'Hogar',
        7: 'Otros'
    }

    # Leer gastos viejos
    try:
        cursor.execute("SELECT id_usuario, monto, categoria_id, descripcion, fecha, cuenta, origen FROM gastos_v1;")
        viejos_gastos = cursor.fetchall()
        
        migrated_count = 0
        for id_usuario, monto, cat_id, desc, fecha, cuenta, origen in viejos_gastos:
            tipo = 'GASTO' if monto < 0 else 'INGRESO'
            abs_monto = abs(monto)
            cat_nombre = old_cat_names.get(cat_id, 'Otros')
            
            # Buscar ID de categoría nueva
            new_cat_id = cat_map.get((cat_nombre.lower(), tipo))
            if not new_cat_id:
                # Fallback a 'Otros' del tipo correspondiente
                new_cat_id = cat_map.get(('otros', tipo))

            cursor.execute("""
                INSERT INTO gastos (id_usuario, tipo, monto, categoria_id, descripcion, fecha, cuenta, origen)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (id_usuario, tipo, abs_monto, new_cat_id, desc, fecha, cuenta, origen))
            migrated_count += 1
            
        conn.commit()
        print(f"✅ Se migraron {migrated_count} registros de 'gastos_v1' a 'gastos'")
    except sqlite3.OperationalError as e:
        print(f"❌ Error migrando datos: {e}")

    conn.close()

if __name__ == "__main__":
    migrate()
