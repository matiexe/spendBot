'use client';

import React from 'react';
import { MoreVertical, MessageSquare, Calendar, Send, Globe } from 'lucide-react';

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
            maximumFractionDigits: 2
        }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-AR', { month: 'short', day: 'numeric' });
    };

    if (!isMounted) {
        return (
            <div className="table-responsive glass-panel" style={{ padding: '0 1rem' }}>
                <div style={{ padding: '2rem', textAlign: 'center', color: '#8892b0' }}>
                    Cargando historial de gastos...
                </div>
            </div>
        );
    }

    return (
        <div className="table-responsive glass-panel" style={{ padding: '0 1rem' }}>
            <table className="transactions-table">
                <thead>
                    <tr>
                        <th style={{ width: '40px' }}><input type="checkbox" /></th>
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
                            <td><input type="checkbox" /></td>
                            <td className="date-cell">{formatDate(t.fecha)}</td>
                            <td style={{ fontWeight: 500 }}>{t.descripcion || 'Sin descripción'}</td>
                            <td style={{ textAlign: 'right' }}>
                                <span className={`amount-cell ${t.monto < 0 ? 'monto-negativo' : 'monto-positivo'}`}>
                                    {formatCurrency(t.monto)} ARS
                                </span>
                            </td>
                            <td>
                                <span className="category-badge">
                                    {t.categoriaEmoji} {t.categoriaNombre}
                                </span>
                            </td>
                            <td style={{ color: '#8892b0', fontSize: '0.875rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></div>
                                    {t.cuenta || '-'}
                                </div>
                            </td>
                            <td>
                                <div className="origin-icon" title={t.origen}>
                                    {t.origen === 'Telegram' ? (
                                        <Send size={16} style={{ color: '#0088cc' }} />
                                    ) : t.origen === 'Web' ? (
                                        <Globe size={16} style={{ color: '#818cf8' }} />
                                    ) : (
                                        <Calendar size={16} />
                                    )}
                                </div>
                            </td>
                            <td>
                                <button className="btn-icon">
                                    <MoreVertical size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                    {transactions.length === 0 && (
                        <tr>
                            <td colSpan={8} className="empty-state">No se encontraron transacciones</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
