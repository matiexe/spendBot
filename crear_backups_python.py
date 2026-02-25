import os
import shutil
import datetime
import hashlib
from pathlib import Path

def get_dir_size(path='.'):
    total_size = 0
    for dirpath, dirnames, filenames in os.walk(path):
        for f in filenames:
            fp = os.path.join(dirpath, f)
            # skip if it is symbolic link
            if not os.path.islink(fp):
                total_size += os.path.getsize(fp)
    return total_size

def format_bytes(size):
    # 2**10 = 1024
    power = 2**10
    n = 0
    power_labels = {0 : '', 1: 'K', 2: 'M', 3: 'G', 4: 'T'}
    while size > power:
        size /= power
        n += 1
    return f"{size:.2f} {power_labels[n]}B"

def create_backup():
    print("\n🔐 =========================================")
    print("  CREADOR DE BACKUPS DE SEGURIDAD (Python version)")
    print("  Fase CRÍTICA antes de migración")
    print("=========================================\n")

    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_base = Path("backups_seguridad")
    backup_dir = backup_base / f"{timestamp}_PRE_MIGRACION"
    
    proyecto_dir = backup_dir / "proyecto_completo"
    db_dir = backup_dir / "bases_datos"
    criticos_dir = backup_dir / "archivos_criticos"

    # Paso 1: Crear estructura
    print(f"📁 PASO 1: Creando estructura de directorios en {backup_dir}...")
    proyecto_dir.mkdir(parents=True, exist_ok=True)
    db_dir.mkdir(parents=True, exist_ok=True)
    criticos_dir.mkdir(parents=True, exist_ok=True)
    (backup_base / "referencias").mkdir(parents=True, exist_ok=True)

    # Paso 2: Backup del proyecto
    print("\n📦 PASO 2: Haciendo backup del proyecto completo...")
    ignore_patterns = shutil.ignore_patterns(
        '__pycache__', '.venv', 'venv', 'venv_*', '.git', 
        'backups_seguridad', '*.pyc', '.DS_Store', 'node_modules', '.next'
    )
    
    # shutil.copytree requires the destination to NOT exist if we want to copy into it,
    # or we can use a loop. Let's use a loop to be more precise.
    root_src = Path(".")
    file_count = 0
    for item in root_src.iterdir():
        if item.name in ['backups_seguridad', '__pycache__', '.venv', 'venv', '.git', 'node_modules', '.next']:
            continue
        
        dest = proyecto_dir / item.name
        if item.is_dir():
            shutil.copytree(item, dest, ignore=ignore_patterns, dirs_exist_ok=True)
        else:
            shutil.copy2(item, dest)
            file_count += 1

    # Count all files in proyecto_completo
    total_files = sum([len(files) for r, d, files in os.walk(proyecto_dir)])
    print(f"✅ Proyecto copiado ({total_files} archivos)")

    # Paso 3: Backup de bases de datos
    print("\n💾 PASO 3: Haciendo backup de bases de datos...")
    db_count = 0
    for db_file in root_src.glob("*.db"):
        shutil.copy2(db_file, db_dir)
        size = format_bytes(db_file.stat().st_size)
        print(f"✅ BD copiada: {db_file.name} ({size})")
        db_count += 1
    
    if db_count == 0:
        print("⚠️  No se encontraron archivos .db")

    # Paso 4: Archivos críticos
    print("\n🔒 PASO 4: Haciendo backup de archivos críticos...")
    env_file = root_src / ".env"
    if env_file.exists():
        shutil.copy2(env_file, criticos_dir / ".env.backup")
        print("✅ .env copiado")
    else:
        print("⚠️  .env no encontrado")

    for pattern in ["*.ini", "*.conf", "*.config", "*.yaml", "*.yml"]:
        for cfg in root_src.glob(pattern):
            shutil.copy2(cfg, criticos_dir)
            print(f"✅ Config copiada: {cfg.name}")

    # Paso 5: Documentación
    print("\n📝 PASO 5: Documentando información crítica...")
    info_path = backup_dir / "INFO_BACKUP.txt"
    total_size = format_bytes(get_dir_size(backup_dir))
    
    with open(info_path, "w", encoding="utf-8") as f:
        f.write("═══════════════════════════════════════════════════\n")
        f.write("  INFORMACIÓN DEL BACKUP DE SEGURIDAD\n")
        f.write("═══════════════════════════════════════════════════\n\n")
        f.write(f"FECHA DE CREACIÓN: {datetime.datetime.now()}\n\n")
        f.write("CONTENIDO DEL BACKUP:\n")
        f.write("═══════════════════════════════════════════════════\n\n")
        f.write("1. proyecto_completo/\n   - Código fuente completo\n")
        f.write("2. bases_datos/\n   - Todos los archivos .db\n")
        f.write("3. archivos_criticos/\n   - .env (CONFIDENCIAL)\n\n")
        f.write(f"TAMAÑO DEL BACKUP: {total_size}\n")
        f.write(f"CANTIDAD DE ARCHIVOS: {total_files}\n")

    print("✅ Información documentada")

    # Paso 6: Integridad (MD5)
    print("\n📋 PASO 6: Creando checksum para integridad...")
    with open(backup_dir / "CHECKSUMS.md5", "w", encoding="utf-8") as checksum_file:
        for r, d, files in os.walk(backup_dir):
            for file in files:
                if file == "CHECKSUMS.md5": continue
                full_path = Path(r) / file
                with open(full_path, "rb") as f:
                    md5 = hashlib.md5(f.read()).hexdigest()
                    checksum_file.write(f"{md5}  {full_path.relative_to(backup_dir)}\n")
    print("✅ Checksums creados")

    print("\n🎉 BACKUP DE SEGURIDAD COMPLETADO")
    print(f"📂 UBICACIÓN: {backup_dir.absolute()}")
    print(f"📊 Tamaño: {total_size}")
    print("\n✅ Estás protegido. Ahora puedes migrar con confianza.\n")

if __name__ == "__main__":
    create_backup()
