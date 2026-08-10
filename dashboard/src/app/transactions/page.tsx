import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getDashboardData, getCategories, getUserById } from '@/lib/db';
import TransactionsContent from '@/components/TransactionsContent';
import DashboardLayoutShell from '@/components/DashboardLayoutShell';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function TransactionsPage() {
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

  const data = getDashboardData(user.id_usuario);
  const categories = getCategories();

  return (
    <DashboardLayoutShell user={user}>
      <TransactionsContent initialData={data} categories={categories} />
    </DashboardLayoutShell>
  );
}
