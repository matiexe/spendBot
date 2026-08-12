import { NextResponse } from 'next/server';
import { getAllTransactions, queryDb, Expense } from '@/lib/db';
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
    const expenses = await getAllTransactions(userId || undefined);
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

    const result = await queryDb(`
      INSERT INTO gastos (id_usuario, monto, categoria_id, descripcion, cuenta, origen)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      Number(finalUserId),
      Number(monto),
      Number(categoria_id),
      descripcion || '',
      cuenta || '-',
      origen || 'Web'
    ]);

    return NextResponse.json({
      success: true,
      data: { id: result[0]?.id || result[0]?.lastInsertRowid }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
