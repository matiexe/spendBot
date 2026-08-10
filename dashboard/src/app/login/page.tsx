'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Wallet, LogIn, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (data.success) {
        router.push('/');
        router.refresh();
      } else {
        setError(data.error || 'Credenciales incorrectas');
      }
    } catch {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0b0c10]">
      <div className="modal-content glass-panel max-w-md w-full !p-8">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-[#8892b0] hover:text-white flex items-center gap-1.5 text-xs font-semibold">
            <ArrowLeft size={16} /> Volver al Inicio
          </Link>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center">
              <Wallet size={18} className="text-white" />
            </div>
            <span className="font-bold text-white tracking-wide">SpendBot</span>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-1">Bienvenido de nuevo</h2>
        <p className="text-xs text-[#8892b0] mb-6">Ingresá tus datos para acceder a tu dashboard financiero</p>

        <form onSubmit={handleLogin} className="transaction-form">
          <div className="form-group">
            <label>Correo Electrónico</label>
            <input
              type="email"
              required
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="btn-submit w-full justify-center !py-3.5 mt-2"
          >
            {loading ? 'Ingresando...' : <><LogIn size={18} /> Iniciar Sesión</>}
          </button>
        </form>

        <div className="text-center mt-6 pt-5 border-t border-white/5 text-xs text-[#8892b0]">
          ¿No tenés una cuenta?{' '}
          <Link href="/register" className="text-[#818cf8] font-bold hover:underline">
            Registrate gratis
          </Link>
        </div>
      </div>
    </div>
  );
}
