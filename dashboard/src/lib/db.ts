import { Pool } from 'pg';
import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';

let pgPool: Pool | null = null;
let sqliteDb: Database.Database | null = null;

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

export function isPgMode(): boolean {
  const url = process.env.DATABASE_URL || '';
  return url.startsWith('postgres://') || url.startsWith('postgresql://');
}

export function getPgPool(): Pool {
  if (!pgPool) {
    let connectionString = process.env.DATABASE_URL || '';
    if (connectionString.startsWith('postgres://')) {
      connectionString = connectionString.replace('postgres://', 'postgresql://');
    }
    pgPool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' || connectionString.includes('sslmode=') || connectionString.includes('neon.tech') || connectionString.includes('supabase')
        ? { rejectUnauthorized: false }
        : undefined
    });
  }
  return pgPool;
}

function resolveDatabasePath(): string {
  if (process.env.DATABASE_PATH) {
    return path.resolve(process.env.DATABASE_PATH);
  }
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('sqlite://')) {
    const rawPath = process.env.DATABASE_URL.replace('sqlite://', '');
    return path.resolve(rawPath);
  }

  const cwd = process.cwd();
  if (cwd.includes('dashboard')) {
    const rootDir = cwd.split('dashboard')[0];
    const candidate = path.join(rootDir, 'gastos.db');
    if (fs.existsSync(candidate)) return candidate;
    return candidate;
  }

  const rootDb = path.resolve(cwd, 'gastos.db');
  if (fs.existsSync(rootDb)) return rootDb;

  const parentDb = path.resolve(cwd, '../gastos.db');
  if (fs.existsSync(parentDb)) return parentDb;

  return rootDb;
}

