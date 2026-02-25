# Plan de Desarrollo: Bot de Telegram para Registro de Gastos

## 📋 Resumen Ejecutivo
Bot de Telegram que permite registrar, analizar y visualizar gastos personales con gráficos y presupuestos.

---

## 🎯 Funcionalidades Principales

### 1. Registrar Gastos
- Comando: `/gasto` o botón interactivo
- Formato: monto + categoría + descripción (opcional)
- Validación de datos
- Confirmación de registro

### 2. Ver Resumen por Período
- Resumen del día actual
- Resumen del mes actual
- Resumen personalizado (rango de fechas)
- Total de gastos y promedio diario

### 3. Establecer Presupuestos
- `/presupuesto` - Asignar límite por categoría
- Alertas cuando se aproxime al límite
- Notificación de sobregasto

### 4. Gráficos y Estadísticas
- Gráfico de pastel: distribución por categoría
- Gráfico de barras: gastos por día/semana/mes
- Estadísticas: mayor gasto, categoría más usada, etc.

---

## 🛠️ Stack Tecnológico

| Componente | Tecnología | Razón |
|-----------|-----------|-------|
| Bot Telegram | python-telegram-bot v20+ | Librería oficial, fácil de usar |
| Base de datos | SQLite (local) o PostgreSQL (cloud) | SQLite para empezar, escalable a PostgreSQL |
| Gráficos | Matplotlib/Plotly | Generar imágenes de estadísticas |
| Hosting | Railway, Render o Replit Free | Gratuito y fácil de desplegar |
| Lenguaje | Python 3.9+ | Ya tienes experiencia |

---

## 📁 Estructura del Proyecto

```
bot-gastos/
├── main.py                 # Punto de entrada
├── config.py              # Variables de configuración
├── database.py            # Operaciones con base de datos
├── handlers/
│   ├── start_handler.py   # Comando /start
│   ├── gasto_handler.py   # Registrar gastos
│   ├── resumen_handler.py # Ver resúmenes
│   ├── presupuesto_handler.py # Gestionar presupuestos
│   └── stats_handler.py   # Gráficos y estadísticas
├── utils/
│   ├── validators.py      # Validación de datos
│   ├── formatters.py      # Formatear mensajes
│   └── charts.py          # Generar gráficos
├── requirements.txt       # Dependencias
└── .env                   # Variables de entorno (NO subir a Git)
```

---

## 🚀 Fases de Desarrollo

### Fase 1: Configuración Inicial (2-3 horas)
- [ ] Crear bot en Telegram con @BotFather
- [ ] Configurar entorno local (Python, venv)
- [ ] Instalar dependencias
- [ ] Crear estructura de carpetas
- [ ] Configurar variables de entorno (.env)

### Fase 2: Base de Datos (3-4 horas)
- [ ] Diseñar esquema de tablas:
  - `usuarios`: id_usuario, nombre, fecha_creación
  - `gastos`: id, id_usuario, monto, categoría, descripción, fecha
  - `presupuestos`: id_usuario, categoría, límite_mensual
  - `categorías`: nombre, emoji/icono
- [ ] Crear funciones CRUD (Create, Read, Update, Delete)
- [ ] Probar conexión a base de datos

### Fase 3: Comandos Básicos (4-5 horas)
- [ ] `/start` - Bienvenida y menú principal
- [ ] `/gasto` - Registrar gasto interactivo
- [ ] `/ayuda` - Instrucciones de uso
- [ ] Configurar teclado inline para seleccionar categorías
- [ ] Manejo de errores y validaciones

### Fase 4: Resúmenes (3-4 horas)
- [ ] `/resumen_hoy` - Gastos del día
- [ ] `/resumen_mes` - Gastos del mes
- [ ] `/resumen` - Rango de fechas personalizado
- [ ] Formateo bonito de mensajes con emojis

### Fase 5: Presupuestos (3-4 horas)
- [ ] `/presupuesto` - Asignar límites
- [ ] Validar presupuesto al registrar gasto
- [ ] Alertas de sobregasto
- [ ] Ver presupuestos actuales

