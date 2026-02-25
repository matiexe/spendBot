# 🔴 MIGRACIÓN COMPLETA SIN BACKUPS PREVIOS
## PROTOCOLO ESPECIAL DE SEGURIDAD

---

## ⚠️ SITUACIÓN CRÍTICA

```
❌ Sin backups previos
✅ Bot Python funcionando actualmente
🎯 Quiere: Migración completa (reemplazar TODO)
⚡ Riesgo: ALTO

SOLUCIÓN: 3 fases de seguridad ANTES de cualquier cambio
```

---

## 🚨 ORDEN DE PRIORIDADES

1. **CREAR BACKUPS INMEDIATAMENTE** ← ESTO PRIMERO
2. **NO tocar nada** hasta que backups estén listos
3. **Después ENTONCES** hacer migración
4. **Validar** que todo funciona
5. **Archivar** backups en lugar seguro

---

## FASE 1: CREAR BACKUPS DE SEGURIDAD
### ⏱️ Tiempo: 10 minutos (MUY IMPORTANTE)

### PASO 1a: Backup completo del proyecto

```bash
# 1. Crear directorio de backups
mkdir -p backups_seguridad
mkdir -p backups_seguridad/$(date +%Y%m%d_%H%M%S)_PRE_MIGRACION

# 2. Backup de TODO el proyecto
cp -r . backups_seguridad/$(date +%Y%m%d_%H%M%S)_PRE_MIGRACION/proyecto_completo/

echo "✅ Backup completo del proyecto creado"

# 3. Verificar que se copió
ls -la backups_seguridad/*/proyecto_completo/ | head -5
# Debe mostrar: main.py, database.py, config.py, etc.
```

### PASO 1b: Backup de la BD (CRÍTICA)

```bash
# 1. Listar todas las BDs
ls -la *.db 2>/dev/null || echo "Buscando BDs..."

# 2. Copiar TODAS las BDs
for db in *.db; do
    if [ -f "$db" ]; then
        cp "$db" "backups_seguridad/$(date +%Y%m%d_%H%M%S)_PRE_MIGRACION/"
        echo "✅ Backup de $db creado"
    fi
done

# 3. Verificar tamaño
du -sh backups_seguridad/*/
```

### PASO 1c: Backup de archivos críticos

```bash
# Crear carpeta especial
mkdir -p backups_seguridad/archivos_criticos_$(date +%Y%m%d)

# Copiar archivos críticos
cp .env backups_seguridad/archivos_criticos_$(date +%Y%m%d)/.env.backup 2>/dev/null || echo "⚠️ .env no encontrado"
cp .env.local backups_seguridad/archivos_criticos_$(date +%Y%m%d)/ 2>/dev/null || true
cp -r . backups_seguridad/archivos_criticos_$(date +%Y%m%d)/codigo_fuente/ 2>/dev/null

echo "✅ Archivos críticos respaldados"
```

### PASO 1d: Backup de configuraciones

```bash
# Extraer info del .env (SIN contraseñas)
echo "=== CONFIGURACIÓN ACTUAL ===" > backups_seguridad/INFO_IMPORTANTE.txt
echo "Fecha backup: $(date)" >> backups_seguridad/INFO_IMPORTANTE.txt
echo "" >> backups_seguridad/INFO_IMPORTANTE.txt

# Guardar estructura del proyecto
echo "ESTRUCTURA DEL PROYECTO:" >> backups_seguridad/INFO_IMPORTANTE.txt
find . -type f -name "*.py" | head -20 >> backups_seguridad/INFO_IMPORTANTE.txt

# Información de la BD
echo "" >> backups_seguridad/INFO_IMPORTANTE.txt
echo "BASES DE DATOS ENCONTRADAS:" >> backups_seguridad/INFO_IMPORTANTE.txt
ls -la *.db 2>/dev/null >> backups_seguridad/INFO_IMPORTANTE.txt || echo "Sin BDs encontradas" >> backups_seguridad/INFO_IMPORTANTE.txt

# Variables de entorno (sin valores sensibles)
echo "" >> backups_seguridad/INFO_IMPORTANTE.txt
echo "VARIABLES DE ENTORNO:" >> backups_seguridad/INFO_IMPORTANTE.txt
cat .env | grep -v "=.*[A-Za-z0-9]" 2>/dev/null || echo "Editar manualmente en .env" >> backups_seguridad/INFO_IMPORTANTE.txt

cat backups_seguridad/INFO_IMPORTANTE.txt
```

### PASO 1e: VERIFICACIÓN FINAL DE BACKUP