export function getSqliteDb(): Database.Database {
  if (!sqliteDb) {
    const dbPath = resolveDatabasePath();
    sqliteDb = new Database(dbPath);
    sqliteDb.pragma('journal_mode = WAL');

    try {
      const columns = sqliteDb.prepare("PRAGMA table_info(usuarios)").all() as any[];
      const colNames = columns.map(c => c.name);

      if (!colNames.includes('email')) sqliteDb.exec("ALTER TABLE usuarios ADD COLUMN email TEXT");
      if (!colNames.includes('password_hash')) sqliteDb.exec("ALTER TABLE usuarios ADD COLUMN password_hash TEXT");
      if (!colNames.includes('telegram_id')) sqliteDb.exec("ALTER TABLE usuarios ADD COLUMN telegram_id INTEGER");
      if (!colNames.includes('token_vinculacion')) sqliteDb.exec("ALTER TABLE usuarios ADD COLUMN token_vinculacion TEXT");
      if (!colNames.includes('rol')) sqliteDb.exec("ALTER TABLE usuarios ADD COLUMN rol TEXT DEFAULT 'USER'");

      const adminExists = sqliteDb.prepare("SELECT id_usuario FROM usuarios WHERE email = 'admin@spendbot.com'").get();
      if (!adminExists) {
        const adminPassHash = hashPassword('admin123');
        sqliteDb.prepare(`
          INSERT INTO usuarios (nombre, email, password_hash, rol)
          VALUES (?, ?, ?, ?)
        `).run('Administrador', 'admin@spendbot.com', adminPassHash, 'ADMIN');
      }

      const columnsGastos = sqliteDb.prepare("PRAGMA table_info(gastos)").all() as any[];
      const colNamesGastos = columnsGastos.map(c => c.name);
      if (!colNamesGastos.includes('tipo')) sqliteDb.exec("ALTER TABLE gastos ADD COLUMN tipo TEXT DEFAULT 'GASTO'");

      sqliteDb.exec(`
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
      console.error("Error en auto-migración SQLite:", e);
    }
  }
  return sqliteDb;
}

export function getDb(): Database.Database {
  return getSqliteDb();
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function queryDb(sql: string, params: any[] = []): Promise<any[]> {
  if (isPgMode()) {
    const pool = getPgPool();
    let paramIdx = 1;
    const pgSql = sql.replace(/\?/g, () => `$${paramIdx++}`);
    const res = await pool.query(pgSql, params);
    return res.rows;
  } else {
    const db = getSqliteDb();
    const cleanSql = sql.trim().toUpperCase();
    if (cleanSql.startsWith('SELECT') || cleanSql.startsWith('PRAGMA')) {
      return db.prepare(sql).all(...params) as any[];
    } else {
      const info = db.prepare(sql).run(...params);
      return [{ lastInsertRowid: info.lastInsertRowid, changes: info.changes }];
    }
  }
}

export async function getOneDb(sql: string, params: any[] = []): Promise<any | undefined> {
  const rows = await queryDb(sql, params);
  return rows[0];
}

export async function registerUser(nombre: string, email: string, plainPassword: string) {
  const cleanEmail = email.toLowerCase().trim();
  const cleanNombre = nombre.trim();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    throw new Error('Por favor ingresá un correo electrónico válido (ej: usuario@dominio.com).');
  }

  const existing = await getOneDb('SELECT id_usuario FROM usuarios WHERE LOWER(email) = ?', [cleanEmail]);
  if (existing) {
    throw new Error('El correo electrónico ya está registrado. Por favor iniciá sesión o probá con otro correo.');
  }

  const password_hash = hashPassword(plainPassword);
  const token_vinculacion = 'VIN-' + crypto.randomBytes(3).toString('hex').toUpperCase();

  const res = await queryDb(`
    INSERT INTO usuarios (nombre, email, password_hash, token_vinculacion, rol)
    VALUES (?, ?, ?, ?, 'USER')
  `, [cleanNombre, cleanEmail, password_hash, token_vinculacion]);
  
  const id_usuario = res[0]?.id_usuario || Number(res[0]?.lastInsertRowid || 1);

  return {
    id_usuario,
    nombre: cleanNombre,
    email: cleanEmail,
    token_vinculacion,
    rol: 'USER'
  };
}

export async function loginUser(emailOrUsername: string, password: string) {
  const cleanInput = emailOrUsername.toLowerCase().trim();
  const password_hash = hashPassword(password);
  
  const user = await getOneDb(`
    SELECT id_usuario, nombre, email, password_hash, telegram_id, token_vinculacion, COALESCE(rol, 'USER') as rol
    FROM usuarios WHERE LOWER(email) = ? OR LOWER(username) = ?
  `, [cleanInput, cleanInput]);

  if (!user) {
    throw new Error('El usuario no existe o las credenciales ingresadas son incorrectas.');
  }

  if (user.password_hash && user.password_hash !== password_hash) {
    throw new Error('La contraseña ingresada es incorrecta. Por favor verificá tus datos.');
  }

  return {
    id_usuario: Number(user.id_usuario),
    nombre: user.nombre,
    email: user.email || user.nombre,
    telegram_id: user.telegram_id ? Number(user.telegram_id) : null,
    token_vinculacion: user.token_vinculacion,
    rol: user.rol as 'ADMIN' | 'USER'
  };
}

export async function getUserById(id_usuario: number) {
  const u = await getOneDb(`
    SELECT id_usuario, nombre, email, telegram_id, token_vinculacion, fecha_creacion, COALESCE(rol, 'USER') as rol
    FROM usuarios WHERE id_usuario = ?
  `, [id_usuario]);
  if (!u) return undefined;
  return {
    ...u,
    id_usuario: Number(u.id_usuario),
    telegram_id: u.telegram_id ? Number(u.telegram_id) : undefined
  } as User;
}

export async function getDashboardData(userId?: number) {
  const userWhereClause = userId ? 'WHERE CAST(g.id_usuario AS TEXT) = ?' : '';
  const userParams = userId ? [String(userId)] : [];

  const expenses = await queryDb(`
    SELECT 
      g.id, g.id_usuario, g.monto, g.categoria_id, g.descripcion, g.fecha, g.cuenta, g.origen,
      COALESCE(g.tipo, 'GASTO') as tipo,
      c.nombre as categoriaNombre, c.emoji as categoriaEmoji,
      u.nombre as usuarioNombre
    FROM gastos g
    LEFT JOIN categorias c ON g.categoria_id = c.id
    LEFT JOIN usuarios u ON CAST(g.id_usuario AS TEXT) = CAST(u.id_usuario AS TEXT)
    ${userWhereClause}
    ORDER BY g.fecha DESC
    LIMIT 20
  `, userParams);

  const totalRow = userId 
    ? await getOneDb('SELECT SUM(monto) as total FROM gastos WHERE CAST(id_usuario AS TEXT) = ?', [String(userId)])
    : await getOneDb('SELECT SUM(monto) as total FROM gastos');
  const total = Math.abs(Number(totalRow?.total || 0));

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  const firstDayThisMonth = new Date(year, month, 1).toISOString();
  const firstDayPrevMonth = new Date(year, month - 1, 1).toISOString();
  const lastDayPrevMonth = new Date(year, month - 1, 0, 23, 59, 59).toISOString();

  const totalMonthRow = userId
    ? await getOneDb('SELECT SUM(monto) as totalmonth FROM gastos WHERE fecha >= ? AND CAST(id_usuario AS TEXT) = ?', [firstDayThisMonth, String(userId)])
    : await getOneDb('SELECT SUM(monto) as totalmonth FROM gastos WHERE fecha >= ?', [firstDayThisMonth]);
  const totalMonth = Math.abs(Number(totalMonthRow?.totalmonth || totalMonthRow?.totalMonth || 0));

  const totalPrevMonthRow = userId
    ? await getOneDb('SELECT SUM(monto) as totalprevmonth FROM gastos WHERE fecha >= ? AND fecha <= ? AND CAST(id_usuario AS TEXT) = ?', [firstDayPrevMonth, lastDayPrevMonth, String(userId)])
    : await getOneDb('SELECT SUM(monto) as totalprevmonth FROM gastos WHERE fecha >= ? AND fecha <= ?', [firstDayPrevMonth, lastDayPrevMonth]);
  const totalPrevMonth = Math.abs(Number(totalPrevMonthRow?.totalprevmonth || totalPrevMonthRow?.totalPrevMonth || 0));

  const lastDayThisMonthNum = new Date(year, month + 1, 0).getDate();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const dateRangeStr = `01/${pad(month + 1)}/${year} ➔ ${pad(lastDayThisMonthNum)}/${pad(month + 1)}/${year}`;

  const monthsList = [];
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  for (let i = 12; i >= 0; i--) {
    const d = new Date(year, month - i, 1);
    const mYear = d.getFullYear();
    const mMonth = d.getMonth();
    
    const mStart = new Date(mYear, mMonth, 1).toISOString();
    const mEnd = new Date(mYear, mMonth + 1, 0, 23, 59, 59).toISOString();

    const row = userId
      ? await getOneDb('SELECT SUM(monto) as total FROM gastos WHERE fecha >= ? AND fecha <= ? AND CAST(id_usuario AS TEXT) = ?', [mStart, mEnd, String(userId)])
      : await getOneDb('SELECT SUM(monto) as total FROM gastos WHERE fecha >= ? AND fecha <= ?', [mStart, mEnd]);

    monthsList.push({
      name: monthNames[mMonth],
      year: mYear,
      total: Math.abs(Number(row?.total || 0))
    });
  }

  let percentChange = 0;
  if (totalPrevMonth > 0) {
    percentChange = Math.round(((totalMonth - totalPrevMonth) / totalPrevMonth) * 1000) / 10;
  } else if (totalMonth > 0) {
    percentChange = 100;
  }

  const byCategory = userId
    ? await queryDb(`
        SELECT c.nombre, c.emoji, SUM(g.monto) as total
        FROM gastos g
        JOIN categorias c ON g.categoria_id = c.id
        WHERE CAST(g.id_usuario AS TEXT) = ?
        GROUP BY c.id, c.nombre, c.emoji
        ORDER BY total DESC
      `, [String(userId)])
    : await queryDb(`
        SELECT c.nombre, c.emoji, SUM(g.monto) as total
        FROM gastos g
        JOIN categorias c ON g.categoria_id = c.id
        GROUP BY c.id, c.nombre, c.emoji
        ORDER BY total DESC
      `);

  const recent = expenses.slice(0, 5);

  const userCountRow = await getOneDb('SELECT COUNT(*) as count FROM usuarios');
  const totalCountRow = await getOneDb('SELECT COUNT(*) as count FROM gastos');

  return {
    total,
    totalMonth,
    totalPrevMonth,
    percentChange,
    dateRangeStr,
    monthsList,
    byCategory: byCategory.map(c => ({ nombre: c.nombre, emoji: c.emoji, total: Number(c.total || 0) })),
    recent: recent.map(r => ({
      ...r,
      id: Number(r.id),
      id_usuario: Number(r.id_usuario),
      monto: Number(r.monto || 0),
      categoriaNombre: r.categorianombre || r.categoriaNombre,
      categoriaEmoji: r.categoriaemoji || r.categoriaEmoji,
      usuarioNombre: r.usuarionombre || r.usuarioNombre
    })),
    totalCount: Number(totalCountRow?.count || 0),
    userCount: Number(userCountRow?.count || 0)
  };
}

export async function getAllTransactions(userId?: number) {
  const userWhereClause = userId ? 'WHERE CAST(g.id_usuario AS TEXT) = ?' : '';
  const userParams = userId ? [String(userId)] : [];

  const rows = await queryDb(`
    SELECT 
      g.id, g.id_usuario, g.monto, g.categoria_id, g.descripcion, g.fecha, g.cuenta, g.origen,
      COALESCE(g.tipo, 'GASTO') as tipo,
      c.nombre as categoriaNombre, c.emoji as categoriaEmoji,
      u.nombre as usuarioNombre
    FROM gastos g
    LEFT JOIN categorias c ON g.categoria_id = c.id
    LEFT JOIN usuarios u ON CAST(g.id_usuario AS TEXT) = CAST(u.id_usuario AS TEXT)
    ${userWhereClause}
    ORDER BY g.fecha DESC
  `, userParams);

  return rows.map(r => ({
    ...r,
    id: Number(r.id),
    id_usuario: Number(r.id_usuario),
    monto: Number(r.monto || 0),
    categoriaNombre: r.categorianombre || r.categoriaNombre,
    categoriaEmoji: r.categoriaemoji || r.categoriaEmoji,
    usuarioNombre: r.usuarionombre || r.usuarioNombre
  })) as Expense[];
}

export async function getCategories() {
  return await queryDb('SELECT id, nombre, emoji FROM categorias ORDER BY nombre ASC');
}

export async function getRecurringTransactions(userId?: number) {
  const userWhere = userId ? 'WHERE CAST(r.id_usuario AS TEXT) = ?' : '';
  const params = userId ? [String(userId)] : [];

  const rows = await queryDb(`
    SELECT 
      r.id, r.id_usuario, r.tipo, r.monto, r.categoria_id, r.descripcion,
      r.dia_cobro, r.duracion_meses, r.activo, r.fecha_creacion,
      c.nombre as categoriaNombre, c.emoji as categoriaEmoji
    FROM transacciones_recurrentes r
    LEFT JOIN categorias c ON r.categoria_id = c.id
    ${userWhere}
    ORDER BY r.id DESC
  `, params);

  return rows.map(r => ({
    ...r,
    id: Number(r.id),
    id_usuario: Number(r.id_usuario),
    monto: Number(r.monto || 0),
    categoriaNombre: r.categorianombre || r.categoriaNombre,
    categoriaEmoji: r.categoriaemoji || r.categoriaEmoji
  }));
}

export async function createRecurringTransaction(data: {
  id_usuario: number;
  tipo: string;
  monto: number;
  categoria_id: number;
  descripcion: string;
  dia_cobro: number;
  duracion_meses?: number | null;
}) {
  return await queryDb(`
    INSERT INTO transacciones_recurrentes (id_usuario, tipo, monto, categoria_id, descripcion, dia_cobro, duracion_meses)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    data.id_usuario,
    data.tipo,
    data.monto,
    data.categoria_id,
    data.descripcion,
    data.dia_cobro,
    data.duracion_meses || null
  ]);
}

export async function toggleRecurringTransaction(id: number, userId?: number) {
  if (userId) {
    return await queryDb(`
      UPDATE transacciones_recurrentes
      SET activo = CASE WHEN activo = 1 THEN 0 ELSE 1 END
      WHERE id = ? AND CAST(id_usuario AS TEXT) = ?
    `, [id, String(userId)]);
  }
  return await queryDb(`
    UPDATE transacciones_recurrentes
    SET activo = CASE WHEN activo = 1 THEN 0 ELSE 1 END
    WHERE id = ?
  `, [id]);
}

export async function deleteRecurringTransaction(id: number, userId?: number) {
  if (userId) {
    return await queryDb('DELETE FROM transacciones_recurrentes WHERE id = ? AND CAST(id_usuario AS TEXT) = ?', [id, String(userId)]);
  }
  return await queryDb('DELETE FROM transacciones_recurrentes WHERE id = ?', [id]);
}

export async function getAdminStats() {
  const users = await queryDb(`
    SELECT 
      u.id_usuario,
      COALESCE(NULLIF(TRIM(u.nombre), ''), 'Usuario #' || u.id_usuario) as nombre,
      u.email,
      u.telegram_id,
      u.token_vinculacion,
      COALESCE(u.rol, 'USER') as rol,
      u.fecha_creacion,
      COUNT(g.id) as totalTransacciones,
      COALESCE(SUM(g.monto), 0) as totalGastos
    FROM usuarios u
    LEFT JOIN gastos g ON CAST(u.id_usuario AS TEXT) = CAST(g.id_usuario AS TEXT)
    GROUP BY u.id_usuario, u.nombre, u.email, u.telegram_id, u.token_vinculacion, u.rol, u.fecha_creacion
    ORDER BY u.id_usuario DESC
  `);

  const totalUsers = users.length;
  const linkedUsers = users.filter(u => u.telegram_id !== null && u.telegram_id !== undefined).length;

  const platformTotalRow = await getOneDb('SELECT COUNT(*) as count, COALESCE(SUM(monto), 0) as volumen FROM gastos');

  return {
    totalUsers,
    linkedUsers,
    unlinkedUsers: totalUsers - linkedUsers,
    totalTransactions: Number(platformTotalRow?.count || 0),
    totalVolume: Number(platformTotalRow?.volumen || 0),
    users: users.map(u => ({
      id_usuario: Number(u.id_usuario),
      nombre: String(u.nombre || ''),
      email: u.email ? String(u.email) : null,
      telegram_id: u.telegram_id ? Number(u.telegram_id) : null,
      token_vinculacion: u.token_vinculacion ? String(u.token_vinculacion) : null,
      rol: String(u.rol || 'USER'),
      fecha_creacion: String(u.fecha_creacion || ''),
      totalTransacciones: Number(u.totaltransacciones || u.totalTransacciones || 0),
      totalGastos: Number(u.totalgastos || u.totalGastos || 0)
    }))
  };
}
