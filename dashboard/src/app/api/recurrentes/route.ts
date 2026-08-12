import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  getRecurringTransactions,
  createRecurringTransaction,
  toggleRecurringTransaction,
  deleteRecurringTransaction
} from '@/lib/db';

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
    const recurrentes = await getRecurringTransactions(userId || undefined);
    return NextResponse.json({ success: true, data: recurrentes });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    const body = await request.json();
    const { tipo, monto, categoria_id, descripcion, dia_cobro, duracion_meses } = body;

    if (!tipo || !monto || !categoria_id || !descripcion) {
      return NextResponse.json({ success: false, error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    await createRecurringTransaction({
      id_usuario: userId || 1,
      tipo,
      monto: parseFloat(monto),
      categoria_id: parseInt(categoria_id, 10),
      descripcion,
      dia_cobro: dia_cobro ? parseInt(dia_cobro, 10) : 1,
      duracion_meses: duracion_meses ? parseInt(duracion_meses, 10) : null
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID es requerido' }, { status: 400 });
    }
    const userId = await getSessionUserId();
    await toggleRecurringTransaction(parseInt(id, 10), userId || undefined);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID es requerido' }, { status: 400 });
    }
    const userId = await getSessionUserId();
    await deleteRecurringTransaction(parseInt(id, 10), userId || undefined);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
