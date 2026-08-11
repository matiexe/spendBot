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
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const balance = data.recent.reduce((acc: number, t: any) => acc + t.monto, 0);
  const totalGastos = data.recent.reduce((acc: number, t: any) => t.monto < 0 ? acc + t.monto : acc, 0);
  const totalIngresos = data.recent.reduce((acc: number, t: any) => t.monto > 0 ? acc + t.monto : acc, 0);

  const hasTopCategory = data.byCategory && data.byCategory.length > 0 && data.byCategory[0]?.total > 0;
  const topCategoryName = hasTopCategory 
    ? `${data.byCategory[0]?.emoji ? data.byCategory[0].emoji + ' ' : ''}${data.byCategory[0]?.nombre}`
    : 'Sin datos';
  const topCategorySubtitle = hasTopCategory 
    ? `${formatCurrency(data.byCategory[0]?.total)} total` 
    : '— Sin registros';

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
        <div className="flex flex-col gap-6">
          {/* KPI Cards con Tipografía y Estructura Unificada */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6" style={{ marginBottom: '1.75rem' }}>
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                <Wallet size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs text-slate-400 font-medium mb-1">Balance</h3>
                <p className="text-2xl font-bold text-white truncate">{formatCurrency(balance)}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
                <ArrowDownCircle size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs text-slate-400 font-medium mb-1">Gastos</h3>
                <p className="text-2xl font-bold text-rose-400 truncate">{formatCurrency(totalGastos)}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <ArrowUpCircle size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs text-slate-400 font-medium mb-1">Ingresos</h3>
                <p className="text-2xl font-bold text-emerald-400 truncate">{formatCurrency(totalIngresos)}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                <PieChart size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs text-slate-400 font-medium mb-1">Top Categoría</h3>
                <p className="text-2xl font-bold text-white truncate">{topCategoryName}</p>
                <span className="text-xs text-slate-500 mt-1 block truncate">{topCategorySubtitle}</span>
              </div>
            </div>
          </div>

          <div className="mt-6" style={{ marginTop: '1.75rem' }}>
            <TransactionsTable
              transactions={data.recent}
              categories={categories}
              onNewTransaction={() => setShowModal(true)}
            />
          </div>
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
