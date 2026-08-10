'use client';

import React, { useState, useEffect } from 'react';
import { User } from '@/lib/db';
import {
  Sparkles,
  Send,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  ArrowLeft,
  X,
  Bot,
  Zap,
  ShieldCheck,
  ExternalLink,
  MessageSquare
} from 'lucide-react';

interface OnboardingWizardProps {
  user: User;
  onClose?: () => void;
}

export default function OnboardingWizard({ user, onClose }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [copied, setCopied] = useState(false);

  const botUsername = 'Contolgastos_bot';
  const token = user.token_vinculacion || 'VIN-0000';
  const linkCommand = `/start ${token}`;
  const directTelegramUrl = `https://t.me/${botUsername}?start=${token}`;

  const copyCommand = () => {
    navigator.clipboard.writeText(linkCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay animate-in fade-in duration-200">
      <div className="modal-content max-w-xl relative p-6 sm:p-8 bg-[#12141d] border border-white/15 rounded-3xl shadow-2xl backdrop-blur-2xl">
        {/* Botón de cerrar */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-[#8892b0] hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer border border-white/5"
          >
            <X size={18} />
          </button>
        )}

        {/* Header con Barra de Progreso de Pasos */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest">
              Paso {step} de 3
            </span>
            <span className="text-xs text-[#8892b0]">• Guía de Inicio Rápido</span>
          </div>

          {/* Indicadores Visuales de Pasos */}
          <div className="grid grid-cols-3 gap-2">
            <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 1 ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-white/10'}`} />
            <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 2 ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-white/10'}`} />
            <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 3 ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-white/10'}`} />
          </div>
        </div>

        {/* PASO 1: Bienvenida e Introducción */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-[#818cf8] border border-indigo-500/30 flex items-center justify-center font-bold shadow-lg shadow-indigo-500/10">
              <Sparkles size={28} />
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                ¡Bienvenido a SpendBot Suite, {user.nombre}! 👋
              </h2>
              <p className="text-sm text-[#8892b0] mt-2 leading-relaxed">
                Tu gestor inteligente de finanzas personales. Podés registrar gastos diarios directamente desde Telegram por chat y ver el análisis en tiempo real en este Dashboard.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-start gap-3">
                <Bot className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">IA con Gemini</h4>
                  <p className="text-[11px] text-[#8892b0] mt-0.5">Categoriza tus textos automáticamente.</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-start gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">100% Privado</h4>
                  <p className="text-[11px] text-[#8892b0] mt-0.5">Tus datos aislados y protegidos.</p>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-6 py-3 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                <span>Siguiente: Vincular Bot</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* PASO 2: Vinculación con Telegram */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold shadow-lg shadow-cyan-500/10">
              <Send size={28} />
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                Vincular con Telegram en 1 Clic 🤖
              </h2>
              <p className="text-sm text-[#8892b0] mt-2 leading-relaxed">
                Para que el bot sepa qué cuenta es tuya, vinculalo una sola vez enviando tu código personal:
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-500/15 via-purple-500/10 to-pink-500/15 border border-indigo-500/30 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-[#8892b0]">Tu Bot Oficial:</span>
                <span className="text-xs font-extrabold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
                  @{botUsername}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-black/50 p-3.5 rounded-xl border border-white/10">
                <code className="font-mono text-sm text-indigo-300 font-bold">
                  {linkCommand}
                </code>

                <button
                  onClick={copyCommand}
                  className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/10"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
                </button>
              </div>

              <a
                href={directTelegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-cyan-600/30 cursor-pointer"
              >
                <Send size={18} />
                <span>Abrir en Telegram y Vincular Ahora</span>
                <ExternalLink size={16} />
              </a>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <button
                onClick={() => setStep(1)}
                className="text-[#8892b0] hover:text-white font-semibold text-sm flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft size={16} />
                <span>Atrás</span>
              </button>

              <button
                onClick={() => setStep(3)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-6 py-3 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                <span>Siguiente: Cómo usarlo</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* PASO 3: Tutorial de uso por chat */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold shadow-lg shadow-emerald-500/10">
              <MessageSquare size={28} />
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                ¡Listo para Registrar Gastos! 🚀
              </h2>
              <p className="text-sm text-[#8892b0] mt-2 leading-relaxed">
                Una vez vinculado, podés enviarle mensajes de chat en cualquier momento:
              </p>
            </div>

            <div className="space-y-3 p-4 rounded-2xl bg-white/5 border border-white/5 font-mono text-xs">
              <div className="p-3 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-200">
                💬 <strong>Vos:</strong> "Mercado 14500 en efectivo"
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                🤖 <strong>Bot:</strong> "✅ Registrado: $14.500 en Comida 🍔 [Efectivo]"
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <button
                onClick={() => setStep(2)}
                className="text-[#8892b0] hover:text-white font-semibold text-sm flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft size={16} />
                <span>Atrás</span>
              </button>

              <button
                onClick={onClose}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-7 py-3.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer hover:scale-105"
              >
                <CheckCircle2 size={18} />
                <span>¡Entendido, Ir al Dashboard!</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
