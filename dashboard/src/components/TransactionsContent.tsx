'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import TransactionsTable from '@/components/TransactionsTable';
import TransactionForm from '@/components/TransactionForm';
import RecurringTransactionsView from '@/components/RecurringTransactionsView';
import { Plus, Wallet, ArrowDownCircle, ArrowUpCircle, PieChart, History, Repeat } from 'lucide-react';

interface TransactionsContentProps {
  initialData: any;
  categories: any[];
}

export default function TransactionsContent({ initialData, categories }: TransactionsContentProps) {
  const [isMounted, setIsMounted] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get('tab') || 'historial';
  const [activeTab, setActiveTab] = useState<'historial' | 'recurrentes'>(
    tabParam === 'recurrentes' ? 'recurrentes' : 'historial'
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (tabParam === 'recurrentes') {
      setActiveTab('recurrentes');
    } else {
      setActiveTab('historial');
    }
  }, [tabParam]);

  const handleTabChange = (tab: 'historial' | 'recurrentes') => {
    setActiveTab(tab);
    if (tab === 'recurrentes') {
      router.push('/transactions?tab=recurrentes');
    } else {
      router.push('/transactions');
    }
  };

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
    <div className="space-y-6">
      {/* Header Principal de la Vista */}
      <header className="dash-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-gradient font-black text-2xl sm:text-3xl">Transacciones</h1>
          <p className="subtitle text-sm text-[#8892b0] mt-1">Historial de gastos y programa de transacciones recurrentes</p>
        </div>

        {activeTab === 'historial' && (
          <div className="header-actions">
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary"
            >
              <Plus size={18} /> Nueva Transacción
            </button>
          </div>
        )}
      </header>

      {/* Pestañas de Sub-Navegación con Botones Nativo SpendBot */}
      <div className="tab-nav">
        <button
          onClick={() => handleTabChange('historial')}
          className={`tab-btn ${activeTab === 'historial' ? 'active' : ''}`}
        >
          <History size={18} />
          <span>Historial de Transacciones</span>
        </button>

        <button
          onClick={() => handleTabChange('recurrentes')}
          className={`tab-btn ${activeTab === 'recurrentes' ? 'active' : ''}`}
        >
          <Repeat size={18} />
          <span>Transacciones Recurrentes</span>
        </button>
      </div>

      {/* Pestañas de Contenido */}
      {activeTab === 'historial' ? (
        <div>
          <div className="metrics-grid">
            <div className="metric-card glass-panel">
              <div className="metric-icon primary-bg">
                <Wallet size={24} />
              </div>
              <div className="metric-content">
                <h3>Balance</h3>
                <p className="metric-value">{formatCurrency(balance)}</p>
              </div>
            </div>

            <div className="metric-card glass-panel">
              <div className="metric-icon secondary-bg">
                <ArrowDownCircle size={24} />
              </div>
              <div className="metric-content">
                <h3>Gastos</h3>
                <p className="metric-value monto-negativo">{formatCurrency(totalGastos)}</p>
              </div>
            </div>

            <div className="metric-card glass-panel">
              <div className="metric-icon success-bg">
                <ArrowUpCircle size={24} />
              </div>
              <div className="metric-content">
                <h3>Ingresos</h3>
                <p className="metric-value monto-positivo">{formatCurrency(totalIngresos)}</p>
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
        </div>
      ) : (
        <RecurringTransactionsView
          initialRecurrentes={data.recurrentes || []}
          categories={categories}
        />
      )}

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
