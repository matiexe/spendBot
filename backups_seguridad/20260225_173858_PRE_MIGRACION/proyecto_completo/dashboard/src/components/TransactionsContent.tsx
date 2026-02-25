'use client';

import React, { useState } from 'react';
import TransactionsTable from '@/components/TransactionsTable';
import TransactionForm from '@/components/TransactionForm';
import { Plus, Wallet, ArrowDownCircle, ArrowUpCircle, PieChart } from 'lucide-react';

interface TransactionsContentProps {
    initialData: any;
    categories: any[];
}

export default function TransactionsContent({ initialData, categories }: TransactionsContentProps) {
    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    const [data, setData] = useState(initialData);
    const [showModal, setShowModal] = useState(false);

    const refreshData = async () => {
        const res = await fetch('/api/transactions');
        const result = await res.json();
        if (result.success) {
            setData({ ...data, recent: result.data });
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const balance = data.recent.reduce((acc: number, t: any) => acc + t.monto, 0);
    const totalGastos = data.recent.reduce((acc: number, t: any) => t.monto < 0 ? acc + t.monto : acc, 0);
    const totalIngresos = data.recent.reduce((acc: number, t: any) => t.monto > 0 ? acc + t.monto : acc, 0);

    if (!isMounted) return null;


    return (
        <div className="dashboard-container">
            <header className="header glass-panel">
                <div>
                    <h1 className="text-gradient">Transacciones</h1>
                    <p className="subtitle">Historial de gastos e ingresos</p>
                </div>
                <div className="header-actions">
                    <button
                        onClick={() => setShowModal(true)}
                        className="glass-panel"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: 'var(--primary)',
                            color: '#fff',
                            border: 'none',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '12px',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        <Plus size={18} /> Nueva Transacción
                    </button>
                </div>
            </header>

            <div className="metrics-grid">
                <div className="metric-card glass-panel">
                    <div className="metric-icon primary-bg">
                        <Wallet size={24} />
                    </div>
                    <div className="metric-content">
                        <h3>Balance</h3>
                        <p className="metric-value balance">{formatCurrency(balance)}</p>
                    </div>
                </div>

                <div className="metric-card glass-panel">
                    <div className="metric-icon secondary-bg">
                        <ArrowDownCircle size={24} />
                    </div>
                    <div className="metric-content">
                        <h3>Gastos</h3>
                        <p className="metric-value gastos">{formatCurrency(totalGastos)}</p>
                    </div>
                </div>

                <div className="metric-card glass-panel">
                    <div className="metric-icon success-bg">
                        <ArrowUpCircle size={24} />
                    </div>
                    <div className="metric-content">
                        <h3>Ingresos</h3>
                        <p className="metric-value ingresos">{formatCurrency(totalIngresos)}</p>
                    </div>
                </div>

                <div className="metric-card glass-panel">
                    <div className="metric-icon warning-bg">
                        <PieChart size={24} />
                    </div>
                    <div className="metric-content">
                        <h3>Top Categoría</h3>
                        <p className="metric-value">
                            {data.byCategory[0]?.emoji} {data.byCategory[0]?.nombre || 'Hogar'}
                        </p>
                        <span className="metric-subtitle">{formatCurrency(data.byCategory[0]?.total || 0)} total</span>
                    </div>
                </div>
            </div>

            <TransactionsTable transactions={data.recent} />

            {showModal && (
                <TransactionForm
                    categories={categories}
                    onClose={() => setShowModal(false)}
                    onSuccess={refreshData}
                />
            )}
        </div>
    );
}
