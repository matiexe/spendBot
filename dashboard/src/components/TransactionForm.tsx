'use client';

import React, { useState } from 'react';
import { X, Plus, Save } from 'lucide-react';

interface Category {
  id: number;
  nombre: string;
  emoji: string;
}

interface TransactionFormProps {
  categories: Category[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function TransactionForm({ categories, onClose, onSuccess }: TransactionFormProps) {
  const [formData, setFormData] = useState({
    monto: '',
    categoria_id: categories[0]?.id ? String(categories[0].id) : '',
    descripcion: '',
    cuenta: 'Efectivo',
    origen: 'Web',
    tipo: 'gasto' // 'gasto' | 'ingreso'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const signedMonto = formData.tipo === 'gasto' ? -Math.abs(Number(formData.monto)) : Math.abs(Number(formData.monto));

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_usuario: 1,
          monto: signedMonto,
          categoria_id: Number(formData.categoria_id),
          descripcion: formData.descripcion,
          cuenta: formData.cuenta,
          origen: formData.origen
        }),
      });

      const result = await response.json();

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.error || 'Error al guardar la transacción');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Nueva Transacción</h3>
          <button onClick={onClose} className="close-btn"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="transaction-form">
          <div className="form-group row">
            <button
              type="button"
              className={`type-btn gasto ${formData.tipo === 'gasto' ? 'active' : ''}`}
              onClick={() => setFormData({ ...formData, tipo: 'gasto' })}
            >
              🔴 Gasto
            </button>
            <button
              type="button"
              className={`type-btn ingreso ${formData.tipo === 'ingreso' ? 'active' : ''}`}
              onClick={() => setFormData({ ...formData, tipo: 'ingreso' })}
            >
              🟢 Ingreso
            </button>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Monto (ARS)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={formData.monto}
                onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Categoría</label>
              <select
                required
                value={formData.categoria_id}
                onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.emoji} {c.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Descripción</label>
            <input
              type="text"
              required
              placeholder="Ej: Supermercado Coto, Cine, Alquiler..."
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Cuenta</label>
              <input
                type="text"
                placeholder="Efectivo, MercadoPago, Banco..."
                value={formData.cuenta}
                onChange={(e) => setFormData({ ...formData, cuenta: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Origen</label>
              <input
                type="text"
                placeholder="Web, Manual..."
                value={formData.origen}
                onChange={(e) => setFormData({ ...formData, origen: e.target.value })}
              />
            </div>
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-cancel">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-submit">
              {loading ? 'Guardando...' : <><Save size={18} /> Guardar Transacción</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
