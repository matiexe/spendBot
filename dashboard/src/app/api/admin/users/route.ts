import { NextResponse } from 'next/server';
import { getAdminStats } from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('spendbot_session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const stats = getAdminStats();
    return NextResponse.json({ success: true, data: stats });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Error al obtener datos administrativos' }, { status: 500 });
  }
}
