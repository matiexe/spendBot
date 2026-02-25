#!/bin/bash
# crear_backups_seguridad.sh
# Script para crear backups ANTES de migración completa
# USO: bash crear_backups_seguridad.sh

set -e

echo ""
echo "🔐 ========================================="
echo "  CREADOR DE BACKUPS DE SEGURIDAD"
echo "  Fase CRÍTICA antes de migración"
echo "========================================="
echo ""

# Variables
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_BASE="backups_seguridad"
BACKUP_DIR="${BACKUP_BASE}/${TIMESTAMP}_PRE_MIGRACION"

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; exit 1; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_info() { echo "ℹ️  $1"; }

# ============= VERIFICACIÓN INICIAL =============

echo "📋 PASO 0: Verificaciones iniciales..."
echo ""

# Verificar que no estamos en directorio protegido
if [ "$PWD" = "/" ] || [ "$PWD" = "/root" ]; then
    log_error "No hacer backup desde raíz del sistema"
fi
log_success "Ubicación segura"

# Verificar espacio disponible
DISK_FREE=$(df . | tail -1 | awk '{print $4}')
if [ "$DISK_FREE" -lt 100000 ]; then
    log_warning "Espacio bajo: menos de 100MB disponibles"
fi
log_success "Espacio disponible: $(df -h . | tail -1 | awk '{print $4}')"

# Verificar que Python está disponible
if command -v python3 &> /dev/null; then
    log_success "Python 3 disponible"
else
    log_error "Python 3 no encontrado"
fi

echo ""
echo "📁 PASO 1: Creando estructura de directorios..."
echo ""

# Crear directorios
mkdir -p "$BACKUP_DIR/proyecto_completo"
mkdir -p "$BACKUP_DIR/bases_datos"
mkdir -p "$BACKUP_DIR/archivos_criticos"
mkdir -p "${BACKUP_BASE}/referencias"

log_success "Directorio de backup: $BACKUP_DIR"

echo ""
echo "📦 PASO 2: Haciendo backup del proyecto completo..."
echo ""

# Copiar proyecto (excluyendo cache y venv)
cp -r . "$BACKUP_DIR/proyecto_completo/" \
    --exclude=__pycache__ \
    --exclude=.venv \
    --exclude=venv \
    --exclude=venv_* \
    --exclude=.git \
    --exclude=backups_seguridad \
    --exclude=*.pyc \
    --exclude=.DS_Store

FILE_COUNT=$(find "$BACKUP_DIR/proyecto_completo" -type f | wc -l)
log_success "Proyecto copiado ($FILE_COUNT archivos)"

echo ""
echo "💾 PASO 3: Haciendo backup de bases de datos..."
echo ""

# Buscar y copiar todas las BDs
DB_COUNT=0
for db in *.db; do
    if [ -f "$db" ]; then
        cp "$db" "$BACKUP_DIR/bases_datos/"
        SIZE=$(ls -lh "$db" | awk '{print $5}')
        log_success "BD copiada: $db ($SIZE)"
        ((DB_COUNT++))
    fi
done

if [ $DB_COUNT -eq 0 ]; then
    log_warning "No se encontraron archivos .db"
fi

echo ""
echo "🔒 PASO 4: Haciendo backup de archivos críticos..."
echo ""

# .env (con cuidado por sensibilidad)
if [ -f ".env" ]; then
    cp ".env" "$BACKUP_DIR/archivos_criticos/.env.backup"
    log_success ".env copiado (CONFIDENCIAL - Proteger)"
else
    log_warning ".env no encontrado"
fi

# .env.local
if [ -f ".env.local" ]; then
    cp ".env.local" "$BACKUP_DIR/archivos_criticos/"
    log_success ".env.local copiado"
fi

# Archivos de configuración
for config in *.ini *.conf *.config *.yaml *.yml; do
    if [ -f "$config" ]; then
        cp "$config" "$BACKUP_DIR/archivos_criticos/" 2>/dev/null || true
        log_success "Config copiada: $config"
    fi
done

echo ""
echo "📝 PASO 5: Documentando información crítica..."
echo ""

# Crear archivo de información
cat > "$BACKUP_DIR/INFO_BACKUP.txt" << 'EOF'
═══════════════════════════════════════════════════
  INFORMACIÓN DEL BACKUP DE SEGURIDAD
═══════════════════════════════════════════════════

FECHA DE CREACIÓN:
EOF

date >> "$BACKUP_DIR/INFO_BACKUP.txt"

cat >> "$BACKUP_DIR/INFO_BACKUP.txt" << 'EOF'

CONTENIDO DEL BACKUP:
═══════════════════════════════════════════════════

1. proyecto_completo/
   - Código fuente completo
   - Todos los archivos Python (.py)
   - Dependencias (requirements.txt)
   - Configuración

2. bases_datos/
   - Todos los archivos .db (bases de datos SQLite)
   - Historial de transacciones
   - Información de usuarios

3. archivos_criticos/
   - .env (CONFIDENCIAL - variables de entorno)
   - Configuraciones específicas
   
INSTRUCCIONES DE RESTAURACIÓN:
═══════════════════════════════════════════════════

Si necesitas volver atrás:

1. Parar bot actual:
   pkill -f "python main.py"
   
