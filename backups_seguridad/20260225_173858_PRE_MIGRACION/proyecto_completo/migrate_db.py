import sqlite3
import logging

DATABASE_FILE = 'gastos.db'

def migrate():
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    
    # Check for missing columns in 'gastos'
    cursor.execute('PRAGMA table_info(gastos)')
    columns = [info[1] for info in cursor.execute('PRAGMA table_info(gastos)').fetchall()]
    print(f"Current columns in gastos: {columns}")
    
    if 'cuenta' not in columns:
        print("Adding 'cuenta' column...")
        cursor.execute('ALTER TABLE gastos ADD COLUMN cuenta TEXT DEFAULT "-"')
    
    if 'origen' not in columns:
        print("Adding 'origen' column...")
        cursor.execute('ALTER TABLE gastos ADD COLUMN origen TEXT DEFAULT "N/A"')
        
    conn.commit()
    conn.close()
    print("Migration finished!")

if __name__ == '__main__':
    migrate()
