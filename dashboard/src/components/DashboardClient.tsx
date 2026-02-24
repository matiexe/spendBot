'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { TrendingUp, Users, DollarSign, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

export default function DashboardClient({ data }: { data: any }) {
  const { total, totalMonth, byCategory, recent, totalCount, userCount } = data;

  const barData = byCategory.slice(0, 5).map((c: any) => ({
    name: c.nombre,
    total: c.total
  }));

  const pieData = byCategory.map((c: any) => ({
    name: c.nombre,
    value: c.total
  }));

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="dashboard-container">
      <header className="header glass-panel">
        <div>
          <h1 className="text-gradient">Financial Dashboard</h1>
          <p className="subtitle">Bot de Gastos Telegram Overview</p>
        </div>
        <div className="header-actions">
          <div className="status-badge">
            <span className="dot pulse"></span>
            System Online
          </div>
        </div>
      </header>

      <div className="metrics-grid">
        <div className="metric-card glass-panel">
          <div className="metric-icon primary-bg">
            <DollarSign size={24} />
          </div>
          <div className="metric-content">
            <h3>Total Gastos (Mes)</h3>
            <p className="metric-value">{formatCurrency(totalMonth)}</p>
            <span className="metric-trend positive">
              <TrendIndicator value={15} /> vs last month
            </span>
          </div>
        </div>

        <div className="metric-card glass-panel">
          <div className="metric-icon secondary-bg">
            <Activity size={24} />
          </div>
          <div className="metric-content">
            <h3>Total Histórico</h3>
            <p className="metric-value">{formatCurrency(total)}</p>
            <span className="metric-subtitle">{totalCount} transacciones</span>
          </div>
        </div>

        <div className="metric-card glass-panel">
          <div className="metric-icon success-bg">
            <Users size={24} />
          </div>
          <div className="metric-content">
            <h3>Usuarios Activos</h3>
            <p className="metric-value">{userCount}</p>
            <span className="metric-trend positive">
              <TrendIndicator value={2} /> new users
            </span>
          </div>
        </div>

        <div className="metric-card glass-panel">
          <div className="metric-icon warning-bg">
            <TrendingUp size={24} />
          </div>
          <div className="metric-content">
            <h3>Top Categoría</h3>
            <p className="metric-value">{byCategory[0]?.emoji} {byCategory[0]?.nombre || 'N/A'}</p>
            <span className="metric-subtitle">{formatCurrency(byCategory[0]?.total || 0)} total</span>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card glass-panel">
          <h3>Gastos por Categoría</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="name" stroke="#8892b0" tick={{ fill: '#8892b0' }} />
                <YAxis stroke="#8892b0" tick={{ fill: '#8892b0' }} tickFormatter={(value) => `$${value / 1000}k`} />
                <RechartsTooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#1e2029', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                  {barData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card glass-panel">
          <h3>Distribución de Gastos</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#1e2029', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="legend">
            {pieData.slice(0, 4).map((entry: any, index: number) => (
              <div key={`legend-${index}`} className="legend-item">
                <span className="legend-color" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                <span className="legend-text">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="recent-transactions glass-panel">
        <div className="section-header">
          <h3>Últimos Gastos</h3>
          <button className="btn-secondary">View All</button>
        </div>
        <div className="table-responsive">
          <table className="transactions-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Categoría</th>
                <th>Descripción</th>
                <th>Fecha</th>
                <th>Monto</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((gasto: any) => (
                <tr key={gasto.id}>
                  <td>
                    <div className="user-cell">
                      <div className="avatar">{gasto.usuarioNombre?.charAt(0).toUpperCase() || '?'}</div>
                      <span>{gasto.usuarioNombre || 'Usuario'}</span>
                    </div>
                  </td>
                  <td>
                    <span className="category-badge">
                      {gasto.categoriaEmoji} {gasto.categoriaNombre}
                    </span>
                  </td>
                  <td className="desc-cell">{gasto.descripcion || '-'}</td>
                  <td className="date-cell">{new Date(gasto.fecha).toLocaleDateString('es-AR', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</td>
                  <td className="amount-cell">{formatCurrency(gasto.monto)}</td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty-state">No hay gastos recientes registrados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TrendIndicator({ value }: { value: number }) {
  const isPositive = value >= 0;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
      {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
      {Math.abs(value)}%
    </span>
  );
}
