'use client';

import React, { useState } from 'react';
import { MoreVertical, Send, Globe, Calendar, Repeat, Search, ChevronDown, Receipt, Plus } from 'lucide-react';

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
      {/* Toolbar de Búsqueda y Filtros */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-5 pb-4 border-b border-white/10">
        {/* Campo de búsqueda por texto */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8892b0]" size={15} />
          <input
            type="text"
            placeholder="Buscar por descripción..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/12 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-[#8892b0] focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Selector Desplegable de Categorías */}
          <div className="relative flex-1 sm:flex-initial min-w-[160px]">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-black/40 border border-white/12 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all appearance-none pr-8 cursor-pointer font-medium"
            >
              <option value="ALL" className="bg-[#181920] text-white">Todas las categorías</option>
              {categories.map((cat: any) => (
                <option key={cat.id_categoria || cat.id} value={cat.nombre} className="bg-[#181920] text-white">
                  {cat.emoji ? `${cat.emoji} ` : ''}{cat.nombre}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8892b0] pointer-events-none" size={14} />
          </div>

          {/* Selector Desplegable de Cuenta / Origen */}
          <div className="relative flex-1 sm:flex-initial min-w-[160px]">
            <select
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value)}
              className="w-full bg-black/40 border border-white/12 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all appearance-none pr-8 cursor-pointer font-medium"
            >
              <option value="ALL" className="bg-[#181920] text-white">Todas las cuentas / origen</option>
              <option value="Telegram" className="bg-[#181920] text-white">Telegram</option>
              <option value="Web" className="bg-[#181920] text-white">Web</option>
              <option value="Recurrente" className="bg-[#181920] text-white">Recurrente</option>
              <option value="Principal" className="bg-[#181920] text-white">Cuenta Principal</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8892b0] pointer-events-none" size={14} />
          </div>
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

            {/* Empty State Ilustrado y Centrado */}
            {filteredTransactions.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 px-4 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#8892b0] shadow-inner">
                      <Receipt size={28} className="opacity-60 text-indigo-400" />
                    </div>
                    <div className="space-y-1 max-w-sm">
                      <p className="text-sm font-extrabold text-white">No se encontraron transacciones en este período</p>
                      <p className="text-xs text-[#8892b0]">Probá ajustando la búsqueda por texto o cambiando los filtros de categoría u origen.</p>
                    </div>
                    {onNewTransaction && (
                      <button
                        onClick={onNewTransaction}
                        className="mt-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-white/15 transition-all inline-flex items-center gap-2 cursor-pointer shadow-md hover:scale-105"
                      >
                        <Plus size={15} className="text-indigo-400" />
                        <span>+ Registrar transacción</span>
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
