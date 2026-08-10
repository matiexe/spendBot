'use client';

import React from 'react';
import { MoreVertical, Send, Globe, Calendar, Repeat } from 'lucide-react';

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
}

export default function TransactionsTable({ transactions }: TransactionsTableProps) {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
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
            {transactions.map((t) => (
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
            {transactions.length === 0 && (
              <tr>
                <td colSpan={7} className="empty-state">No se encontraron transacciones</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
