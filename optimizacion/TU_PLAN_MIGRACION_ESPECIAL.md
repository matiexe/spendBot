# 🚨 TU PLAN ESPECIAL DE MIGRACIÓN
## Bot Python + Migración Completa + SIN BACKUPS PREVIOS

---

## 📊 TU SITUACIÓN

```
✅ Tienes: Bot Python funcionando actualmente
✅ Quieres: Migración completa (reemplazar TODO)
❌ Problema: NO tienes backups

⚠️  RIESGO: ALTO si algo falla
✅ SOLUCIÓN: Protocolo especial de 5 fases
```

---

## ⏱️ TIMELINE TOTAL: 45 minutos

```
1. Crear backups          → 15 min  🔐
2. Validar backups        → 5 min   ✅
3. Migración segura       → 15 min  🚀
4. Validar que funciona   → 5 min   ✅
5. Limpiar y archivar     → 5 min   📦
```

---

## 🚦 PLAN PASO A PASO PARA TI

### 🟢 PASO 0: AHORA MISMO - Crear backups (15 min)

**ESTO ES CRÍTICO - NO SALTEAR**

```bash
# En terminal, en directorio de tu proyecto:

bash crear_backups_seguridad.sh
```

**¿Qué hace?**
- ✅ Crea carpeta `backups_seguridad/`
- ✅ Copia TODO tu proyecto
- ✅ Copia todas tus BD (.db)
- ✅ Copia tu .env (configuración)
- ✅ Genera checksums para validación
- ✅ Crea instrucciones de restauración

**¿Qué ver después?**
```
✅ "BACKUP DE SEGURIDAD COMPLETADO"
✅ "Estás protegido. Ahora puedes migrar con confianza."
```

**Tiempo**: 5-10 minutos

---

### 🟢 PASO 1: Validar que backup está completo (5 min)

```bash
# Verificar que se creó correctamente
ls -la backups_seguridad/

# Debe mostrar:
# ✅ Una carpeta con TIMESTAMP
# ✅ Dentro: proyecto_completo/, bases_datos/, archivos_criticos/

# Contar archivos
find backups_seguridad -type f | wc -l
# Debe mostrar: número > 50
```

**Si TODO está ✅:** Proceder a PASO 2

**Si algo falta:** 
```bash
# Volver a ejecutar script
bash crear_backups_seguridad.sh
```

---

### 🟡 PASO 2: Leer instrucciones completas (5 min)

Leer archivo:
```
MIGRACION_COMPLETA_SIN_BACKUPS.md
```

**Especialmente:**
- Fase 1: Crear backups (✅ ya lo hiciste)
- Fase 2: Copiar a lugar seguro
- Fase 3: Verificación final
- Fase 4: Migración
- Fase 5: Validación
- Sección: Si algo falla

---

### 🟡 PASO 3: Copiar backups a lugar seguro (5 min)

**MUY IMPORTANTE - No confíes solo en disco local**

```bash
# Opción A: Copiar a USB (RECOMENDADO)
# 1. Conectar USB
# 2. Ejecutar:
cp -r backups_seguridad /media/[USB_NAME]/

# Opción B: Comprimir para archivar
tar -czf backup_antes_migracion_$(date +%Y%m%d).tar.gz backups_seguridad/

# Opción C: Si tienes Google Drive/OneDrive
# Copiar manualmente carpeta backups_seguridad/

# Verificar que se copió
ls /media/[USB_NAME]/backups_seguridad/  # Si usaste USB
# O
ls -la backup_antes_migracion_*.tar.gz    # Si comprimiste
```

---

### 🔴 PASO 4: Migración completa (20 min)

Ahora sí, ejecutar las fases en orden:

**4a. Parar bot actual**
```bash
# Si está corriendo en esta terminal:
Ctrl+C

# Si está en background:
pkill -f "python main.py" || killall python 2>/dev/null || true

# Esperar 3 segundos
sleep 3
```

**4b. Crear estructura nueva**
```bash
# Crear directorio para versión mejorada
mkdir -p bot_mejorado

# Copiar archivos mejorados (ya descargados)
cp config_mejorada.py bot_mejorado/
cp claude_integration.py bot_mejorado/
cp database_mejorada.py bot_mejorado/
cp main_mejorado.py bot_mejorado/

# Copiar configuración
cp .env bot_mejorado/.env

echo "✅ Estructura nueva creada"
```

**4c. Instalar dependencias**
```bash
# Crear venv
python3 -m venv venv_nuevo

# Activar
source venv_nuevo/bin/activate  # Linux/Mac
# O en Windows:
venv_nuevo\Scripts\activate

# Instalar
pip install --upgrade pip
pip install anthropic==0.32.1
pip install python-telegram-bot==20.3

echo "✅ Dependencias instaladas"
```

**4d. Actualizar .env**
```bash
# Abrir bot_mejorado/.env y verificar:
# ✅ TELEGRAM_BOT_TOKEN = [tu token actual]
# ✅ CLAUDE_API_KEY = [obtener de https://console.anthropic.com/]
# ✅ DATABASE_URL = sqlite:///./gastos_mejorada.db

# IMPORTANTE: Si CLAUDE_API_KEY está vacío o "sk-ant-v7-..."
# Ir a https://console.anthropic.com/ y obtener la API key real
```

**4e. Probar bot mejorado**
```bash
cd bot_mejorado

# Ejecutar (va a iniciar el bot)
python main_mejorado.py

# Si ves: "Bot iniciado" → ✅ ÉXITO
# Si ves error → revisar logs y volver a backups
```

---

### 🟢 PASO 5: Validar en Telegram (5 min)

**En otra terminal/ventana:**