```bash
# Checklist de backup
echo ""
echo "=== VERIFICACIÓN DE BACKUPS ==="
echo ""

# ✅ Verificar que existen todos los tipos de backup
if [ -d "backups_seguridad" ]; then
    echo "✅ Directorio backups_seguridad EXISTE"
else
    echo "❌ ERROR: No existe directorio backups_seguridad"
    exit 1
fi

# ✅ Contar archivos en backup
BACKUP_COUNT=$(find backups_seguridad -type f | wc -l)
echo "✅ Total archivos en backup: $BACKUP_COUNT"

if [ "$BACKUP_COUNT" -lt 10 ]; then
    echo "❌ ERROR: Muy pocos archivos en backup (mínimo 10)"
    exit 1
fi

# ✅ Verificar que está la BD
if find backups_seguridad -name "*.db" | grep -q .; then
    echo "✅ Backups de BD encontrados:"
    find backups_seguridad -name "*.db" -exec ls -lh {} \;
else
    echo "⚠️  ADVERTENCIA: No se encontraron archivos .db en backup"
fi

# ✅ Verificar tamaño total
TOTAL_SIZE=$(du -sh backups_seguridad | cut -f1)
echo "✅ Tamaño total de backups: $TOTAL_SIZE"

echo ""
echo "=== BACKUP COMPLETADO EXITOSAMENTE ==="
echo "📂 Ubicación: $(pwd)/backups_seguridad/"
echo ""
```

---

## FASE 2: CREAR COPIA SEGURA EXTERNA
### ⏱️ Tiempo: 5 minutos

### PASO 2a: Copiar backups a ubicación externa

```bash
# Opción 1: Copiar a USB (Linux/Mac)
if [ -d "/media" ] || [ -d "/Volumes" ]; then
    echo "Conecta USB y luego:"
    echo "cp -r backups_seguridad /media/tu_usb/"
fi

# Opción 2: Comprimir para archivar
tar -czf backup_pre_migracion_$(date +%Y%m%d_%H%M%S).tar.gz backups_seguridad/
echo "✅ Archivo comprimido creado: backup_pre_migracion_*.tar.gz"

# Opción 3: Copiar a Google Drive (si tienes)
# Instalar: pip install --upgrade google-cloud-storage
# O simplemente copiar manualmente a Drive

# Opción 4: Enviar por email (MÁXIMO 25MB)
if command -v mail &> /dev/null; then
    echo "Puedes enviar el backup por email"
fi
```

### PASO 2b: Documentar dónde están los backups

```bash
# Crear archivo con ubicaciones
cat > BACKUP_LOCATIONS.txt << 'EOF'
=== UBICACIONES DE BACKUPS ===

1. LOCAL (Este directorio):
   backups_seguridad/
   
2. USB (RECOMENDADO - hacer ahora):
   Conectar USB → cp -r backups_seguridad /media/tu_usb/
   
3. COMPRIMIDO (para archivar):
   backup_pre_migracion_*.tar.gz
   
4. NUBE (opcional):
   Google Drive / Dropbox / OneDrive
   
5. EMAIL (para referencia):
   Enviar a tu email personal

=== QUÉ CONTIENE ===
- Código fuente completo
- Bases de datos (.db)
- Configuración (.env)
- Información del proyecto

=== CUÁNDO USAR ===
Si la migración falla:
1. Parar bot actual
2. Restaurar desde: backups_seguridad/[FECHA]/proyecto_completo/
3. Bot vuelve a funcionar inmediatamente

=== NO PERDER ESTOS BACKUPS ===
Son tu ÚNICA línea de defensa si algo sale mal.
Mantenerlos seguros por 1 mes después de migración.
EOF

cat BACKUP_LOCATIONS.txt
```

---

## FASE 3: PUNTO DE NO RETORNO
### ⏱️ Tiempo: 2 minutos - LEER BIEN

### PASO 3a: Verificación final ANTES de migrar

