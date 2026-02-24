# 💸 Bot de Gastos Telegram + Dashboard

![Banner](https://via.placeholder.com/800x200/0f1015/6366f1?text=Telegram+Expense+Bot+%2B+Dashboard)

Un sistema integral "monorepo" diseñado para el registro rápido de tus gastos diarios directamente desde Telegram, acompañado de un Dashboard analítico premium web desarrollado en Next.js. El proyecto se basa en una base de datos local SQLite eficiente y veloz.

## 🌟 Características

### 🤖 Bot de Telegram (Backend Python)
*   **Comandos Intuitivos:** Registra gastos, categorías e historial con comandos directos de chat.
*   **Emojis Integrados:** Visualiza tus gastos con emojis descriptivos basados en las categorías (ej: `🍔 Comida`).
*   **Gestión Rápida de Presupuestos:** Configura límites para no exceder tus transacciones en una categoría.
*   **Extremadamente Rápido:** Basado en la librería `python-telegram-bot` y consultas SQLite seguras.

### 📊 Dashboard Analítico (Frontend React / Next.js)
*   **UI/UX Premium:** Interfaz oscura, esquema de colores vibrantes y Glassmorphism integrado (transparencia de cristal).
*   **Métricas Dinámicas en Vivo:** Consulta instantánea sin APIs de terceros de tu total de gastos históricos y del mes.
*   **Gráficos Estilizados:** Utilizando la librería `recharts` visualizamos la distribución de capital (gráficos de dona y barra).
*   **Server-Side Rendering:** Carga inmediata gracias a la integración nativa y renderizado por Next.js App Router (v15).

## 🛠️ Tecnologías

*   **Lenguajes:** Python 3.10+ | TypeScript / Node.js
*   **Bot API:** `python-telegram-bot`
*   **Web Framework:** Next.js (React 19)
*   **Base de Datos:** SQLite3 (con acceso desde backend y unificación con Next.js usando `better-sqlite3`)
*   **Estilos:** CSS Vanilla puro (con variables y tokens globales)

---

## 🚀 Guía de Instalación

Al ser una arquitectura monorepo, existen dos sistemas interconectados:

### 1. Requisitos Previos
*   Python 3.10 o superior instalado.
*   Node.js v18.x o superior.
*   Tu Token de Telegram Bot (obtenido a través de @BotFather)

### 2. Levantar el Bot (Python)

```bash
# Entrar a la raíz
cd botDegastosTelegram

# Instalar las dependencias del bot
pip install -r requirements.txt

# Copiar el archivo de entornos si lo tienes respaldado 
# (Requiere de TOKEN y permisos)
# Configura un archivo `.env` en base a la configuración que utilices.

# Ejecutar el servicio
python main.py
```

### 3. Levantar el Dashboard Analítico (Web)

Abre una **nueva ventana/pestaña** en tu terminal.

```bash
# Entrar a la carpeta del dashboard
cd botDegastosTelegram/dashboard

# Instalar los paquetes npm (React, Next, Recharts, better-sqlite3)
npm install

# Para ejecutar un servidor de desarrollo local
npm run dev

# (Opcional) Compilar para producción (Recomendado para servidores reales)
npm run build
npm run start
```
Una vez levantado ingresar en el puerto asignado por Node, por defecto: `http://localhost:3000`

---

## 🗃️ Estructura de Proyecto

```text
📁 botDegastosTelegram
 ├── 📄 main.py               # Punto de entrada y configuraciones del Bot
 ├── 📄 database.py           # Gestor con sqlite3 directo (Esquemas)
 ├── 📁 handlers/             # Funciones para procesar comandos (/start, /resumen)
 ├── 📁 utils/                # Utilidades y validaciones
 ├── 📄 gastos.db             # El archivo consolidado de tu BD SQLite 🔥
 |
 └── 📁 dashboard             # Aplicación Monorepo UI Web
      ├── 📁 src/app          # Páginas, layout y CSS premium Next.js 15
      ├── 📁 src/components   # Componente DashboardClient (Gráficos)
      └── 📁 src/lib/db.ts    # Controlador better-sqlite3 de sólo lectura
```

## 🔐 Seguridad y Notas
*   **Modo Sólo Lectura en Web:** El dashboard está configurado para acceder a `gastos.db` en modo `{ readonly: true }`. Las inserciones, actualizaciones o mutaciones las hace únicamente el bot para mantener la integridad transaccional de SQLite.
*   **Base centralizada:** El archivo `gastos.db` es ignorado de Git (`.gitignore`) para evitar subir tu control financiero personal a tu sistema de control de versiones.