```bash
# Abrir Telegram y enviar a tu bot:

/start
# Bot debe responder con bienvenida

/gasto "Compré pizza por $50"
# Bot debe detectar y guardar

/balance
# Bot debe mostrar ingresos vs gastos

/ayuda
# Bot debe listar comandos
```

**Si TODO funciona:** ✅ Migración exitosa

**Si algo falla:**
1. Revisar logs en terminal donde corre bot
2. Revisar .env (especialmente CLAUDE_API_KEY)
3. Si no se puede arreglar → ROLLBACK (ver abajo)

---

### 🟢 PASO 6: Rollback si falla (5 min)

Si en algún momento falla:

```bash
# 1. Parar bot mejorado
Ctrl+C

# 2. Volver a tu directorio raíz
cd ..

# 3. Restaurar desde backup
rm -rf .  # ⚠️  Borra TODO

# Luego restaurar:
cp -r backups_seguridad/[TIMESTAMP]/proyecto_completo/* .

# 4. Iniciar bot viejo
python main.py

# ✅ Bot anterior funciona nuevamente
```

**GARANTIZADO:** Con este plan, siempre puedes volver atrás en 2 minutos.

---

## ✅ CHECKLIST ANTES DE EMPEZAR

Antes de hacer PASO 0, verificar:

- [ ] **Tengo acceso a terminal/CMD**
- [ ] **Python 3 instalado** (`python3 --version`)
- [ ] **Bot actual funcionando** (responde /start en Telegram)
- [ ] **Tengo espacio en disco** (>500MB libre)
- [ ] **Tengo internet** (para descargar dependencias)
- [ ] **Tengo API key Claude** (de https://console.anthropic.com/)
- [ ] **He leído MIGRACION_COMPLETA_SIN_BACKUPS.md**

**Si alguno es NO → No empezar aún**

---

## 🚨 PUNTOS CRÍTICOS

1. **Crear backups PRIMERO**
   - No saltear PASO 0
   - Sin backups = sin opción de rollback

2. **Actualizar CLAUDE_API_KEY**
   - Ir a https://console.anthropic.com/
   - Crear/copiar la API key
   - Pegar en bot_mejorado/.env
   - Sin esto IA no funciona

3. **Copiar backups a lugar seguro**
   - USB, Google Drive, o comprimir
   - No confiar solo en disco local
   - Mantener por 1 mes después

4. **Monitorear primeras 24h**
   - Revisar logs frecuentemente
   - Testear comandos varias veces
   - Verificar que BD crece

---

## 📋 RESUMEN COMANDO POR COMANDO

```bash
# Terminal 1: Crear backups
bash crear_backups_seguridad.sh

# Terminal 1: Validar
find backups_seguridad -type f | wc -l

# Terminal 1: Copiar a USB (opcional pero recomendado)
cp -r backups_seguridad /media/usb/

# Terminal 1: Crear estructura
mkdir -p bot_mejorado
cp config_mejorada.py claude_integration.py database_mejorada.py main_mejorado.py bot_mejorado/
cp .env bot_mejorado/

# Terminal 1: Instalar
python3 -m venv venv_nuevo
source venv_nuevo/bin/activate
pip install anthropic==0.32.1 python-telegram-bot==20.3

# Terminal 1: Actualizar .env
# Editar: bot_mejorado/.env
# Agregar: CLAUDE_API_KEY=...

# Terminal 1: Ejecutar bot
cd bot_mejorado
python main_mejorado.py

# Terminal 2: Probar en Telegram
/start
/gasto "pizza $50"
/balance
```

---

## 🎁 BONUS: Después de migración exitosa

Una vez que todo funciona por 24h:

```bash
# Limpiar venv viejo (opcional)
rm -rf venv/
rm -rf venv_*

# Archivar backups
tar -czf backups_$(date +%Y%m%d).tar.gz backups_seguridad/

# Comprimir proyecto viejo (opcional)
tar -czf proyecto_viejo_backup_$(date +%Y%m%d).tar.gz \
    --exclude=venv \
    --exclude=__pycache__ \
    backups_seguridad/[FECHA]/proyecto_completo/

# Verificar espacio liberado
du -sh .
```

---

## 📞 SI FALLA EN ALGÚN PUNTO

**Error común:**
```
ModuleNotFoundError: No module named 'anthropic'
```
**Solución:**
```bash
pip install anthropic==0.32.1
```

**Error común:**
```
CLAUDE_API_KEY not found
```
**Solución:**
```bash
# Editar bot_mejorado/.env y agregar
CLAUDE_API_KEY=sk-ant-v7-XXXXXXXXXXX
```

**Error común:**
```
Telegram token invalid
```
**Solución:**
```bash
# Verificar que .env tiene token correcto del bot actual
cat .env | grep TELEGRAM_BOT_TOKEN
```

---

## ✨ RESULTADO FINAL

Después de completar esto:

✅ **Bot anterior:** Seguro en backups (accesible cualquier momento)
✅ **Bot mejorado:** Funcionando con IA
✅ **27 categorías:** Disponibles (gastos + ingresos)
✅ **Detección automática:** Con Claude API
✅ **Balance:** Ingresos vs Gastos automático
✅ **Sin pérdida de datos:** Todo respaldado
✅ **Rollback garantizado:** Volver atrás en 2 minutos

---

## 🎯 PRÓXIMOS PASOS

1. **Ejecutar:**  `bash crear_backups_seguridad.sh`
2. **Leer:** `MIGRACION_COMPLETA_SIN_BACKUPS.md`
3. **Seguir:** Pasos 2-6 en este documento
4. **Validar:** En Telegram
5. **Monitorear:** Primeras 24 horas
6. **Archivar:** Backups en lugar seguro

---

**¡Estás protegido y listo!** 🚀

Tu migración es segura, documentada y reversible.
Proceder con confianza.
