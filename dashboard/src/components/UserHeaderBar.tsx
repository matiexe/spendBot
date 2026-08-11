'use client';

import React, { useState, useRef, useEffect } from 'react';
import { User } from '@/lib/db';
import { LogOut, Send, CheckCircle2, Copy, Check, ChevronDown, User as UserIcon, AlertTriangle, Sparkles, ExternalLink, HelpCircle, ShieldCheck, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UserHeaderBarProps {
  user: User;
  onOpenOnboarding?: () => void;
}

export default function UserHeaderBar({ user, onOpenOnboarding }: UserHeaderBarProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  const botUsername = 'Controlgastos_bot';
  const token = user.token_vinculacion || 'VIN-0000';
  const linkCommand = `/start ${token}`;
  const directTelegramUrl = `https://t.me/${botUsername}?start=${token}`;
  const isAdmin = user.rol === 'ADMIN';

  const copyCommand = () => {
    navigator.clipboard.writeText(linkCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initial = user.nombre ? user.nombre.charAt(0).toUpperCase() : 'U';

  return (
    <div className="w-full">
      {/* Navbar Limpio */}
      <div className="w-full flex justify-between items-center relative z-40 py-1 px-1">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-[#818cf8] border border-indigo-500/30 flex items-center justify-center font-bold text-base shadow-sm">
            {isAdmin ? <ShieldCheck size={20} className="text-indigo-400" /> : <Sparkles size={18} />}
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white leading-tight">
              SpendBot Suite {isAdmin && <span className="text-xs text-indigo-400 font-bold ml-2">(Admin)</span>}
            </h2>
            <span className="text-xs text-[#8892b0] font-mono">
              {isAdmin ? 'Panel Global de Administración' : 'Entorno Multiusuario Aislado'}
            </span>
          </div>
        </div>

        {/* Grupo de Controles del Header: Selector de Fechas Global + Menú de Perfil */}
        <div className="flex items-center gap-3">
          {/* Selector de Rango de Fechas Global (Jerarquía Superior UX) */}
          <button className="hidden md:flex items-center gap-2.5 bg-white/5 hover:bg-white/10 text-[#cbd5e1] text-xs font-semibold px-4 py-2 rounded-full border border-white/12 transition-all shadow-sm cursor-pointer backdrop-blur-md">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-mono">01/08/2026 ➔ 31/08/2026</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#8892b0]" />
          </button>

          {/* Sección Usuario con Avatar Circular y Menú Desplegable */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3.5 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/12 transition-all cursor-pointer group shadow-md backdrop-blur-md"
            >
              {/* Avatar Circular */}
              <div className={`w-10 h-10 rounded-full ${isAdmin ? 'bg-gradient-to-tr from-purple-600 to-indigo-600' : 'bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500'} flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform`}>
                {initial}
              </div>

              <div className="hidden sm:block text-left pr-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-white leading-tight">{user.nombre}</p>
                  {isAdmin && (
                    <span className="dash-badge text-[10px] bg-indigo-500/20 text-indigo-300 font-extrabold !rounded-md border border-indigo-500/30">ADMIN</span>
                  )}
                </div>
                <p className="text-[11px] text-[#8892b0] truncate max-w-[120px]">{user.email || 'Mi Cuenta'}</p>
              </div>

              <ChevronDown
                size={16}
                className={`text-[#8892b0] group-hover:text-white transition-transform duration-200 ${dropdownOpen ? 'transform rotate-180 text-white' : ''}`}
              />
            </button>

            {/* Menú Desplegable (Dropdown) */}
            {dropdownOpen && (
              <div className="dash-dropdown-menu animate-in fade-in zoom-in-95">
                {/* Card Perfil de Usuario */}
                <div className="p-4 rounded-xl bg-white/5 flex items-center gap-3.5 border border-white/5">
                  <div className={`w-11 h-11 rounded-full ${isAdmin ? 'bg-gradient-to-tr from-purple-600 to-indigo-600' : 'bg-gradient-to-tr from-indigo-500 to-purple-600'} flex items-center justify-center text-white font-bold text-base flex-shrink-0 shadow-md`}>
                    {initial}
                  </div>
                  <div className="min-w-0 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white truncate">{user.nombre}</h4>
                      {isAdmin && (
                        <span className="dash-badge text-[10px] bg-indigo-500/20 text-indigo-300 font-extrabold !rounded-md border border-indigo-500/30">ADMIN</span>
                      )}
                    </div>
                    <p className="text-xs text-[#8892b0] truncate mt-0.5">{user.email || 'Sin email registrado'}</p>
                  </div>
                </div>

                {/* Estado de Telegram (Solo para usuarios no admin) */}
                {!isAdmin && (
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col gap-2">
                    <div className="text-[11px] uppercase font-extrabold tracking-wider text-[#8892b0]">
                      Estado de Telegram
                    </div>
                    {user.telegram_id ? (
                      <div className="dash-badge text-xs text-emerald-400 font-semibold bg-emerald-500/10 !rounded-xl border border-emerald-500/20">
                        <CheckCircle2 size={15} />
                        <span>Vinculado (ID: {user.telegram_id})</span>
                      </div>
                    ) : (
                      <div className="dash-badge text-xs text-amber-400 font-semibold bg-amber-500/10 !rounded-xl border border-amber-500/20">
                        <AlertTriangle size={15} />
                        <span>Sin vincular</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Botón Guía de Onboarding */}
                {onOpenOnboarding && !isAdmin && (
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenOnboarding();
                    }}
                    className="w-full text-left p-3.5 px-4 rounded-xl text-xs font-bold text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 transition-all flex items-center justify-between cursor-pointer shadow-sm"
                  >
                    <span className="flex items-center gap-3">
                      <HelpCircle size={16} className="text-purple-400" />
                      Guía de Inicio / Onboarding
                    </span>
                  </button>
                )}

                <div className="border-t border-white/10 my-0.5" />

                {/* Botón Cerrar Sesión */}
                <button
                  onClick={handleLogout}
                  className="w-full text-left p-4 px-5 rounded-xl text-xs font-extrabold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all flex items-center gap-3 cursor-pointer shadow-sm"
                >
                  <LogOut size={16} />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alerta Destacada de Vinculación de Bot (Solo para usuarios normales) */}
      {!user.telegram_id && !isAdmin && (
        <div className="dash-telegram-alert">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center flex-shrink-0 shadow-lg">
              <Send size={22} className="animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-3 flex-wrap">
                <span>Vinculá tu cuenta con Telegram</span>
                <span className="dash-badge text-xs bg-amber-500/20 text-amber-300 font-bold !rounded-full border border-amber-500/30">Acción Requerida</span>
              </h4>
              <p className="text-xs sm:text-sm text-[#8892b0] font-normal leading-relaxed">
                Buscá a nuestro bot <strong className="text-indigo-300 font-bold">@{botUsername}</strong> en Telegram o enviá el comando de arriba:
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-white/10">
            <code className="font-mono text-xs sm:text-sm text-indigo-300 font-bold bg-black/60 px-5 py-3 rounded-xl border border-indigo-500/30 shadow-inner">
              {linkCommand}
            </code>

            <a
              href={directTelegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-extrabold px-6 py-3 rounded-xl transition-all flex items-center gap-2.5 shadow-lg shadow-indigo-600/30 cursor-pointer hover:scale-105"
            >
              <Send size={16} />
              <span>Abrir en Telegram</span>
            </a>

            <button
              onClick={copyCommand}
              className="w-auto flex-shrink-0 whitespace-nowrap bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-extrabold px-5 py-3 rounded-xl border border-white/15 transition-all flex items-center justify-center gap-2.5 shadow-md cursor-pointer hover:scale-105"
            >
              {copied ? (
                <>
                  <Check size={16} className="text-emerald-300" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
