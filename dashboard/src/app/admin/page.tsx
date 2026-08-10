import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAdminStats, getUserById } from '@/lib/db';
import AdminDashboardContent from '@/components/AdminDashboardContent';
import DashboardLayoutShell from '@/components/DashboardLayoutShell';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('spendbot_session')?.value;

  if (!sessionCookie) {
    redirect('/login');
  }

  let session: { userId: number; email: string; nombre: string } | null = null;
  try {
    session = JSON.parse(sessionCookie);
  } catch {
    redirect('/login');
  }

  const user = session?.userId ? getUserById(session.userId) : null;
  if (!user) {
    redirect('/login');
  }

  const stats = getAdminStats();

  return (
    <DashboardLayoutShell user={user}>
      <AdminDashboardContent stats={stats} />
    </DashboardLayoutShell>
  );
}
