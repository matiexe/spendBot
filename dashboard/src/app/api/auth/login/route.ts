import { NextResponse } from 'next/server';
import { loginUser } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email y contraseña requeridos.' }, { status: 400 });
    }

    const user = loginUser(email, password);
    const cookieStore = await cookies();

    const sessionData = JSON.stringify({
      userId: user.id_usuario,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol
    });
    
    // Cookie de sesión persistente con sameSite lax y path global /
    cookieStore.set('spendbot_session', sessionData, {
      httpOnly: true,
      secure: false, // Permite persistencia segura tanto en localhost como en proxies HTTP de Render/Railway
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 días
      path: '/'
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Error al iniciar sesión' }, { status: 401 });
  }
}