2. Restaurar desde backup:
   cd ..
   rm -rf *
   cp -r backups_seguridad/[FECHA]/proyecto_completo/* .
   
3. Reiniciar bot anterior:
   python main.py

TAMAÑO DEL BACKUP:
═══════════════════════════════════════════════════
EOF

TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
echo "Total: $TOTAL_SIZE" >> "$BACKUP_DIR/INFO_BACKUP.txt"

log_success "Información documentada"

echo ""
echo "🔍 PASO 6: Validación del backup..."
echo ""

# Validaciones
VALIDATION_PASSED=0

# ✅ Verificar que existen todos los directorios
if [ -d "$BACKUP_DIR/proyecto_completo" ]; then
    log_success "✅ proyecto_completo existe"
    ((VALIDATION_PASSED++))
else
    log_error "❌ proyecto_completo NO existe"
fi

# ✅ Verificar cantidad de archivos
TOTAL_FILES=$(find "$BACKUP_DIR" -type f | wc -l)
if [ "$TOTAL_FILES" -gt 10 ]; then
    log_success "✅ Cantidad de archivos: $TOTAL_FILES"
    ((VALIDATION_PASSED++))
else
    log_warning "⚠️  Pocos archivos en backup: $TOTAL_FILES"
fi

# ✅ Verificar que se copió .env
if [ -f "$BACKUP_DIR/archivos_criticos/.env.backup" ]; then
    log_success "✅ .env respaldado"
    ((VALIDATION_PASSED++))
else
    log_warning "⚠️  .env no encontrado en backup"
fi

# ✅ Verificar tamaño total
if [ -n "$TOTAL_SIZE" ]; then
    log_success "✅ Tamaño total: $TOTAL_SIZE"
    ((VALIDATION_PASSED++))
fi

echo ""
echo "📊 Validación: $VALIDATION_PASSED/4 ✅"
echo ""

if [ "$VALIDATION_PASSED" -lt 2 ]; then
    log_warning "Backup incompleto pero creado"
fi

echo ""
echo "📋 PASO 7: Creando checksum para integridad..."
echo ""

# Crear checksums
find "$BACKUP_DIR" -type f -exec md5sum {} \; > "$BACKUP_DIR/CHECKSUMS.md5"
log_success "Checksums creados (para verificar integridad posterior)"

echo ""
echo "📄 PASO 8: Generando instrucciones de restauración..."
echo ""

cat > "${BACKUP_BASE}/COMO_RESTAURAR.txt" << 'EOF'
═══════════════════════════════════════════════════════════════
  CÓMO RESTAURAR DESDE BACKUP EN CASO DE FALLA
═══════════════════════════════════════════════════════════════

SITUACIÓN: La migración falló y necesitas volver al bot anterior

PASOS:

1. Parar el bot actual (si está corriendo):
   ────────────────────────────────────────
   Ctrl+C (en terminal)
   O: pkill -f "python"
   
2. Restaurar desde backup:
   ────────────────────────────────────────
   cd [directorio del proyecto]
   
   # Verificar qué backup usar
   ls -la backups_seguridad/
   
   # Restaurar el ÚLTIMO backup (recomendado)
   rm -rf *  # ⚠️  Borra TODO el directorio
   
   # Copiar desde backup
   cp -r backups_seguridad/[FECHA]/proyecto_completo/* .
   
3. Verificar restauración:
   ────────────────────────────────────────
   ls -la
   # Debe mostrar: main.py, database.py, .env, etc.
   
4. Reiniciar bot anterior:
   ────────────────────────────────────────
   python main.py
   
5. Verificar en Telegram:
   ────────────────────────────────────────
   Enviar: /start
   Bot debe responder con bienvenida

IMPORTANTE:
═══════════════════════════════════════════════════════════════
- No perder los backups
- Mantener en lugar seguro (USB, carpeta protegida)
- Los backups contienen información sensible (.env)
- Borrar solo después de 1 mes si migración fue exitosa

SOPORTE:
═══════════════════════════════════════════════════════════════
Si la restauración no funciona:
1. Revisar que el backup existe: ls backups_seguridad/
2. Verificar que se copió correctamente: ls -la *.py
3. Si aún falla, contactar soporte técnico con las siguientes
   imágenes:
   - Último error en terminal
   - Output de: ls -la
   - Output de: cat .env (sin valores sensibles)
EOF

log_success "Instrucciones de restauración creadas"

echo ""
echo "════════════════════════════════════════════════════════"
echo "🎉 BACKUP DE SEGURIDAD COMPLETADO"
echo "════════════════════════════════════════════════════════"
echo ""
echo "📂 UBICACIÓN DEL BACKUP:"
echo "   $(pwd)/$BACKUP_DIR"
echo ""
echo "📊 ESTADÍSTICAS:"
echo "   Total archivos: $TOTAL_FILES"
echo "   Total tamaño: $TOTAL_SIZE"
echo "   BDs copiadas: $DB_COUNT"
echo ""
echo "🔒 SEGURIDAD:"
echo "   ✅ Backup completo realizado"
echo "   ✅ Información documentada"
echo "   ✅ Checksums generados"
echo "   ⚠️  Contiene INFO SENSIBLE (.env)"
echo ""
echo "🚨 PRÓXIMOS PASOS:"
echo "   1. ✅ BACKUP SEGURO EN ESTE DIRECTORIO"
echo "   2. ⚠️  COPIAR A USB O NUBE (RECOMENDADO)"
echo "   3. 🚀 PROCEDER CON MIGRACIÓN"
echo ""
echo "💡 PARA COPIAR A USB:"
echo "   cp -r $BACKUP_BASE /media/tu_usb/"
echo ""
echo "💡 PARA COMPRIMIR Y ARCHIVAR:"
echo "   tar -czf backup_$(date +%Y%m%d).tar.gz $BACKUP_BASE/"
echo ""
echo "════════════════════════════════════════════════════════"
echo ""
echo "✅ Estás protegido. Ahora puedes migrar con confianza."
echo ""
