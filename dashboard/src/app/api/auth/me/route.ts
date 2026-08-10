import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserById } from '@/lib/db';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('spendbot_session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ loggedIn: false });
    }

    const parsed = JSON.parse(sessionCookie);
    const user = getUserById(parsed.userId);

    if (!user) {
      return NextResponse.json({ loggedIn: false });
    }

    return NextResponse.json({ loggedIn: true, user });
  } catch {
    return NextResponse.json({ loggedIn: false });
  }
}
