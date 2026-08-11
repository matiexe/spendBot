'use client';

import React from 'react';
import {
  Calendar,
  Settings,
  ChevronDown,
  Filter,
  ArrowUpRight,
  Landmark,
  Key,
  CreditCard,
  ShoppingBag,
  Zap,
  Repeat,
  Receipt,
  Inbox
} from 'lucide-react';

interface FinancialPanelProps {
  data?: {
    total: number;
    totalMonth: number;
    totalPrevMonth: number;
    percentChange: number;
    dateRangeStr: string;
    monthsList: Array<{ name: string; year: number; total: number }>;
    byCategory: Array<{ nombre: string; emoji: string; total: number }>;
    recent: Array<{
      id: number;
      monto: number;
      descripcion: string;
      fecha: string;
      cuenta: string;
      origen: string;
      tipo?: string;
      categoriaNombre?: string;
      categoriaEmoji?: string;
      usuarioNombre?: string;
    }>;
    totalCount: number;
    userCount: number;
  };
}

export default function FinancialPanel({ data }: FinancialPanelProps) {
  // Formateador de moneda en ARS
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const dateRange = data?.dateRangeStr || 'Período Actual';
  const totalMonthVal = data?.totalMonth ?? 0;
  const percentChangeVal = data?.percentChange ?? 0;
  const totalHistoricalVal = data?.total ?? 0;

  // Helper para asignar icono según categoría o nombre
  const getCategoryIcon = (catName?: string, desc?: string) => {
    const text = `${catName || ''} ${desc || ''}`.toLowerCase();
    if (text.includes('prestamo') || text.includes('banco') || text.includes('finanz')) {
      return <Landmark className="w-4 h-4 text-indigo-400" />;
    }
    if (text.includes('alquiler') || text.includes('vivienda') || text.includes('hogar')) {
      return <Key className="w-4 h-4 text-amber-400" />;
    }
    if (text.includes('comida') || text.includes('super') || text.includes('aliment')) {
      return <ShoppingBag className="w-4 h-4 text-emerald-400" />;
    }
    if (text.includes('transporte') || text.includes('auto') || text.includes('servicio') || text.includes('luz')) {
      return <Zap className="w-4 h-4 text-cyan-400" />;
    }
    if (text.includes('tarjeta') || text.includes('credito') || text.includes('debito')) {
      return <CreditCard className="w-4 h-4 text-rose-400" />;
    }
    return <Receipt className="w-4 h-4 text-purple-400" />;
  };

  const rawMonths = data?.monthsList || [];
  const maxMonthVal = Math.max(...rawMonths.map(m => m.total), 1);

  const monthsData = rawMonths.map((m, idx) => {
    let type: 'stable-green' | 'positive-green' | 'negative-red' = 'stable-green';
    if (m.total === 0) {
      type = 'stable-green';
    } else if (idx === rawMonths.length - 1) {
      type = 'positive-green';
    } else {
      type = 'negative-red';
    }
    const heightPct = maxMonthVal > 0 ? Math.min(100, Math.max(12, Math.round((m.total / maxMonthVal) * 90))) : 12;
    return {
      name: m.name,
      type,
      value: m.total,
      heightPct: type === 'negative-red' ? -heightPct : heightPct
    };
  });

  const transactions = data?.recent || [];

  return (
    <div className="flex flex-col gap-8 antialiased pb-12">
      {/* 1. CONFIGURACIÓN GENERAL (Encabezado) */}
      <header className="dash-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-gradient font-black text-2xl sm:text-3xl">Panel Financiero</h1>
          <p className="subtitle text-sm text-[#8892b0] mt-1">Gestión y análisis de rendimiento mensual</p>
        </div>

        <div className="flex items-center gap-3.5 w-full sm:w-auto justify-end">
          <button className="flex items-center gap-2.5 bg-white/5 hover:bg-white/10 text-[#eef2ff] text-xs sm:text-sm font-semibold px-4.5 py-2.5 rounded-full border border-white/10 transition-all shadow-sm cursor-pointer backdrop-blur-md">
            <Calendar className="w-4 h-4 text-[#8892b0]" />
            <span>{dateRange}</span>
          </button>

          <button
            aria-label="Configuración"
            className="p-2.5 bg-white/5 hover:bg-white/10 text-[#8892b0] hover:text-white rounded-full border border-white/10 transition-all cursor-pointer shadow-sm backdrop-blur-md"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* CUADRÍCULA PRINCIPAL (GRID 2 COLUMNAS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 2. SECCIÓN DE BALANCE (Columna Izquierda - Ancha) */}
        <div className="lg:col-span-2 dash-card flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex justify-between items-center mb-6">
              <button className="flex items-center gap-2.5 text-xl font-bold text-white hover:text-[#818cf8] transition-colors cursor-pointer">
                <span>Balance</span>
                <ChevronDown className="w-5 h-5 text-[#8892b0]" />
              </button>
              
              <button
                aria-label="Filtrar"
                className="p-2.5 text-[#8892b0] hover:text-white bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all cursor-pointer"
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 mb-8">
              <div className="flex flex-wrap items-baseline gap-3.5">
                <span className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#ef4444] font-mono">
                  {formatCurrency(totalMonthVal)}
                </span>
                
                {percentChangeVal !== 0 && (
                  <span className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold leading-none ${percentChangeVal >= 0 ? 'bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30' : 'bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/30'}`}>
                    ↗ {percentChangeVal >= 0 ? `+${percentChangeVal}%` : `${percentChangeVal}%`}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-[#8892b0] font-medium">
                Gastos del mes actual vs. período anterior
              </p>
            </div>

            {/* Gráfico de Barras de Rendimiento Mensual con Datos Reales */}
            <div className="mt-8 relative pt-6 pb-2">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-semibold text-[#8892b0] uppercase tracking-wider">
                  Rendimiento Mensual
                </span>
                <span className="text-xs text-[#8892b0]/70">Perspectiva 13 Meses</span>
              </div>

              <div className="absolute top-[52%] left-0 right-0 border-b border-dashed border-white/10 z-0" />

              {totalHistoricalVal > 0 && (
                <div className="absolute top-[38%] right-0 transform translate-y-[-50%] bg-[#ef4444]/20 border border-[#ef4444]/40 text-[#ef4444] text-[10px] sm:text-xs font-mono font-semibold px-3 py-1.5 rounded-lg shadow-lg backdrop-blur-md z-20 inline-flex items-center justify-center leading-none">
                  -{formatCurrency(totalHistoricalVal).split(',')[0]}
                </div>
              )}

              <div className="h-52 sm:h-56 w-full flex items-center justify-between gap-1.5 sm:gap-2.5 relative z-10 pt-4 pb-2 px-1 sm:px-2">
                {monthsData.map((item, idx) => {
                  const isPositiveBar = item.type === 'positive-green';
                  const isStableBar = item.type === 'stable-green';
                  const isNegativeBar = item.type === 'negative-red';

                  return (
                    <div
                      key={`${item.name}-${idx}`}
                      className="flex-1 flex flex-col items-center h-full justify-center group relative"
                    >
                      <div className="absolute -top-9 hidden group-hover:flex bg-[#1e2029] border border-white/10 text-white text-[10px] px-2.5 py-1 rounded-lg font-mono shadow-xl z-30 whitespace-nowrap">
                        {item.name}: {item.value > 0 ? formatCurrency(item.value) : `$0`}
                      </div>

                      <div className="w-full h-1/2 flex items-end justify-center pb-[1px]">
                        {isStableBar && (
                          <div className="w-full sm:w-3/4 h-[3px] bg-[#10b981] rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        )}
                        {isPositiveBar && (
                          <div className="w-2.5 sm:w-3.5 bg-[#10b981] rounded-t-md h-[75%] transition-all duration-300 group-hover:brightness-125 shadow-[0_0_14px_rgba(16,185,129,0.5)]" />
                        )}
                      </div>

                      <div className="w-full h-1/2 flex items-start justify-center pt-[1px]">
                        {isNegativeBar && (
                          <div
                            style={{ height: `${Math.abs(item.heightPct)}%` }}
                            className="w-2.5 sm:w-3.5 bg-[#ef4444] rounded-b-md transition-all duration-300 group-hover:brightness-125 shadow-[0_0_14px_rgba(239,68,68,0.4)]"
                          />
                        )}
                      </div>

                      <span className="mt-2 text-[10px] sm:text-xs text-[#8892b0] font-medium group-hover:text-white transition-colors">
                        {item.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 3. SECCIÓN ÚLTIMAS TRANSACCIONES (Columna Derecha - Estrecha con Datos Reales) */}
        <div className="dash-card flex flex-col justify-between min-h-[380px]">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white tracking-wide">
                Últimas transacciones
              </h2>
              <a
                href="/transactions"
                className="p-2.5 text-[#8892b0] hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer border border-white/5"
                title="Ver transacciones"
              >
                <ArrowUpRight className="w-4 h-4 text-white" />
              </a>
            </div>

            {transactions.length > 0 ? (
              <div className="divide-y divide-white/5 space-y-1">
                {transactions.map((tx: any, index: number) => {
                  const catName = tx.categoriaNombre || 'Gasto';
                  const desc = tx.descripcion || catName;

                  return (
                    <div
                      key={tx.id || index}
                      className="py-3.5 flex items-center justify-between gap-3.5 group hover:bg-white/[0.04] px-2 rounded-xl transition-all cursor-pointer"
                    >
                      <div className="p-2.5 bg-white/5 group-hover:bg-white/10 rounded-xl border border-white/5 transition-all flex-shrink-0">
                        {getCategoryIcon(catName, desc)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-[#eef2ff] truncate group-hover:text-white transition-colors">
                          {desc}
                        </p>
                        <p className="text-[11px] text-[#8892b0] font-medium truncate">
                          {tx.categoriaEmoji ? `${tx.categoriaEmoji} ` : ''}{catName}
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-xs sm:text-sm font-bold text-[#ef4444] font-mono">
                            {formatCurrency(tx.monto)}
                          </span>
                        </div>
                      </div>

                      <div className="flex-shrink-0 pl-1">
                        <Repeat className="w-4 h-4 text-[#8892b0] group-hover:text-white transition-colors" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-[#8892b0] space-y-2">
                <Inbox className="w-10 h-10 mx-auto text-[#8892b0]/40 mb-2" />
                <p className="text-sm font-bold text-white">Sin transacciones registradas</p>
                <p className="text-xs text-[#8892b0]">
                  Tus gastos ingresados por Telegram o desde la web aparecerán acá en tiempo real.
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-[#8892b0]">
            <span>{transactions.length} transacciones registradas</span>
            <a href="/transactions" className="text-[#818cf8] font-semibold hover:underline cursor-pointer">
              Ver historial completo
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
