import { getDashboardData, getCategories } from '@/lib/db';
import TransactionsContent from '@/components/TransactionsContent';

export const revalidate = 0;

export default async function TransactionsPage() {
    const data = getDashboardData();
    const categories = getCategories();

    return (
        <>
            <TransactionsContent initialData={data} categories={categories} />
        </>
    );
}