```bash
# CHECKLIST OBLIGATORIO

echo "=== CHECKLIST PRE-MIGRACIÓN ==="
echo ""

# ✅ 1. ¿Están los backups creados?
if [ -d "backups_seguridad" ]; then
    BACKUP_SIZE=$(du -sh backups_seguridad | cut -f1)
    echo "[✅] Backups creados: $BACKUP_SIZE"
else
    echo "[❌] ERROR: Sin backups. No continuar hasta completar FASE 1"
    exit 1
fi

# ✅ 2. ¿Bot actual funcionando?
echo "[✅] Bot actual funcionando (verificar que responde en Telegram)"
echo "   Nota: Pausar bot AHORA antes de migración"

# ✅ 3. ¿Tienes API key Claude?
if grep -q "CLAUDE_API_KEY" .env 2>/dev/null; then
    echo "[✅] CLAUDE_API_KEY en .env"
else
    echo "[⚠️] ADVERTENCIA: CLAUDE_API_KEY no encontrada en .env"
    echo "   Obtener en: https://console.anthropic.com/"
    echo "   Agregar a .env ANTES de iniciar bot mejorado"
fi

# ✅ 4. ¿Python disponible?
if command -v python3 &> /dev/null; then
    PY_VERSION=$(python3 --version 2>&1)
    echo "[✅] Python disponible: $PY_VERSION"
else
    echo "[❌] ERROR: Python 3 no encontrado"
    exit 1
fi

# ✅ 5. ¿Espacio en disco?
DISK_FREE=$(df . | tail -1 | awk '{print $4}')
if [ "$DISK_FREE" -gt 500000 ]; then
    echo "[✅] Espacio en disco: SUFICIENTE"
else
    echo "[⚠️] ADVERTENCIA: Espacio bajo (< 500MB)"
fi

echo ""
echo "=== RESULTADO ==="
echo "Si todos los ✅ están presentes, proceder a FASE 4"
echo ""
```

### PASO 3b: Decisión final

```bash
echo "⚠️  PUNTO DE NO RETORNO"
echo ""
echo "Estás a punto de migrar a la versión mejorada."
echo ""
echo "¿ESTÁS SEGURO? (escribe 'SI' para continuar)"
echo ""
read RESPONSE

if [ "$RESPONSE" != "SI" ]; then
    echo "Migración cancelada. Bot actual sigue funcionando."
    exit 0
fi

echo ""
echo "✅ Procediendo con migración..."
```

---

## FASE 4: MIGRACIÓN SEGURA
### ⏱️ Tiempo: 10 minutos

### PASO 4a: Parar bot actual

```bash
# 1. Parar el proceso
echo "Deteniendo bot actual..."
pkill -f "python main.py" 2>/dev/null || killall python 2>/dev/null || true

# 2. Esperar a que se cierre
sleep 3

# 3. Verificar que se paró
if pgrep -f "python main.py" > /dev/null; then
    echo "⚠️  Bot aún corriendo. Matar proceso manualmente:"
    echo "   - En terminal: Ctrl+C"
    echo "   - O buscar: ps aux | grep main.py"
    echo "   - Luego: kill [PID]"
    read -p "Presiona Enter cuando el bot esté detenido"
fi

echo "✅ Bot detenido"
```

### PASO 4b: Crear estructura nueva

```bash
# 1. Crear directorio para versión mejorada
mkdir -p bot_mejorado

# 2. Copiar archivos mejorados allá
cp config_mejorada.py bot_mejorado/
cp claude_integration.py bot_mejorado/
cp database_mejorada.py bot_mejorado/
cp main_mejorado.py bot_mejorado/

echo "✅ Archivos mejorados copiados a bot_mejorado/"

# 3. Copiar configuración (actualizada)
cp .env bot_mejorado/.env.backup

# 4. Crear .env nuevo en bot_mejorado
cp .env bot_mejorado/.env

echo "✅ Configuración copiada"
```

### PASO 4c: Instalar dependencias

```bash
# 1. Crear venv
python3 -m venv venv_nuevo
source venv_nuevo/bin/activate

# 2. Instalar
pip install --upgrade pip > /dev/null 2>&1
pip install anthropic==0.32.1 > /dev/null 2>&1
pip install python-telegram-bot==20.3 > /dev/null 2>&1

# 3. Guardar requirements
pip freeze > requirements_nuevo.txt

echo "✅ Dependencias instaladas"
```

### PASO 4d: Actualizar configuración

```bash
# Editar .env en bot_mejorado/
echo ""
echo "⚠️  IMPORTANTE: Actualizar .env"
echo ""
echo "Editar: bot_mejorado/.env"
echo ""
echo "Asegurarse de que tenga:"
echo "  ✅ TELEGRAM_BOT_TOKEN (copiar de anterior)"
echo "  ✅ CLAUDE_API_KEY (obtener de https://console.anthropic.com/)"
echo "  ✅ DATABASE_URL (puede dejar como está)"
echo ""
echo "Presiona Enter cuando hayas actualizado .env"
read CONFIRM

# Validar que tiene valores
if ! grep -q "TELEGRAM_BOT_TOKEN=" bot_mejorado/.env; then
    echo "❌ ERROR: TELEGRAM_BOT_TOKEN no definido"
    exit 1
fi

if ! grep -q "CLAUDE_API_KEY=" bot_mejorado/.env; then
    echo "❌ ERROR: CLAUDE_API_KEY no definido"
    exit 1
fi

echo "✅ Configuración validada"
```

### PASO 4e: Probar bot mejorado

