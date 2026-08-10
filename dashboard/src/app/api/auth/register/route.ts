import { NextResponse } from 'next/server';
import { registerUser } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { nombre, email, password } = await request.json();

    if (!nombre || !email || !password) {
      return NextResponse.json({ success: false, error: 'Todos los campos son requeridos' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ success: false, error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
    }

    const user = registerUser(nombre, email, password);
    const cookieStore = await cookies();

    // Guardar sesión en cookie segura HTTP-Only con sameSite lax
    const sessionData = JSON.stringify({ userId: user.id_usuario, email: user.email, nombre: user.nombre });
    cookieStore.set('spendbot_session', sessionData, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 días
      path: '/'
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Error al registrar usuario' }, { status: 400 });
  }
}
