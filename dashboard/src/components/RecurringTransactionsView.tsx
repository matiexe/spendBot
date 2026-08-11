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
  TrendingUp,
  Calendar
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

  // Formato Monetario Uniforme con 2 Decimales ($ 0,00)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
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
    <div className="flex flex-col gap-6">
      {/* 1. KPI Cards con Tipografía Unificada y Espaciado Inferior Respirable */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6" style={{ marginBottom: '1.75rem' }}>
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
            <TrendingDown size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs text-slate-400 font-medium mb-1">Gastos Fijos Mensuales</h3>
            <p className="text-2xl font-bold text-rose-400 truncate">{formatCurrency(totalGastosRecurrentes)}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs text-slate-400 font-medium mb-1">Ingresos Fijos Mensuales</h3>
            <p className="text-2xl font-bold text-emerald-400 truncate">{formatCurrency(totalIngresosRecurrentes)}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
            <Repeat size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs text-slate-400 font-medium mb-1">Transacciones Programadas</h3>
            <p className="text-2xl font-bold text-white truncate">
              {recurrentes.filter(r => r.activo === 1).length}
            </p>
            <span className="text-xs text-slate-500 mt-1 block truncate">{recurrentes.length} total programadas</span>
          </div>
        </div>
      </div>

      {/* 2. Barra de Filtros y Acción Programar con Espaciado Respirable */}
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-3 mb-6 p-1 bg-slate-900/30 rounded-xl border border-slate-800/80 p-3">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setFilter('TODAS')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filter === 'TODAS'
                ? 'bg-purple-600/20 border border-purple-500/40 text-purple-300 shadow-sm'
                : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Todas ({recurrentes.length})
          </button>
          <button
            onClick={() => setFilter('ACTIVAS')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filter === 'ACTIVAS'
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-sm'
                : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Activas ({recurrentes.filter(r => r.activo === 1).length})
          </button>
          <button
            onClick={() => setFilter('PAUSADAS')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filter === 'PAUSADAS'
                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400 shadow-sm'
                : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Pausadas ({recurrentes.filter(r => r.activo === 0).length})
          </button>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="w-full md:w-auto px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105"
        >
          <Plus size={16} />
          <span>Programar Recurrente</span>
        </button>
      </div>

      {/* 3. Empty State o Grilla de Tarjetas Recurrentes */}
      {filteredRecurrentes.length === 0 ? (
        /* Empty State con Contenedor Vertical Estricto (Sin superposición) */
        <div className="w-full rounded-2xl bg-slate-900/40 border border-slate-800/80 my-2">
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              padding: '3rem 1rem',
              textAlign: 'center'
            }}
            className="w-full flex flex-col items-center justify-center py-12 px-4 text-center gap-4"
          >
            <div className="p-3 bg-purple-950/40 border border-purple-800/30 rounded-xl mb-1 text-purple-400">
              <Clock className="w-6 h-6 text-purple-400" />
            </div>

            <h3 className="text-base font-semibold text-white mb-1">
              No se encontraron transacciones recurrentes
            </h3>

            <p
              style={{ marginBottom: '1.5rem' }}
              className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed"
            >
              Presioná "Programar Recurrente" para programar tus alquileres, servicios o sueldos fijados.
            </p>

            <button
              onClick={() => setShowModal(true)}
              style={{ marginTop: '0.5rem', display: 'inline-flex' }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 mt-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Programar Recurrente</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {filteredRecurrentes.map((rec) => {
            const isGasto = rec.tipo === 'GASTO';
            const isActivo = rec.activo === 1;
            const durStr = rec.duracion_meses
              ? `Mes ${rec.meses_procesados}/${rec.duracion_meses}`
              : `${rec.meses_procesados} meses (∞ Indefinido)`;

            return (
              <div
                key={rec.id}
                className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col justify-between transition-all hover:border-slate-700 shadow-sm"
                style={{ opacity: isActivo ? 1 : 0.7 }}
              >
                <div>
                  {/* Encabezado */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold tracking-wider border ${
                      isGasto ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    }`}>
                      {isGasto ? '🔴 GASTO' : '🟢 INGRESO'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Día {rec.dia_cobro} de c/mes
                    </span>
                  </div>

                  {/* Nombre y Monto */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h4 className="text-base font-bold text-white mb-0.5">
                        {rec.descripcion}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {rec.categoriaEmoji ? `${rec.categoriaEmoji} ` : ''}{rec.categoriaNombre || 'Categoría'}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className={`text-lg font-bold ${isGasto ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {isGasto ? '-' : '+'}{formatCurrency(rec.monto)}
                      </span>
                    </div>
                  </div>

                  {/* Estado / Duración */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} className="text-indigo-400" />
                      <span>{durStr}</span>
                    </span>

                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      isActivo ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    }`}>
                      {isActivo ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                      <span>{isActivo ? 'Activa' : 'Pausada'}</span>
                    </span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                  <button
                    disabled={loading}
                    onClick={() => handleToggleState(rec.id)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-white text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {isActivo ? <Pause size={14} className="text-amber-400" /> : <Play size={14} className="text-emerald-400" />}
                    <span>{isActivo ? 'Pausar' : 'Activar'}</span>
                  </button>

                  <button
                    disabled={loading}
                    onClick={() => handleDelete(rec.id)}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors cursor-pointer"
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

      {/* Modal Programar Recurrente */}
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