```bash
# 1. Cambiar a directorio mejorado
cd bot_mejorado

# 2. Iniciar bot (sin Telegram aún, solo verificar código)
timeout 10 python main_mejorado.py > /tmp/bot_test.log 2>&1 &
BOT_PID=$!

# 3. Esperar a que inicie
sleep 5

# 4. Revisar logs
if grep -q "Bot iniciado" /tmp/bot_test.log; then
    echo "✅ Bot inicia correctamente"
    kill $BOT_PID 2>/dev/null || true
else
    echo "❌ ERROR: Bot no inicia"
    echo ""
    echo "Logs:"
    cat /tmp/bot_test.log
    exit 1
fi

cd ..
```

### PASO 4f: Migración completada

```bash
echo ""
echo "=== MIGRACIÓN COMPLETADA ==="
echo ""
echo "✅ Bot mejorado listo en: bot_mejorado/"
echo "✅ Backups seguros en: backups_seguridad/"
echo "✅ Configuración actualizada"
echo ""
echo "Próximo paso: Iniciar bot mejorado"
```

---

## FASE 5: VALIDACIÓN POST-MIGRACIÓN
### ⏱️ Tiempo: 10 minutos

### PASO 5a: Iniciar bot mejorado

```bash
cd bot_mejorado
source ../venv_nuevo/bin/activate
python main_mejorado.py
```

### PASO 5b: Pruebas en Telegram (otra terminal)

```bash
# Abre otra terminal y:
/start              # Bot debe responder con bienvenida
/gasto "pizza $50"  # Bot debe detectar y guardar
/balance            # Bot debe mostrar balance
/ayuda              # Debe listar comandos
```

### PASO 5c: Revisar BD nueva

```bash
# En terminal (sin parar bot):
cd bot_mejorado
sqlite3 gastos_mejorada.db "SELECT COUNT(*) FROM transacciones;"
# Debe mostrar: al menos 1
```

---

## 🔙 SI ALGO FALLA EN MIGRACIÓN

### Opción 1: Rollback a versión anterior

```bash
# 1. Parar bot mejorado
Ctrl+C

# 2. Restaurar desde backup
cd ..
rm -rf .  # OJO: Esto elimina TODO en el directorio actual
cp -r backups_seguridad/[FECHA]/proyecto_completo/* .

# 3. Iniciar bot viejo
python main.py

# 4. Bot original vuelve a funcionar
```

### Opción 2: Reintentar migración

```bash
# Si solo algo pequeño falló, puedes:
cd bot_mejorado
# Editar .env o archivos específicos
# Reintentar
python main_mejorado.py
```

---

## 📋 CHECKLIST FINAL

Antes de considerar la migración TERMINADA:

- [ ] Backups creados (FASE 1)
- [ ] Backups en lugar seguro (FASE 2)
- [ ] Bot anterior detenido (FASE 4a)
- [ ] Archivos mejorados copiados (FASE 4b)
- [ ] Dependencias instaladas (FASE 4c)
- [ ] .env actualizado (FASE 4d)
- [ ] Bot mejorado inicia sin errores (FASE 4e)
- [ ] Pruebas en Telegram funcionan (FASE 5b)
- [ ] BD nueva se creó (FASE 5c)
- [ ] Logs sin errores (monitoreo)

**Si TODO está ✅ → Migración exitosa**

---

## 📞 SI FALLA ALGO

**Paso 1: Identificar error exacto**
```bash
# Revisar logs
cat /tmp/bot_test.log
# O si bot está corriendo:
tail -f bot.log
```

**Paso 2: Común es...**
```
- "ModuleNotFoundError": pip install [modulo]
- "CLAUDE_API_KEY": Actualizar .env
- "Database locked": Parar bot, esperar 5s, reiniciar
- "Telegram error": Revisar TOKEN en .env
```

**Paso 3: Si no es fácil de arreglar**
```bash
# Rollback inmediato
rm -rf bot_mejorado/
cp -r backups_seguridad/[FECHA]/proyecto_completo/* .
python main.py
# Bot viejo funciona nuevamente
```

---

## ✅ RESUMEN PARA TI

Tu situación era delicada (sin backups + migración completa), por eso:

1. **PRIMERO:** Creamos backups robustos (FASE 1 + 2)
2. **SEGUNDO:** Verificamos todo esté seguro (FASE 3)
3. **TERCERO:** Hicimos migración gradual (FASE 4)
4. **CUARTO:** Validamos que funciona (FASE 5)
5. **RESULTADO:** ✅ Seguro + ✅ Funcional

Si algo falla, tienes backups para volver atrás inmediatamente.

---

**Ahora estás protegido. Proceder con confianza.** 🚀
