'use client';

import React, { useState } from 'react';
import {
  Users,
  ShieldCheck,
  Send,
  AlertTriangle,
  Receipt,
  Search,
  CheckCircle2,
  Mail,
  Calendar,
  Sparkles,
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

  const filteredUsers = stats.users.filter(u => {
    const term = searchTerm.toLowerCase();
    return (
      u.nombre.toLowerCase().includes(term) ||
      (u.email && u.email.toLowerCase().includes(term)) ||
      (u.token_vinculacion && u.token_vinculacion.toLowerCase().includes(term))
    );
  });

  return (
    <div className="flex flex-col gap-8 antialiased pb-12">
      {/* Encabezado Principal de Administración */}
      <header className="dash-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              Panel de Control
            </span>
          </div>
          <h1 className="text-gradient font-black text-2xl sm:text-3xl">Administración de Plataforma</h1>
          <p className="subtitle text-sm text-[#8892b0] mt-1">
            Gestión global de usuarios registrados, correos electrónicos y métricas del sistema
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 text-xs font-bold text-emerald-400">
            <CheckCircle2 size={16} />
            <span>Sistema Operativo</span>
          </div>
        </div>
      </header>

      {/* Tarjetas de Métricas Globales */}
      <div className="metrics-grid">
        {/* Total Usuarios Registrados */}
        <div className="metric-card">
          <div className="metric-icon primary-bg">
            <Users size={26} />
          </div>
          <div className="metric-content">
            <h3>Total Usuarios</h3>
            <p className="metric-value">{stats.totalUsers}</p>
          </div>
        </div>

        {/* Usuarios Vinculados a Telegram */}
        <div className="metric-card">
          <div className="metric-icon success-bg">
            <UserCheck size={26} />
          </div>
          <div className="metric-content">
            <h3>Vinculados Telegram</h3>
            <p className="metric-value monto-positivo">{stats.linkedUsers}</p>
          </div>
        </div>

        {/* Usuarios Sin Vincular */}
        <div className="metric-card">
          <div className="metric-icon warning-bg">
            <AlertTriangle size={26} />
          </div>
          <div className="metric-content">
            <h3>Pendientes Telegram</h3>
            <p className="metric-value text-amber-400">{stats.unlinkedUsers}</p>
          </div>
        </div>

        {/* Transacciones Totales Plataforma */}
        <div className="metric-card">
          <div className="metric-icon secondary-bg">
            <TrendingUp size={26} />
          </div>
          <div className="metric-content">
            <h3>Volumen Registrado</h3>
            <p className="metric-value">{formatCurrency(stats.totalVolume)}</p>
          </div>
        </div>
      </div>

      {/* Tabla Principal de Usuarios Registrados y Correos */}
      <div className="dash-card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-5 border-b border-white/10">
          <div>
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2.5">
              <Mail className="text-indigo-400" size={20} />
              <span>Usuarios Registrados y Correos</span>
            </h2>
            <p className="text-xs text-[#8892b0] mt-1">
              Lista detallada de usuarios con correo electrónico, rol, estado de Telegram y actividad
            </p>
          </div>

          {/* Buscador de Usuarios */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-3 text-[#8892b0]" size={16} />
            <input
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-[#8892b0] focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Tabla de Usuarios */}
        <div className="table-responsive">
          <table className="transactions-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Correo Electrónico</th>
                <th>Rol</th>
                <th>Estado Telegram</th>
                <th>Fecha Registro</th>
                <th>Transacciones</th>
                <th style={{ textAlign: 'right' }}>Total Registrado</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const initial = u.nombre ? u.nombre.charAt(0).toUpperCase() : 'U';
                const isAdmin = u.rol === 'ADMIN';

                return (
                  <tr key={u.id_usuario}>
                    {/* Nombre y Avatar */}
                    <td>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full ${isAdmin ? 'bg-gradient-to-tr from-purple-600 to-indigo-600' : 'bg-gradient-to-tr from-indigo-500 to-purple-600'} flex items-center justify-center text-white font-black text-xs shadow-md`}>
                          {initial}
                        </div>
                        <div>
                          <p className="font-bold text-white text-xs flex items-center gap-1.5">
                            <span>{u.nombre}</span>
                          </p>
                          <p className="text-[10px] text-[#8892b0] font-mono">ID: #{u.id_usuario}</p>
                        </div>
                      </div>
                    </td>

                    {/* Correo Electrónico */}
                    <td>
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-indigo-400 flex-shrink-0" />
                        <span className="font-medium text-xs text-white">
                          {u.email || <span className="text-[#8892b0] italic">Sin correo</span>}
                        </span>
                      </div>
                    </td>

                    {/* Rol */}
                    <td>
                      {isAdmin ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-purple-300 bg-purple-500/20 px-2.5 py-0.5 rounded-full border border-purple-500/30 uppercase tracking-wider">
                          <Shield size={12} />
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[11px] font-semibold text-[#8892b0] bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10 uppercase tracking-wider">
                          Usuario
                        </span>
                      )}
                    </td>

                    {/* Estado de Telegram */}
                    <td>
                      {isAdmin ? (
                        <span className="text-xs text-[#8892b0] italic">N/A (Admin)</span>
                      ) : u.telegram_id ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
                          <CheckCircle2 size={14} />
                          <span>Vinculado ({u.telegram_id})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-semibold bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20 font-mono">
                          <Send size={13} />
                          <span>{u.token_vinculacion || 'Sin token'}</span>
                        </span>
                      )}
                    </td>

                    {/* Fecha de Registro */}
                    <td className="text-xs text-[#8892b0] font-mono">
                      {formatDate(u.fecha_creacion)}
                    </td>

                    {/* Transacciones Registradas */}
                    <td>
                      <span className="text-xs font-bold text-white bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                        {u.totalTransacciones} operadas
                      </span>
                    </td>

                    {/* Total Gastos Registrados */}
                    <td style={{ textAlign: 'right' }}>
                      <span className="text-xs font-mono font-bold text-indigo-300">
                        {formatCurrency(u.totalGastos)}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-[#8892b0] text-xs">
                    No se encontraron usuarios coincidentes con "{searchTerm}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-[#8892b0]">
          <span>Mostrando {filteredUsers.length} de {stats.totalUsers} usuarios registrados</span>
          <span className="font-mono text-indigo-400 font-bold">Base de Datos SQLite Sincronizada</span>
        </div>
      </div>
    </div>
  );
}
