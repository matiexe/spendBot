import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';

let dbInstance: Database.Database | null = null;

export interface User {
  id_usuario: number;
  nombre: string;
  email?: string;
  telegram_id?: number;
  token_vinculacion?: string;
  fecha_creacion?: string;
  rol?: 'ADMIN' | 'USER';
}

export interface Expense {
  id: number;
  id_usuario: number;
  monto: number;
  categoria_id: number;
  descripcion: string;
  fecha: string;
  cuenta: string;
  origen: string;
  tipo?: string;
  categoriaNombre?: string;
  categoriaEmoji?: string;
  usuarioNombre?: string;
}

export function getDb(): Database.Database {
  if (!dbInstance) {
    const dbPath = path.resolve(process.cwd(), '../gastos.db');
    dbInstance = new Database(dbPath);
    dbInstance.pragma('journal_mode = WAL');

    // Auto-migración defensiva
    try {
      const columns = dbInstance.prepare("PRAGMA table_info(usuarios)").all() as any[];
      const colNames = columns.map(c => c.name);

      if (!colNames.includes('email')) {
        dbInstance.exec("ALTER TABLE usuarios ADD COLUMN email TEXT");
      }
      if (!colNames.includes('password_hash')) {
        dbInstance.exec("ALTER TABLE usuarios ADD COLUMN password_hash TEXT");
      }
      if (!colNames.includes('telegram_id')) {
        dbInstance.exec("ALTER TABLE usuarios ADD COLUMN telegram_id INTEGER");
      }
      if (!colNames.includes('token_vinculacion')) {
        dbInstance.exec("ALTER TABLE usuarios ADD COLUMN token_vinculacion TEXT");
      }
      if (!colNames.includes('rol')) {
        dbInstance.exec("ALTER TABLE usuarios ADD COLUMN rol TEXT DEFAULT 'USER'");
      }

      // Seeding automático de cuenta Administrador
      const adminExists = dbInstance.prepare("SELECT id_usuario FROM usuarios WHERE email = 'admin@spendbot.com'").get();
      if (!adminExists) {
        const adminPassHash = hashPassword('admin123');
        dbInstance.prepare(`
          INSERT INTO usuarios (nombre, email, password_hash, rol)
          VALUES (?, ?, ?, ?)
        `).run('Administrador', 'admin@spendbot.com', adminPassHash, 'ADMIN');
      }

      // Auto-migración defensiva para la tabla gastos (columna 'tipo')
      const columnsGastos = dbInstance.prepare("PRAGMA table_info(gastos)").all() as any[];
      const colNamesGastos = columnsGastos.map(c => c.name);
      if (!colNamesGastos.includes('tipo')) {
        dbInstance.exec("ALTER TABLE gastos ADD COLUMN tipo TEXT DEFAULT 'GASTO'");
      }

      // Tabla de transacciones recurrentes
      dbInstance.exec(`
        CREATE TABLE IF NOT EXISTS transacciones_recurrentes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          id_usuario INTEGER,
          tipo TEXT DEFAULT 'GASTO',
          monto REAL NOT NULL,
          categoria_id INTEGER,
          descripcion TEXT NOT NULL,
          dia_cobro INTEGER DEFAULT 1,
          duracion_meses INTEGER,
          activo INTEGER DEFAULT 1,
          fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } catch (e) {
      console.error("Error en auto-migración DB:", e);
    }
  }
  return dbInstance;
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function registerUser(nombre: string, email: string, password_hash: string) {
  const db = getDb();
  const existing = db.prepare('SELECT id_usuario FROM usuarios WHERE email = ?').get(email.toLowerCase().trim());
  if (existing) {
    throw new Error('El correo electrónico ya está registrado.');
  }

  const token_vinculacion = 'VIN-' + crypto.randomBytes(3).toString('hex').toUpperCase();

  const stmt = db.prepare(`
    INSERT INTO usuarios (nombre, email, password_hash, token_vinculacion, rol)
    VALUES (?, ?, ?, ?, 'USER')
  `);
  
  const result = stmt.run(nombre, email.toLowerCase().trim(), password_hash, token_vinculacion);
  return {
    id_usuario: Number(result.lastInsertRowid),
    nombre,
    email,
    token_vinculacion,
    rol: 'USER'
  };
}

export function loginUser(email: string, password: string) {
  const db = getDb();
  const password_hash = hashPassword(password);
  const user = db.prepare(`
    SELECT id_usuario, nombre, email, password_hash, telegram_id, token_vinculacion, COALESCE(rol, 'USER') as rol
    FROM usuarios WHERE email = ?
  `).get(email.toLowerCase().trim()) as any;

  if (!user || user.password_hash !== password_hash) {
    throw new Error('Credenciales incorrectas.');
  }

  return {
    id_usuario: user.id_usuario,
    nombre: user.nombre,
    email: user.email,
    telegram_id: user.telegram_id,
    token_vinculacion: user.token_vinculacion,
    rol: user.rol as 'ADMIN' | 'USER'
  };
}

export function getUserById(id_usuario: number) {
  const db = getDb();
  return db.prepare(`
    SELECT id_usuario, nombre, email, telegram_id, token_vinculacion, fecha_creacion, COALESCE(rol, 'USER') as rol
    FROM usuarios WHERE id_usuario = ?
  `).get(id_usuario) as User | undefined;
}

export function getDashboardData(userId?: number) {
  const db = getDb();
  
  const userWhereClause = userId ? 'WHERE g.id_usuario = ?' : '';
  const userParams = userId ? [userId] : [];

  // 1. Obtener gastos con categoría y usuario
  const expenses = db.prepare(`
    SELECT 
      g.id, g.id_usuario, g.monto, g.categoria_id, g.descripcion, g.fecha, g.cuenta, g.origen,
      COALESCE(g.tipo, 'GASTO') as tipo,
      c.nombre as categoriaNombre, c.emoji as categoriaEmoji,
      u.nombre as usuarioNombre
    FROM gastos g
    LEFT JOIN categorias c ON g.categoria_id = c.id
    LEFT JOIN usuarios u ON g.id_usuario = u.id_usuario
    ${userWhereClause}
    ORDER BY g.fecha DESC
    LIMIT 20
  `).all(...userParams) as Expense[];

  // 2. Total general acumulado de gastos (para el usuario específico)
  const totalRow = userId 
    ? db.prepare('SELECT SUM(monto) as total FROM gastos WHERE id_usuario = ?').get(userId) as { total: number }
    : db.prepare('SELECT SUM(monto) as total FROM gastos').get() as { total: number };
  const total = Math.abs(totalRow?.total || 0);

  // 3. Rango de fechas del mes actual
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  const firstDayThisMonth = new Date(year, month, 1).toISOString();
  const firstDayPrevMonth = new Date(year, month - 1, 1).toISOString();
  const lastDayPrevMonth = new Date(year, month - 1, 0, 23, 59, 59).toISOString();

  // 4. Totales del mes actual y del mes anterior (filtrados por id_usuario)
  const totalMonthRow = userId
    ? db.prepare('SELECT SUM(monto) as totalMonth FROM gastos WHERE fecha >= ? AND id_usuario = ?').get(firstDayThisMonth, userId) as { totalMonth: number }
    : db.prepare('SELECT SUM(monto) as totalMonth FROM gastos WHERE fecha >= ?').get(firstDayThisMonth) as { totalMonth: number };
  const totalMonth = Math.abs(totalMonthRow?.totalMonth || 0);

  const totalPrevMonthRow = userId
    ? db.prepare('SELECT SUM(monto) as totalPrevMonth FROM gastos WHERE fecha >= ? AND fecha <= ? AND id_usuario = ?').get(firstDayPrevMonth, lastDayPrevMonth, userId) as { totalPrevMonth: number }
    : db.prepare('SELECT SUM(monto) as totalPrevMonth FROM gastos WHERE fecha >= ? AND fecha <= ?').get(firstDayPrevMonth, lastDayPrevMonth) as { totalPrevMonth: number };
  const totalPrevMonth = Math.abs(totalPrevMonthRow?.totalPrevMonth || 0);

  // 5. Cadena formateada del período (01/MM/YYYY ➔ DD/MM/YYYY)
  const lastDayThisMonthNum = new Date(year, month + 1, 0).getDate();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const dateRangeStr = `01/${pad(month + 1)}/${year} ➔ ${pad(lastDayThisMonthNum)}/${pad(month + 1)}/${year}`;

  // 6. Desglose mensual de los últimos 13 meses filtrados por usuario
  const monthsList = [];
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  for (let i = 12; i >= 0; i--) {
    const d = new Date(year, month - i, 1);
    const mYear = d.getFullYear();
    const mMonth = d.getMonth();
    
    const mStart = new Date(mYear, mMonth, 1).toISOString();
    const mEnd = new Date(mYear, mMonth + 1, 0, 23, 59, 59).toISOString();

    const row = userId
      ? db.prepare('SELECT SUM(monto) as total FROM gastos WHERE fecha >= ? AND fecha <= ? AND id_usuario = ?').get(mStart, mEnd, userId) as { total: number }
      : db.prepare('SELECT SUM(monto) as total FROM gastos WHERE fecha >= ? AND fecha <= ?').get(mStart, mEnd) as { total: number };

    monthsList.push({
      name: monthNames[mMonth],
      year: mYear,
      total: Math.abs(row?.total || 0)
    });
  }

  // 7. Porcentaje de variación respecto al mes anterior
  let percentChange = 0;
  if (totalPrevMonth > 0) {
    percentChange = Math.round(((totalMonth - totalPrevMonth) / totalPrevMonth) * 1000) / 10;
  } else if (totalMonth > 0) {
    percentChange = 100;
  }

  // 8. Gastos por categoría
  const byCategory = userId
    ? db.prepare(`
        SELECT c.nombre, c.emoji, SUM(g.monto) as total
        FROM gastos g
        JOIN categorias c ON g.categoria_id = c.id
        WHERE g.id_usuario = ?
        GROUP BY c.id
        ORDER BY total DESC
      `).all(userId) as { nombre: string; emoji: string; total: number }[]
    : db.prepare(`
        SELECT c.nombre, c.emoji, SUM(g.monto) as total
        FROM gastos g
        JOIN categorias c ON g.categoria_id = c.id
        GROUP BY c.id
        ORDER BY total DESC
      `).all() as { nombre: string; emoji: string; total: number }[];

  const recent = expenses.slice(0, 5);

  const userCount = (db.prepare('SELECT COUNT(*) as count FROM usuarios').get() as any)?.count || 0;
  const totalCount = (db.prepare('SELECT COUNT(*) as count FROM gastos').get() as any)?.count || 0;

  return {
    total,
    totalMonth,
    totalPrevMonth,
    percentChange,
    dateRangeStr,
    monthsList,
    byCategory,
    recent,
    totalCount,
    userCount
  };
}

export function getAllTransactions(userId?: number) {
  const db = getDb();
  const userWhereClause = userId ? 'WHERE g.id_usuario = ?' : '';
  const userParams = userId ? [userId] : [];

  return db.prepare(`
    SELECT 
      g.id, g.id_usuario, g.monto, g.categoria_id, g.descripcion, g.fecha, g.cuenta, g.origen,
      COALESCE(g.tipo, 'GASTO') as tipo,
      c.nombre as categoriaNombre, c.emoji as categoriaEmoji,
      u.nombre as usuarioNombre
    FROM gastos g
    LEFT JOIN categorias c ON g.categoria_id = c.id
    LEFT JOIN usuarios u ON g.id_usuario = u.id_usuario
    ${userWhereClause}
    ORDER BY g.fecha DESC
  `).all(...userParams) as Expense[];
}

export function getCategories() {
  const db = getDb();
  return db.prepare('SELECT id, nombre, emoji FROM categorias ORDER BY nombre ASC').all();
}

export function getRecurringTransactions(userId?: number) {
  const db = getDb();
  const userWhere = userId ? 'WHERE r.id_usuario = ?' : '';
  const params = userId ? [userId] : [];

  return db.prepare(`
    SELECT 
      r.id, r.id_usuario, r.tipo, r.monto, r.categoria_id, r.descripcion,
      r.dia_cobro, r.duracion_meses, r.activo, r.fecha_creacion,
      c.nombre as categoriaNombre, c.emoji as categoriaEmoji
    FROM transacciones_recurrentes r
    LEFT JOIN categorias c ON r.categoria_id = c.id
    ${userWhere}
    ORDER BY r.id DESC
  `).all(...params);
}

export function createRecurringTransaction(data: {
  id_usuario: number;
  tipo: string;
  monto: number;
  categoria_id: number;
  descripcion: string;
  dia_cobro: number;
  duracion_meses?: number | null;
}) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO transacciones_recurrentes (id_usuario, tipo, monto, categoria_id, descripcion, dia_cobro, duracion_meses)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(
    data.id_usuario,
    data.tipo,
    data.monto,
    data.categoria_id,
    data.descripcion,
    data.dia_cobro,
    data.duracion_meses || null
  );
}

export function toggleRecurringTransaction(id: number) {
  const db = getDb();
  return db.prepare(`
    UPDATE transacciones_recurrentes
    SET activo = CASE WHEN activo = 1 THEN 0 ELSE 1 END
    WHERE id = ?
  `).run(id);
}

export function deleteRecurringTransaction(id: number) {
  const db = getDb();
  return db.prepare('DELETE FROM transacciones_recurrentes WHERE id = ?').run(id);
}

export function getAdminStats() {
  const db = getDb();

  // 1. Obtener la lista completa de usuarios con sus métricas acumuladas
  const users = db.prepare(`
    SELECT 
      u.id_usuario,
      u.nombre,
      u.email,
      u.telegram_id,
      u.token_vinculacion,
      COALESCE(u.rol, 'USER') as rol,
      u.fecha_creacion,
      COUNT(g.id) as totalTransacciones,
      COALESCE(SUM(g.monto), 0) as totalGastos
    FROM usuarios u
    LEFT JOIN gastos g ON u.id_usuario = g.id_usuario
    GROUP BY u.id_usuario
    ORDER BY u.id_usuario DESC
  `).all() as Array<{
    id_usuario: number;
    nombre: string;
    email: string | null;
    telegram_id: number | null;
    token_vinculacion: string | null;
    rol: string;
    fecha_creacion: string;
    totalTransacciones: number;
    totalGastos: number;
  }>;

  // 2. Resumen general de la plataforma
  const totalUsers = users.length;
  const linkedUsers = users.filter(u => u.telegram_id !== null).length;

  const platformTotalRow = db.prepare('SELECT COUNT(*) as count, COALESCE(SUM(monto), 0) as volumen FROM gastos').get() as { count: number; volumen: number };

  return {
    totalUsers,
    linkedUsers,
    unlinkedUsers: totalUsers - linkedUsers,
    totalTransactions: platformTotalRow?.count || 0,
    totalVolume: platformTotalRow?.volumen || 0,
    users
  };
}
