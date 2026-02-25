import sqlite3

def check_schema():
    conn = sqlite3.connect('gastos.db')
    cursor = conn.cursor()
    cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='gastos';")
    result = cursor.fetchone()
    if result:
        print(f"Schema for 'gastos':\n{result[0]}")
    else:
        print("Table 'gastos' not found.")
    
    cursor.execute("SELECT * FROM categorias;")
    cats = cursor.fetchall()
    print("\nExisting categories:")
    for cat in cats:
        print(cat)
    
    conn.close()

if __name__ == "__main__":
    check_schema()
