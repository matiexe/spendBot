'use client';

import React, { useState } from 'react';
import { MoreVertical, Send, Globe, Calendar, Repeat, Search, Receipt, Plus } from 'lucide-react';

interface Expense {
  id: number;
  id_usuario: number;
  monto: number;
  categoria_id: number;
  descripcion: string;
  fecha: string;
  cuenta: string;
  origen: string;
  categoriaEmoji?: string;
  categoriaNombre?: string;
  usuarioNombre?: string;
}

interface TransactionsTableProps {
  transactions: Expense[];
  categories?: any[];
  onNewTransaction?: () => void;
}

export default function TransactionsTable({ transactions, categories = [], onNewTransaction }: TransactionsTableProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [originFilter, setOriginFilter] = useState('ALL');

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.split(' ')[0];
      if (datePart) {
        const parts = datePart.split('-');
        if (parts.length === 3) {
          const [, month, day] = parts;
          const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
          const monthIdx = parseInt(month, 10) - 1;
          if (monthIdx >= 0 && monthIdx < 12) {
            return `${parseInt(day, 10)} ${months[monthIdx]}`;
          }
        }
      }
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-AR', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Filtrado dinámico de transacciones
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = t.descripcion?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.categoriaNombre?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'ALL' || t.categoriaNombre === categoryFilter || String(t.categoria_id) === categoryFilter;
    
    const matchesOrigin = originFilter === 'ALL' || 
                          (t.origen || 'Telegram').toLowerCase() === originFilter.toLowerCase() ||
                          (t.cuenta || 'Principal').toLowerCase() === originFilter.toLowerCase();

    return matchesSearch && matchesCategory && matchesOrigin;
  });

  if (!isMounted) {
    return (
      <div className="recent-transactions glass-panel">
        <div style={{ padding: '2rem', textAlign: 'center', color: '#8892b0' }}>
          Cargando historial de transacciones...
        </div>
      </div>
    );
  }

  return (
    <div className="recent-transactions glass-panel">
      {/* Reemplazo Absoluto: Buscador y Barra de Filtros */}
      <div className="w-full flex flex-col md:flex-row items-center gap-3 my-4">
        {/* Input de Búsqueda */}
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Buscar por descripción..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        {/* Selects */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full md:w-48 px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-purple-500 cursor-pointer"
          >
            <option value="ALL" className="bg-slate-900 text-white">Todas las categorías</option>
            {categories.map((cat: any) => (
              <option key={cat.id_categoria || cat.id} value={cat.nombre} className="bg-slate-900 text-white">
                {cat.emoji ? `${cat.emoji} ` : ''}{cat.nombre}
              </option>
            ))}
          </select>

          <select
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value)}
            className="w-full md:w-52 px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-purple-500 cursor-pointer"
          >
            <option value="ALL" className="bg-slate-900 text-white">Todas las cuentas / origen</option>
            <option value="Telegram" className="bg-slate-900 text-white">Telegram</option>
            <option value="Web" className="bg-slate-900 text-white">Web</option>
            <option value="Recurrente" className="bg-slate-900 text-white">Recurrente</option>
            <option value="Principal" className="bg-slate-900 text-white">Cuenta Principal</option>
          </select>
        </div>
      </div>

      <div className="table-responsive">
        <table className="transactions-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Descripción</th>
              <th style={{ textAlign: 'right' }}>Monto</th>
              <th>Categoría</th>
              <th>Cuenta</th>
              <th>Origen</th>
              <th style={{ width: '40px' }}></th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((t) => (
              <tr key={t.id}>
                <td className="date-cell" suppressHydrationWarning>{formatDate(t.fecha)}</td>
                <td style={{ fontWeight: 500, color: '#fff' }}>{t.descripcion || 'Sin descripción'}</td>
                <td style={{ textAlign: 'right' }}>
                  <span className={`amount-cell ${t.monto < 0 ? 'monto-negativo' : 'monto-positivo'}`}>
                    {formatCurrency(t.monto)}
                  </span>
                </td>
                <td>
                  <span className="category-badge">
                    {t.categoriaEmoji} {t.categoriaNombre || 'General'}
                  </span>
                </td>
                <td style={{ color: '#8892b0', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></div>
                    {t.cuenta || 'Principal'}
                  </div>
                </td>
                <td>
                  <div className="origin-icon" title={t.origen} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#8892b0', fontSize: '0.85rem' }}>
                    {t.origen === 'Telegram' ? (
                      <Send size={15} style={{ color: '#0088cc' }} />
                    ) : t.origen === 'Recurrente' ? (
                      <Repeat size={15} style={{ color: '#ec4899' }} />
                    ) : t.origen === 'Web' ? (
                      <Globe size={15} style={{ color: '#818cf8' }} />
                    ) : (
                      <Calendar size={15} />
                    )}
                    <span>{t.origen || 'Telegram'}</span>
                  </div>
                </td>
                <td>
                  <button className="btn-secondary" style={{ padding: '0.4rem 0.6rem', border: 'none', background: 'transparent' }}>
                    <MoreVertical size={16} />
                  </button>
                </td>
              </tr>
            ))}

            {/* Empty State (Estado Vacío - Snippet Exacto) */}
            {filteredTransactions.length === 0 && (
              <tr>
                <td colSpan={7} className="py-4">
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <div className="p-3 bg-slate-800/50 rounded-xl mb-3 text-purple-400">
                      <Receipt className="h-6 w-6"/>
                    </div>
                    <h3 className="text-base font-semibold text-white mb-1">
                      No se encontraron transacciones en este período
                    </h3>
                    <p className="text-sm text-slate-400 max-w-sm mb-6">
                      Probá ajustando la búsqueda por texto o cambiando los filtros de categoría u origen.
                    </p>
                    {onNewTransaction && (
                      <button
                        onClick={onNewTransaction}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
                      >
                        <Plus className="h-4 w-4"/>
                        <span>Registrar transacción</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
