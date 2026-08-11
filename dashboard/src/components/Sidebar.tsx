'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Settings,
  Wallet,
  Repeat,
  History,
  ChevronDown,
  ShieldCheck
} from 'lucide-react';
import { User } from '@/lib/db';

interface SidebarProps {
  user?: User;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'historial';

  const isTransactionsRoute = pathname === '/transactions';
  const isAdminRoute = pathname === '/admin';
  const [openSubmenu, setOpenSubmenu] = useState(true);

  const isAdmin = user?.rol === 'ADMIN';

  return (
    <aside className="sidebar glass-panel">
      <div className="sidebar-header">
        <div className="logo-icon">
          <Wallet size={24} />
        </div>
        <div>
          <h2>SpendBot</h2>
          {isAdmin && (
            <span className="dash-badge text-[10px] bg-indigo-500/20 text-indigo-300 font-extrabold !rounded-md border border-indigo-500/30 uppercase tracking-wider">
              Panel Admin
            </span>
          )}
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul>
          {/* Si NO es administrador, mostrar vistas normales */}
          {!isAdmin && (
            <>
              {/* Dashboard */}
              <li>
                <Link
                  href="/"
                  className={`nav-item ${pathname === '/' ? 'active' : ''}`}
                >
                  <span className="nav-icon"><LayoutDashboard size={20} /></span>
                  <span className="nav-text">Dashboard</span>
                </Link>
              </li>

              {/* Transacciones */}
              <li>
                <div>
                  <div
                    onClick={() => setOpenSubmenu(!openSubmenu)}
                    className={`nav-item ${isTransactionsRoute ? 'active' : ''}`}
                    style={{ justifyContent: 'space-between' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span className="nav-icon"><ArrowLeftRight size={20} /></span>
                      <span className="nav-text">Transacciones</span>
                    </div>
                    <ChevronDown
                      size={16}
                      style={{
                        transform: openSubmenu ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                        color: '#8892b0'
                      }}
                    />
                  </div>

                  {/* Submenú de Transacciones */}
                  {openSubmenu && (
                    <div style={{ paddingLeft: '1.5rem', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <Link
                        href="/transactions"
                        className={`nav-subitem ${isTransactionsRoute && currentTab === 'historial' ? 'active' : ''}`}
                      >
                        <History size={16} />
                        <span>Historial</span>
                      </Link>

                      <Link
                        href="/transactions?tab=recurrentes"
                        className={`nav-subitem ${isTransactionsRoute && currentTab === 'recurrentes' ? 'active' : ''}`}
                      >
                        <Repeat size={16} />
                        <span>Recurrentes</span>
                      </Link>
                    </div>
                  )}
                </div>
              </li>
            </>
          )}

          {/* Administración (Siempre visible para ADMIN) */}
          {isAdmin && (
            <li>
              <Link
                href="/admin"
                className={`nav-item ${isAdminRoute ? 'active' : ''}`}
              >
                <span className="nav-icon"><ShieldCheck size={20} className="text-indigo-400" /></span>
                <span className="nav-text">Administración</span>
              </Link>
            </li>
          )}

          {/* Configuración */}
          <li>
            <Link
              href="#"
              className="nav-item"
            >
              <span className="nav-icon"><Settings size={20} /></span>
              <span className="nav-text">Configuración</span>
            </Link>
          </li>
        </ul>
      </nav>

      {isAdmin && (
        <div className="mt-auto pt-4 border-t border-white/10 flex items-center gap-2 text-[11px] text-[#8892b0] font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>SpendBot Admin v1.0</span>
        </div>
      )}
    </aside>
  );
}
