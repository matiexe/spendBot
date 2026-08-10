'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Wallet, UserPlus, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, password })
      });
      const data = await res.json();

      if (data.success) {
        router.push('/');
        router.refresh();
      } else {
        setError(data.error || 'Error al registrar usuario');
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

        <h2 className="text-2xl font-bold text-white mb-1">Crear cuenta gratis</h2>
        <p className="text-xs text-[#8892b0] mb-6">Comenzá a administrar tus finanzas personales hoy mismo</p>

        <form onSubmit={handleRegister} className="transaction-form">
          <div className="form-group">
            <label>Nombre Completo</label>
            <input
              type="text"
              required
              placeholder="Ej: Mateo González"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

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
              minLength={6}
              placeholder="Mínimo 6 caracteres"
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
            {loading ? 'Creando cuenta...' : <><UserPlus size={18} /> Crear Mi Cuenta</>}
          </button>
        </form>

        <div className="text-center mt-6 pt-5 border-t border-white/5 text-xs text-[#8892b0]">
          ¿Ya tenés una cuenta registrada?{' '}
          <Link href="/login" className="text-[#818cf8] font-bold hover:underline">
            Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
