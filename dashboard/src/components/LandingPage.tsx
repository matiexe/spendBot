'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Wallet,
  Send,
  BarChart3,
  Repeat,
  Zap,
  ArrowRight,
  CheckCircle2,
  Lock,
  MessageSquare,
  Flame,
  Sparkles,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: '¿Cómo se vincula el bot de Telegram con mi Dashboard Web?',
      a: 'Al registrarte en la web, recibes un código único en formato /start VIN-XXXX. Simplemente abrís el chat con nuestro bot en Telegram, le enviás ese mensaje y tu cuenta queda vinculada al instante.'
    },
    {
      q: '¿Tengo que instalar alguna aplicación en mi celular?',
      a: 'No. Solo necesitas tener Telegram instalado (que probablemente ya usas) y podés acceder a tu Dashboard Web desde cualquier navegador móvil o de computadora.'
    },
    {
      q: '¿Cómo entiende el bot lo que le escribo?',
      a: 'SpendBot procesa mensajes en lenguaje natural como "Gasté 15000 en el súper" o "Cobré 300000 de sueldo", infiriendo automáticamente el monto, la categoría y el tipo de movimiento.'
    },
    {
      q: '¿Cómo funcionan las transacciones recurrentes?',
      a: 'Podés programar tus gastos fijos (como alquiler, Netflix o expensas) para que el primer día de cada mes se computen automáticamente en tu balance sin necesidad de anotarlos manualmente.'
    },
    {
      q: '¿Es seguro y mis datos están aislados?',
      a: 'Sí. El sistema funciona con arquitectura multiusuario aislada. Cada usuario posee sus propios registros protegidos con autenticación y cifrado de contraseñas.'
    }
  ];

  return (
    <div className="lp-wrapper bg-grid-pattern">
      {/* Orbes de luz atmosféricos */}
      <div className="absolute top-[-10%] left-[-15%] w-[700px] h-[700px] bg-indigo-600/15 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-[25%] right-[-15%] w-[600px] h-[600px] bg-pink-600/12 rounded-full blur-[160px] pointer-events-none" />

      {/* Contenido Principal */}
      <main className="lp-main-content">
        {/* Navbar Superior */}
        <header className="lp-nav">
          <div className="lp-nav-container">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Wallet size={20} className="text-white" />
              </div>
              <div>
                <span className="font-extrabold text-lg text-white tracking-wide leading-tight block">SpendBot</span>
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">Financial Suite</span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#8892b0]">
              <a href="#caracteristicas" className="hover:text-white transition-colors">Características</a>
              <a href="#como-funciona" className="hover:text-white transition-colors">¿Cómo Funciona?</a>
              <a href="#faq" className="hover:text-white transition-colors">Preguntas Frecuentes</a>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-semibold text-[#8892b0] hover:text-white transition-all px-4 py-2 rounded-xl hover:bg-white/5"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/register"
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 text-white font-extrabold text-sm px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-500/25 hover:scale-[1.02] flex items-center gap-1.5"
              >
                <span>Comenzar Gratis</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section Principal */}
        <section className="lp-hero">
          <div className="lp-hero-badge">
            <Sparkles size={15} className="text-indigo-400" />
            <span>El nuevo estándar en finanzas personales inteligentes</span>
          </div>

          <h1 className="lp-hero-title">
            Controlá tus gastos sin planillas. Desde <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Telegram</span> a la <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">Web</span>
          </h1>

          <p className="lp-hero-subtitle">
            SpendBot interpreta tus mensajes diarios por chat y los transforma en balances, gráficos analíticos y proyección mensual sin esfuerzo.
          </p>

          <div className="lp-cta-group">
            <Link href="/register" className="lp-btn-primary">
              <span>Crear Cuenta Gratis</span>
              <ArrowRight size={18} />
            </Link>
            <Link href="/login" className="lp-btn-secondary">
              Iniciar Sesión
            </Link>
          </div>

          {/* Social Proof Badges */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-xs sm:text-sm text-[#8892b0] font-semibold mb-12">
            <span className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" /> 100% Gratis para probar
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" /> Sin tarjetas de crédito
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" /> Sincronización instantánea
            </span>
          </div>

          {/* Demo Interactiva Side-by-Side: Telegram + Web Dashboard */}
          <div className="lp-showcase-grid">
            
            {/* Chat Telegram Mockup */}
            <div className="lp-mockup-card">
              <div className="lp-mockup-card-header">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                    <Send size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white leading-tight">SpendBot Telegram</h4>
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      bot activo
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono text-[#8892b0]">Telegram App</span>
              </div>

              {/* Chat bubbles con espaciado amplio entre mensajes */}
              <div className="space-y-6 font-sans my-4">
                <div className="space-y-2">
                  <div className="chat-bubble-user">
                    Gasté 15000 en el súper coto
                  </div>
                  <div className="chat-bubble-bot space-y-1">
                    <p className="font-bold text-emerald-400 text-xs">✅ Gasto Registrado Exitosamente</p>
                    <p className="text-white font-mono font-bold text-sm">$ 15.000,00</p>
                    <p className="text-xs text-[#8892b0]">Categoría: 🍔 Comida / Coto</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="chat-bubble-user">
                    Cobré 400000 de alquiler departamento
                  </div>
                  <div className="chat-bubble-bot space-y-1">
                    <p className="font-bold text-indigo-400 text-xs">🟢 Ingreso Registrado Exitosamente</p>
                    <p className="text-white font-mono font-bold text-sm">+ $ 400.000,00</p>
                    <p className="text-xs text-[#8892b0]">Categoría: 🏠 Vivienda</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-3.5 border-t border-white/10 flex items-center justify-between text-xs text-[#8892b0]">
                <span>Mensajes procesados al instante</span>
                <span className="text-indigo-400 font-mono font-bold">⚡ 0.2s</span>
              </div>
            </div>

            {/* Panel Web Preview Mockup */}
            <div className="lp-mockup-card">
              <div className="lp-mockup-card-header">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                  </div>
                  <span className="text-xs text-[#8892b0] font-mono">dashboard.spendbot.app</span>
                </div>
                <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                  Dashboard V2.4
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="lp-inner-box">
                  <span className="text-xs text-[#8892b0] font-semibold block mb-0.5">Balance Mensual</span>
                  <p className="text-xl font-bold font-mono text-white">$ 488.044,44</p>
                  <span className="text-[11px] text-emerald-400 font-semibold block mt-1">↗ +89.1% vs previo</span>
                </div>
                <div className="lp-inner-box">
                  <span className="text-xs text-[#8892b0] font-semibold block mb-0.5">Recurrentes</span>
                  <p className="text-xl font-bold font-mono text-[#10b981]">4 Activas</p>
                  <span className="text-[11px] text-[#8892b0] block mt-1">$ 120.000 fijos</span>
                </div>
              </div>

              {/* Elemento de vinculación separado claramente del bloque de métricas arriba */}
              <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <Sparkles size={16} className="text-purple-400 flex-shrink-0" />
                  <span>Vinculación vía código <code className="bg-black/50 px-2 py-0.5 rounded text-indigo-300 font-mono font-bold">/start VIN-XXXX</code></span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Características Clave */}
        <section id="caracteristicas" className="lp-section bg-[#0a0b10] mt-12 sm:mt-16">
          <div className="lp-section-header">
            <h2>Diseñado para hacerte la vida más fácil</h2>
            <p>
              Olvidate de abrir planillas pesadas a fin de mes. SpendBot trabaja en segundo plano por vos.
            </p>
          </div>

          <div className="lp-grid-3">
            <div className="lp-card">
              <div className="lp-card-icon bg-indigo-500/15 text-[#818cf8] border border-indigo-500/20">
                <MessageSquare size={24} />
              </div>
              <h3>Bot en Lenguaje Natural</h3>
              <p>
                Podés escribirle como le escribirías a un amigo. El bot detecta si se trata de un gasto o ingreso, el monto y la categoría automáticamente.
              </p>
            </div>

            <div className="lp-card">
              <div className="lp-card-icon bg-purple-500/15 text-[#c084fc] border border-purple-500/20">
                <Repeat size={24} />
              </div>
              <h3>Transacciones Recurrentes</h3>
              <p>
                Programá tus alquileres, suscripciones y gastos fijos en cuotas para que se computen automáticamente cada mes sin olvidos.
              </p>
            </div>

            <div className="lp-card">
              <div className="lp-card-icon bg-emerald-500/15 text-[#34d399] border border-emerald-500/20">
                <BarChart3 size={24} />
              </div>
              <h3>Dashboard Analítico V2.4</h3>
              <p>
                Gráficos de barras comparativos de 13 meses, desglose por categorías y tablas ordenables con exportación de registros.
              </p>
            </div>

            <div className="lp-card">
              <div className="lp-card-icon bg-pink-500/15 text-[#f472b6] border border-pink-500/20">
                <Lock size={24} />
              </div>
              <h3>Multiusuario Aislado</h3>
              <p>
                Cada usuario registrado posee su propio entorno privado. Ningún dato se mezcla entre distintas cuentas ni usuarios.
              </p>
            </div>

            <div className="lp-card">
              <div className="lp-card-icon bg-cyan-500/15 text-[#22d3ee] border border-cyan-500/20">
                <Zap size={24} />
              </div>
              <h3>Sin Instalaciones Pesadas</h3>
              <p>
                Funciona directo desde Telegram en tu celular y cualquier navegador web en tu computadora o laptop.
              </p>
            </div>

            <div className="lp-card">
              <div className="lp-card-icon bg-amber-500/15 text-[#fbbf24] border border-amber-500/20">
                <Flame size={24} />
              </div>
              <h3>Reportes Instantáneos</h3>
              <p>
                Pedile un resumen al bot por chat en cualquier momento escribiendo <code className="text-amber-400 font-mono font-bold bg-black/40 px-2 py-0.5 rounded">/resumen</code> y recibí el total del mes.
              </p>
            </div>
          </div>
        </section>

        {/* Guía Paso a Paso */}
        <section id="como-funciona" className="lp-section bg-[#07080c]">
          <div className="lp-section-header">
            <h2>¿Cómo funciona?</h2>
            <p>Tres simples pasos para tomar el control total.</p>
          </div>

          <div className="lp-grid-3">
            <div className="lp-card relative">
              <span className="text-5xl font-black text-indigo-500/15 absolute top-5 right-5 font-mono">01</span>
              <div className="lp-card-icon bg-indigo-500/20 text-[#818cf8] font-bold text-lg border border-indigo-500/30">
                1
              </div>
              <h3>Registrate en la Web</h3>
              <p>
                Creá tu cuenta gratis con tu correo y contraseña para acceder a tu panel y obtener tu código de vinculación.
              </p>
            </div>

            <div className="lp-card relative">
              <span className="text-5xl font-black text-purple-500/15 absolute top-5 right-5 font-mono">02</span>
              <div className="lp-card-icon bg-purple-500/20 text-[#c084fc] font-bold text-lg border border-purple-500/30">
                2
              </div>
              <h3>Vinculá tu Telegram</h3>
              <p>
                Enviá <code className="text-indigo-300 font-mono font-bold bg-black/40 px-2 py-0.5 rounded">/start VIN-XXXX</code> al bot de Telegram para asociar tu chat.
              </p>
            </div>

            <div className="lp-card relative">
              <span className="text-5xl font-black text-emerald-500/15 absolute top-5 right-5 font-mono">03</span>
              <div className="lp-card-icon bg-emerald-500/20 text-[#34d399] font-bold text-lg border border-emerald-500/30">
                3
              </div>
              <h3>¡Anotá y Disfrutá!</h3>
              <p>
                Registrá tus consumos desde el celular y observá cómo se actualizan tus métricas automáticamente en el Dashboard.
              </p>
            </div>
          </div>
        </section>

        {/* Preguntas Frecuentes (FAQ) */}
        <section id="faq" className="lp-section bg-[#0a0b10]">
          <div className="lp-section-header">
            <h2>Preguntas Frecuentes</h2>
            <p>Resolvemos tus dudas principales antes de comenzar.</p>
          </div>

          <div className="lp-faq-container">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={index} className="lp-faq-card">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="lp-faq-trigger"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={20}
                      className={`text-[#8892b0] transition-transform duration-300 ${isOpen ? 'transform rotate-180 text-white' : ''}`}
                    />
                  </button>

                  {isOpen && (
                    <div className="lp-faq-body border-t border-white/5">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA Banner Final - Centrado */}
        <section className="lp-cta-final bg-gradient-to-b from-[#07080c] to-[#11131c]">
          <div className="max-w-3xl mx-auto flex flex-col items-center justify-center text-center space-y-6 relative z-10">
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              ¿Listo para transformar tu administración financiera?
            </h2>
            <p className="text-[#8892b0] text-lg sm:text-xl max-w-2xl mx-auto font-normal leading-relaxed">
              Unite gratis a SpendBot y comenzá a organizar tus gastos hoy mismo de forma inteligente.
            </p>
            <div className="pt-2 flex justify-center w-full">
              <Link href="/register" className="lp-btn-primary">
                <span>Crear Cuenta Gratis Ahora</span>
                <ChevronRight size={20} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Centrado */}
      <footer className="lp-footer flex flex-col items-center justify-center text-center">
        <div className="max-w-7xl mx-auto space-y-2 flex flex-col items-center justify-center">
          <div className="flex items-center justify-center gap-2 font-bold text-white text-base">
            <div className="w-6 h-6 rounded-lg bg-indigo-500 flex items-center justify-center text-white">
              <Wallet size={15} />
            </div>
            <span>SpendBot Financial Suite</span>
          </div>
          <p className="text-xs text-[#8892b0]">© 2026 SpendBot. Todos los derechos reservados. Diseñado para simplificar tu economía personal.</p>
        </div>
      </footer>
    </div>
  );
}
