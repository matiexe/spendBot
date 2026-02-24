import { getDashboardData } from '@/lib/db';
import DashboardClient from '@/components/DashboardClient';

export const revalidate = 0;

export default async function Home() {
  const data = getDashboardData();

  return (
    <main>
      <DashboardClient data={data} />
    </main>
  );
}
