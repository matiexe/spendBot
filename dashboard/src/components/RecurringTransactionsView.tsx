'use client';

import React, { useState } from 'react';
import {
  Repeat,
  Plus,
  Play,
  Pause,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingDown,
  TrendingUp
} from 'lucide-react';

interface RecurringTransaction {
  id: number;
  tipo: string;
  monto: number;
  categoria_id: number;
  descripcion: string;
  dia_cobro: number;
  duracion_meses: number | null;
  meses_procesados: number;
  activo: number;
  categoriaNombre?: string;
  categoriaEmoji?: string;
}

interface RecurringTransactionsViewProps {
  initialRecurrentes: RecurringTransaction[];
  categories: Array<{ id: number; nombre: string; emoji: string }>;
}

export default function RecurringTransactionsView({
  initialRecurrentes,
  categories
}: RecurringTransactionsViewProps) {
  const [recurrentes, setRecurrentes] = useState<RecurringTransaction[]>(initialRecurrentes || []);
  const [filter, setFilter] = useState<'TODAS' | 'ACTIVAS' | 'PAUSADAS'>('TODAS');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formTipo, setFormTipo] = useState('GASTO');
  const [formMonto, setFormMonto] = useState('');
  const [formCategoria, setFormCategoria] = useState(categories[0]?.id || 1);
  const [formDesc, setFormDesc] = useState('');
  const [formDia, setFormDia] = useState('1');
  const [formDuracion, setFormDuracion] = useState('indefinido');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const refreshRecurrentes = async () => {
    try {
      const res = await fetch('/api/recurrentes');
      const json = await res.json();
      if (json.success) {
        setRecurrentes(json.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleState = async (id: number) => {
    setLoading(true);
    await fetch(`/api/recurrentes?id=${id}`, { method: 'PATCH' });
    await refreshRecurrentes();
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Deseas eliminar esta transacción recurrente?')) return;
    setLoading(true);
    await fetch(`/api/recurrentes?id=${id}`, { method: 'DELETE' });
    await refreshRecurrentes();
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMonto || !formDesc) return;

    setLoading(true);
    let duracionNum: number | null = null;
    if (formDuracion !== 'indefinido') {
      duracionNum = parseInt(formDuracion, 10);
    }

    await fetch('/api/recurrentes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: formTipo,
        monto: parseFloat(formMonto),
        categoria_id: formCategoria,
        descripcion: formDesc,
        dia_cobro: parseInt(formDia, 10),
        duracion_meses: duracionNum
      })
    });

    setShowModal(false);
    setFormDesc('');
    setFormMonto('');
    await refreshRecurrentes();
    setLoading(false);
  };

  const filteredRecurrentes = recurrentes.filter((r) => {
    if (filter === 'ACTIVAS') return r.activo === 1;
    if (filter === 'PAUSADAS') return r.activo === 0;
    return true;
  });

  const totalGastosRecurrentes = recurrentes
    .filter(r => r.activo === 1 && r.tipo === 'GASTO')
    .reduce((acc, r) => acc + r.monto, 0);

  const totalIngresosRecurrentes = recurrentes
    .filter(r => r.activo === 1 && r.tipo === 'INGRESO')
    .reduce((acc, r) => acc + r.monto, 0);

  return (
    <div>
      {/* Resumen KPI Estilo SpendBot Native */}
      <div className="metrics-grid">
        <div className="metric-card glass-panel">
          <div className="metric-icon secondary-bg">
            <TrendingDown size={24} />
          </div>
          <div className="metric-content">
            <h3>Gastos Fijos Mensuales</h3>
            <p className="metric-value monto-negativo">{formatCurrency(totalGastosRecurrentes)}</p>
          </div>
        </div>

        <div className="metric-card glass-panel">
          <div className="metric-icon success-bg">
            <TrendingUp size={24} />
          </div>
          <div className="metric-content">
            <h3>Ingresos Fijos Mensuales</h3>
            <p className="metric-value monto-positivo">{formatCurrency(totalIngresosRecurrentes)}</p>
          </div>
        </div>

        <div className="metric-card glass-panel">
          <div className="metric-icon primary-bg">
            <Repeat size={24} />
          </div>
          <div className="metric-content">
            <h3>Transacciones Programadas</h3>
            <p className="metric-value">
              {recurrentes.filter(r => r.activo === 1).length}
            </p>
            <span className="metric-subtitle">{recurrentes.length} total programadas</span>
          </div>
        </div>
      </div>

      {/* Toolbar de Filtros y Acción Programar */}
      <div className="recent-transactions glass-panel" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setFilter('TODAS')}
              className={`btn-secondary ${filter === 'TODAS' ? 'active' : ''}`}
              style={filter === 'TODAS' ? { background: 'rgba(99, 102, 241, 0.2)', borderColor: 'var(--primary)', color: '#fff' } : {}}
            >
              Todas ({recurrentes.length})
            </button>
            <button
              onClick={() => setFilter('ACTIVAS')}
              className={`btn-secondary ${filter === 'ACTIVAS' ? 'active' : ''}`}
              style={filter === 'ACTIVAS' ? { background: 'rgba(16, 185, 129, 0.2)', borderColor: 'var(--success)', color: '#10b981' } : {}}
            >
              Activas ({recurrentes.filter(r => r.activo === 1).length})
            </button>
            <button
              onClick={() => setFilter('PAUSADAS')}
              className={`btn-secondary ${filter === 'PAUSADAS' ? 'active' : ''}`}
              style={filter === 'PAUSADAS' ? { background: 'rgba(245, 158, 11, 0.2)', borderColor: 'var(--warning)', color: '#fbbf24' } : {}}
            >
              Pausadas ({recurrentes.filter(r => r.activo === 0).length})
            </button>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            <Plus size={18} /> Programar Recurrente
          </button>
        </div>
      </div>

      {/* Grilla de Tarjetas Recurrentes Estilo SpendBot Native */}
      {filteredRecurrentes.length === 0 ? (
        <div className="recent-transactions glass-panel" style={{ textAlign: 'center', padding: '3rem', color: '#8892b0' }}>
          <Clock size={36} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>No se encontraron transacciones recurrentes</h3>
          <p style={{ fontSize: '0.875rem' }}>Presiona "Programar Recurrente" para programar tus alquileres, servicios o sueldos fijados.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {filteredRecurrentes.map((rec) => {
            const isGasto = rec.tipo === 'GASTO';
            const isActivo = rec.activo === 1;
            const durStr = rec.duracion_meses
              ? `Mes ${rec.meses_procesados}/${rec.duracion_meses}`
              : `${rec.meses_procesados} meses (∞ Indefinido)`;

            return (
              <div
                key={rec.id}
                className="glass-panel"
                style={{
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  opacity: isActivo ? 1 : 0.65
                }}
              >
                <div>
                  {/* Encabezado */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span className="category-badge" style={{ background: isGasto ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)', color: isGasto ? '#ef4444' : '#10b981', borderColor: isGasto ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)' }}>
                      {isGasto ? '🔴 GASTO' : '🟢 INGRESO'}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#8892b0' }}>
                      Día {rec.dia_cobro} de c/mes
                    </span>
                  </div>

                  {/* Nombre y Monto */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <h4 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                        {rec.descripcion}
                      </h4>
                      <p style={{ color: '#8892b0', fontSize: '0.85rem' }}>
                        {rec.categoriaEmoji} {rec.categoriaNombre || 'Categoría'}
                      </p>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span className={`amount-cell ${isGasto ? 'monto-negativo' : 'monto-positivo'}`} style={{ fontSize: '1.25rem' }}>
                        {isGasto ? '-' : '+'}{formatCurrency(rec.monto)}
                      </span>
                    </div>
                  </div>

                  {/* Estado / Duración */}
                  <div style={{ padding: '0.75rem 0', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#8892b0' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Clock size={14} style={{ color: '#818cf8' }} />
                      {durStr}
                    </span>

                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: isActivo ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                      {isActivo ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      {isActivo ? 'Activa' : 'Pausada'}
                    </span>
                  </div>
                </div>

                {/* Acciones */}
                <div style={{ paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button
                    disabled={loading}
                    onClick={() => handleToggleState(rec.id)}
                    className="btn-secondary"
                  >
                    {isActivo ? <Pause size={14} style={{ color: '#f59e0b' }} /> : <Play size={14} style={{ color: '#10b981' }} />}
                    <span>{isActivo ? 'Pausar' : 'Activar'}</span>
                  </button>

                  <button
                    disabled={loading}
                    onClick={() => handleDelete(rec.id)}
                    className="btn-secondary"
                    style={{ color: '#ef4444' }}
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Programar Recurrente Estilo Native SpendBot */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Repeat size={20} style={{ color: '#818cf8' }} />
                Programar Recurrente
              </h3>
              <button onClick={() => setShowModal(false)} className="close-btn">✕</button>
            </div>

            <form onSubmit={handleCreate} className="transaction-form">
              <div className="form-group">
                <label>Tipo de Transacción</label>
                <div className="form-row">
                  <button
                    type="button"
                    onClick={() => setFormTipo('GASTO')}
                    className={`type-btn gasto ${formTipo === 'GASTO' ? 'active' : ''}`}
                  >
                    🔴 Gasto Recurrente
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormTipo('INGRESO')}
                    className={`type-btn ingreso ${formTipo === 'INGRESO' ? 'active' : ''}`}
                  >
                    🟢 Ingreso Recurrente
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Alquiler, Netflix, Expensas, Sueldo"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Monto (ARS)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="400000"
                    value={formMonto}
                    onChange={(e) => setFormMonto(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Día de Cobro (1-31)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={formDia}
                    onChange={(e) => setFormDia(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Categoría</label>
                <select
                  value={formCategoria}
                  onChange={(e) => setFormCategoria(parseInt(e.target.value, 10))}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.emoji} {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Duración Periódica</label>
                <select
                  value={formDuracion}
                  onChange={(e) => setFormDuracion(e.target.value)}
                >
                  <option value="indefinido">∞ Indefinida (Todos los meses)</option>
                  <option value="3">3 Meses (3 cuotas)</option>
                  <option value="6">6 Meses (6 cuotas)</option>
                  <option value="12">12 Meses (1 año / 12 cuotas)</option>
                  <option value="24">24 Meses (2 años / 24 cuotas)</option>
                </select>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-cancel"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-submit"
                >
                  Programar Transacción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
