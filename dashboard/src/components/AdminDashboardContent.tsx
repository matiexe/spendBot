'use client';

import React, { useState } from 'react';
import {
  Users,
  ShieldCheck,
  Send,
  AlertTriangle,
  Search,
  CheckCircle2,
  Mail,
  TrendingUp,
  UserCheck,
  Shield
} from 'lucide-react';

interface AdminDashboardContentProps {
  stats: {
    totalUsers: number;
    linkedUsers: number;
    unlinkedUsers: number;
    totalTransactions: number;
    totalVolume: number;
    users: Array<{
      id_usuario: number;
      nombre: string;
      email: string | null;
      telegram_id: number | null;
      token_vinculacion: string | null;
      rol: string;
      fecha_creacion: string;
      totalTransacciones: number;
      totalGastos: number;
    }>;
  };
}

export default function AdminDashboardContent({ stats }: AdminDashboardContentProps) {
  const [searchTerm, setSearchTerm] = useState('');

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
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const filteredUsers = (stats?.users || []).filter(u => {
    const term = (searchTerm || '').toLowerCase();
    const nameStr = (u.nombre || '').toLowerCase();
    const emailStr = (u.email || '').toLowerCase();
    const tokenStr = (u.token_vinculacion || '').toLowerCase();
    return (
      nameStr.includes(term) ||
      emailStr.includes(term) ||
      tokenStr.includes(term)
    );
  });

  return (
    <div className="flex flex-col gap-6 antialiased pb-8">
      {/* 1. HEADER PRINCIPAL (Compact SaaS Header) */}
      <header className="dash-card p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Administración de Plataforma
          </h1>
          <p className="text-xs text-[#8892b0] mt-0.5 font-medium">
            Gestión global de usuarios registrados, correos electrónicos y métricas del sistema
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold leading-none">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Sistema Operativo</span>
          </div>
        </div>
      </header>

      {/* 2. CARDS DE MÉTRICAS (Compact 4-Card SaaS Grid) */}
      <div className="metrics-grid">
        {/* Total Usuarios */}
        <div className="metric-card p-4 flex items-center justify-between transition-all hover:border-white/15">
          <div>
            <span className="text-xs font-semibold text-[#8892b0] uppercase tracking-wider block">
              Total Usuarios
            </span>
            <p className="text-2xl font-extrabold text-white font-mono mt-0.5 leading-none">
              {stats.totalUsers}
            </p>
            <span className="text-[11px] text-[#8892b0] mt-1 block">
              Usuarios registrados
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 flex items-center justify-center flex-shrink-0">
            <Users size={20} />
          </div>
        </div>

        {/* Vinculados Telegram */}
        <div className="metric-card p-4 flex items-center justify-between transition-all hover:border-white/15">
          <div>
            <span className="text-xs font-semibold text-[#8892b0] uppercase tracking-wider block">
              Vinculados Telegram
            </span>
            <p className="text-2xl font-extrabold text-emerald-400 font-mono mt-0.5 leading-none">
              {stats.linkedUsers}
            </p>
            <span className="text-[11px] text-[#8892b0] mt-1 block">
              Usuarios vinculados
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 flex items-center justify-center flex-shrink-0">
            <UserCheck size={20} />
          </div>
        </div>

        {/* Pendientes Telegram */}
        <div className={`metric-card p-4 flex items-center justify-between transition-all ${stats.unlinkedUsers > 0 ? 'border-amber-500/40 bg-amber-500/[0.02]' : 'hover:border-white/15'}`}>
          <div>
            <span className="text-xs font-semibold text-[#8892b0] uppercase tracking-wider block">
              Pendientes Telegram
            </span>
            <p className="text-2xl font-extrabold text-amber-400 font-mono mt-0.5 leading-none">
              {stats.unlinkedUsers}
            </p>
            <span className={`text-[11px] mt-1 block font-semibold ${stats.unlinkedUsers > 0 ? 'text-amber-400' : 'text-[#8892b0]'}`}>
              {stats.unlinkedUsers > 0 ? 'Requiere atención' : 'Sin pendientes'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} />
          </div>
        </div>

        {/* Volumen Operado */}
        <div className="metric-card p-4 flex items-center justify-between transition-all hover:border-white/15">
          <div>
            <span className="text-xs font-semibold text-[#8892b0] uppercase tracking-wider block">
              Volumen operado
            </span>
            <p className="text-xl sm:text-2xl font-extrabold text-white font-mono mt-0.5 leading-none">
              {formatCurrency(stats.totalVolume)}
            </p>
            <span className="text-[11px] text-[#8892b0] mt-1 block">
              Total registrado
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/25 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={20} />
          </div>
        </div>
      </div>

      {/* 3. SECCIÓN DE USUARIOS Y TABLA PRINCIPAL */}
      <div className="dash-card p-5 sm:p-6">
        {/* Header de la Sección y Buscador */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 pb-4 border-b border-white/10">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2.5">
              <Mail className="text-indigo-400" size={18} />
              <span>Usuarios Registrados y Correos</span>
            </h2>
            <p className="text-xs text-[#8892b0] mt-0.5 font-medium">
              Usuarios con correo, rol y actividad en la plataforma
            </p>
          </div>

          {/* Buscador de Usuarios Responsive */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8892b0]" size={15} />
            <input
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/50 border border-white/12 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-[#8892b0] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
            />
          </div>
        </div>

        {/* Tabla Compacta de Usuarios */}
        <div className="table-responsive">
          <table className="transactions-table">
            <thead>
              <tr>
                <th className="text-[11px] font-extrabold uppercase tracking-wider text-[#8892b0] bg-white/[0.02] border-b border-white/10 py-3 px-4">Usuario</th>
                <th className="text-[11px] font-extrabold uppercase tracking-wider text-[#8892b0] bg-white/[0.02] border-b border-white/10 py-3 px-4">Correo Electrónico</th>
                <th className="text-[11px] font-extrabold uppercase tracking-wider text-[#8892b0] bg-white/[0.02] border-b border-white/10 py-3 px-4">Rol</th>
                <th className="text-[11px] font-extrabold uppercase tracking-wider text-[#8892b0] bg-white/[0.02] border-b border-white/10 py-3 px-4">Estado Telegram</th>
                <th className="text-[11px] font-extrabold uppercase tracking-wider text-[#8892b0] bg-white/[0.02] border-b border-white/10 py-3 px-4">Fecha Registro</th>
                <th className="text-[11px] font-extrabold uppercase tracking-wider text-[#8892b0] bg-white/[0.02] border-b border-white/10 py-3 px-4">Transacciones</th>
                <th className="text-[11px] font-extrabold uppercase tracking-wider text-[#8892b0] bg-white/[0.02] border-b border-white/10 py-3 px-4 text-right">Total Registrado</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const initial = u.nombre ? u.nombre.charAt(0).toUpperCase() : 'U';
                const isAdmin = u.rol === 'ADMIN';

                return (
                  <tr key={u.id_usuario} className="hover:bg-white/[0.03] transition-colors">
                    {/* Nombre y Avatar */}
                    <td className="py-3 px-4 border-b border-white/5 align-middle">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${isAdmin ? 'bg-gradient-to-tr from-purple-600 to-indigo-600' : 'bg-gradient-to-tr from-indigo-500 to-purple-600'} flex items-center justify-center text-white font-black text-xs shadow-md flex-shrink-0`}>
                          {initial}
                        </div>
                        <div>
                          <p className="font-bold text-white text-xs flex items-center gap-1.5 leading-snug">
                            <span>{u.nombre}</span>
                          </p>
                          <p className="text-[10px] text-[#8892b0] font-mono mt-0.5">ID: #{u.id_usuario}</p>
                        </div>
                      </div>
                    </td>

                    {/* Correo Electrónico */}
                    <td className="py-3 px-4 border-b border-white/5 align-middle">
                      <div className="flex items-center gap-2">
                        <Mail size={13} className="text-indigo-400 flex-shrink-0" />
                        <span className="font-medium text-xs text-white">
                          {u.email || <span className="text-[#8892b0] italic">Sin correo</span>}
                        </span>
                      </div>
                    </td>

                    {/* Rol */}
                    <td className="py-3 px-4 border-b border-white/5 align-middle">
                      {isAdmin ? (
                        <span className="dash-badge text-[10px] font-extrabold text-purple-300 bg-purple-500/20 !rounded-full border border-purple-500/30 uppercase tracking-wider">
                          <Shield size={11} />
                          Admin
                        </span>
                      ) : (
                        <span className="dash-badge text-[10px] font-semibold text-[#8892b0] bg-white/5 !rounded-full border border-white/10 uppercase tracking-wider">
                          Usuario
                        </span>
                      )}
                    </td>

                    {/* Estado de Telegram */}
                    <td className="py-3 px-4 border-b border-white/5 align-middle">
                      {isAdmin ? (
                        <span className="text-xs text-[#8892b0] font-medium">— No aplica</span>
                      ) : u.telegram_id ? (
                        <span className="dash-badge text-xs text-emerald-400 font-semibold bg-emerald-500/10 !rounded-xl border border-emerald-500/20">
                          <CheckCircle2 size={13} />
                          <span>Vinculado ({u.telegram_id})</span>
                        </span>
                      ) : (
                        <span className="dash-badge text-xs text-amber-400 font-semibold bg-amber-500/10 !rounded-xl border border-amber-500/20 font-mono">
                          <Send size={13} />
                          <span>{u.token_vinculacion || 'Sin token'}</span>
                        </span>
                      )}
                    </td>

                    {/* Fecha de Registro */}
                    <td className="py-3 px-4 border-b border-white/5 align-middle text-xs text-[#8892b0] font-mono">
                      {formatDate(u.fecha_creacion)}
                    </td>

                    {/* Transacciones Registradas */}
                    <td className="py-3 px-4 border-b border-white/5 align-middle">
                      <span className="dash-badge text-xs font-bold text-white bg-white/5 !rounded-lg border border-white/10">
                        {u.totalTransacciones} operadas
                      </span>
                    </td>

                    {/* Total Gastos Registrados */}
                    <td className="py-3 px-4 border-b border-white/5 align-middle text-right">
                      <span className="text-xs font-mono font-bold text-indigo-300">
                        {formatCurrency(u.totalGastos)}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-[#8892b0] text-xs">
                    No se encontraron usuarios coincidentes con "{searchTerm}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Compacto de la Tabla */}
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#8892b0]">
          <span>
            Mostrando {filteredUsers.length} de {stats.totalUsers} usuario{stats.totalUsers !== 1 ? 's' : ''}
          </span>

          <div className="flex items-center gap-2 font-mono text-[#8892b0]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>SQLite sincronizada</span>
          </div>
        </div>
      </div>
    </div>
  );
}
