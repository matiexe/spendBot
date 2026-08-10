import { cookies } from 'next/headers';
import { getDashboardData, getUserById } from '@/lib/db';
import FinancialPanel from '@/components/FinancialPanel';
import LandingPage from '@/components/LandingPage';
import DashboardLayoutShell from '@/components/DashboardLayoutShell';

export const revalidate = 0;

export default async function Home() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('spendbot_session')?.value;

  if (!sessionCookie) {
    return <LandingPage />;
  }

  let session: { userId: number; email: string; nombre: string } | null = null;
  try {
    session = JSON.parse(sessionCookie);
  } catch {
    return <LandingPage />;
  }

  const user = session?.userId ? getUserById(session.userId) : null;
  if (!user) {
    return <LandingPage />;
  }

  const data = getDashboardData(user.id_usuario);

  return (
    <DashboardLayoutShell user={user}>
      <FinancialPanel data={data} />
    </DashboardLayoutShell>
  );
}
