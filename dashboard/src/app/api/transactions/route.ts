import { NextResponse } from 'next/server';
import { getDb, Expense } from '@/lib/db';
import { cookies } from 'next/headers';

async function getSessionUserId() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('spendbot_session')?.value;
  if (!sessionCookie) return null;
  try {
    const parsed = JSON.parse(sessionCookie);
    return parsed.userId || null;
  } catch {
    return null;
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const userId = await getSessionUserId();
    const db = getDb();
    const userFilter = userId ? 'WHERE g.id_usuario = ?' : '';
    const userParams = userId ? [userId] : [];

    const expenses = db.prepare(`
      SELECT 
        g.id, g.id_usuario, g.monto, g.categoria_id, g.descripcion, g.fecha, g.cuenta, g.origen,
        c.nombre as categoriaNombre, c.emoji as categoriaEmoji,
        u.nombre as usuarioNombre
      FROM gastos g
      LEFT JOIN categorias c ON g.categoria_id = c.id
      LEFT JOIN usuarios u ON g.id_usuario = u.id_usuario
      ${userFilter}
      ORDER BY g.fecha DESC
    `).all(...userParams) as Expense[];

    return NextResponse.json({ success: true, data: expenses });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    const body = await request.json();
    const { monto, categoria_id, descripcion, cuenta, origen } = body;
    const finalUserId = userId || body.id_usuario || 1;

    if (!monto || !categoria_id) {
      return NextResponse.json(
        { success: false, error: 'Monto y categoría requeridos' },
        { status: 400 }
      );
    }

    const db = getDb();
    const result = db.prepare(`
      INSERT INTO gastos (id_usuario, monto, categoria_id, descripcion, cuenta, origen)
      VALUES (@id_usuario, @monto, @categoria_id, @descripcion, @cuenta, @origen)
    `).run({
      id_usuario: Number(finalUserId),
      monto: Number(monto),
      categoria_id: Number(categoria_id),
      descripcion: descripcion || '',
      cuenta: cuenta || '-',
      origen: origen || 'Web'
    });

    return NextResponse.json({
      success: true,
      data: { id: result.lastInsertRowid }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