### Fase 6: Gráficos y Estadísticas (4-5 horas)
- [ ] `/stats` - Mostrar estadísticas mensuales
- [ ] Generar gráfico de pastel (gastos por categoría)
- [ ] Generar gráfico de barras (gastos por día)
- [ ] Estadísticas clave: promedio, mayor gasto, etc.
- [ ] Enviar imágenes al usuario

### Fase 7: Despliegue (2-3 horas)
- [ ] Crear cuenta en Railway/Render
- [ ] Configurar variables de entorno en la nube
- [ ] Hacer push a GitHub/GitLab
- [ ] Desplegar bot
- [ ] Probar en producción

---

## 📦 Dependencias Principales

```
python-telegram-bot==20.3
SQLAlchemy==2.0.23
psycopg2-binary==2.9.9  (si usas PostgreSQL)
matplotlib==3.8.2
python-dotenv==1.0.0
requests==2.31.0
```

---

## 🗄️ Esquema de Base de Datos (SQLite)

```sql
CREATE TABLE usuarios (
    id_usuario INTEGER PRIMARY KEY,
    nombre TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT UNIQUE,
    emoji TEXT
);

CREATE TABLE gastos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_usuario INTEGER,
    monto REAL,
    categoria_id INTEGER,
    descripcion TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

CREATE TABLE presupuestos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_usuario INTEGER,
    categoria_id INTEGER,
    limite_mensual REAL,
    mes_ano TEXT,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);
```

---

## 💬 Flujo de Interacción del Usuario

```
Usuario inicia el bot
    ↓
/start → Bienvenida + Menú principal
    ↓
┌─────────────────────────────────┐
│  Opciones:                      │
│  📝 Registrar gasto             │
│  📊 Ver resumen                 │
│  💰 Presupuestos               │
│  📈 Estadísticas               │
│  ❓ Ayuda                       │
└─────────────────────────────────┘
    ↓
[Usuario selecciona una opción]
```

### Ejemplo: Registrar Gasto
```
Usuario: /gasto
Bot: ¿Cuánto gastaste?
Usuario: 250
Bot: ¿Qué categoría?
     [Comida] [Transporte] [Diversión] [Otro]
Usuario: [Comida]
Bot: ¿Descripción? (opcional - escribe /saltar si no)
Usuario: Almuerzo en restaurante
Bot: ✅ Gasto registrado:
     💰 $250 en Comida
     📝 Almuerzo en restaurante
     📅 23/02/2025
```

---

## 🔐 Seguridad

- [ ] Usar archivo `.env` para token del bot
- [ ] NO guardar credenciales en el código
- [ ] Validar entrada del usuario (evitar inyecciones)
- [ ] Usar contraseñas para base de datos en la nube
- [ ] Limitar acceso solo a usuarios autorizados (ID usuario)

---

## 📊 Próximas Mejoras (Fase 8+)

- [ ] Exportar datos a Excel/PDF
- [ ] Categorías personalizadas por usuario
- [ ] Recordatorios automáticos
- [ ] Análisis de tendencias
- [ ] Sincronización con múltiples usuarios
- [ ] Interfaz web complementaria
- [ ] Base de datos en PostgreSQL en la nube

---

## ⏱️ Tiempo Estimado Total

- **Configuración e investigación**: 2-3 horas
- **Desarrollo completo**: 22-28 horas
- **Testing y ajustes**: 4-6 horas
- **Despliegue**: 2-3 horas

**Total**: 30-40 horas de trabajo (~4-5 semanas si dedicas 6-8 horas semanales)

---

## 📚 Recursos Útiles

- [Documentación python-telegram-bot](https://python-telegram-bot.readthedocs.io/)
- [Tutorial SQLAlchemy](https://docs.sqlalchemy.org/)
- [Documentación Matplotlib](https://matplotlib.org/)
- [Railway Deploy](https://railway.app/)
- [GitHub - Ejemplos de bots](https://github.com/python-telegram-bot/python-telegram-bot/wiki)

---

## ✅ Checklist para Comenzar

- [ ] Crear bot en Telegram con @BotFather
- [ ] Copiar token en archivo `.env`
- [ ] Crear repositorio en GitHub
- [ ] Clonar repositorio localmente
- [ ] Crear entorno virtual (venv)
- [ ] Instalar dependencias
- [ ] Crear archivo `config.py`
- [ ] Hacer primer commit

¡Listo para codificar! 🚀
