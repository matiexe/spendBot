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
        categoria_id: '',
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
            // If it's a gasto, we record it as a negative value to match the image logic
            const signedMonto = formData.tipo === 'gasto' ? -Math.abs(Number(formData.monto)) : Math.abs(Number(formData.monto));

            const response = await fetch('/api/transactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id_usuario: 1, // Default user for now
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
            <div className="modal-content glass-panel">
                <div className="modal-header">
                    <h3>Nueva Transacción</h3>
                    <button onClick={onClose} className="close-btn"><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="transaction-form">
                    <div className="form-group row">
                        <button
                            type="button"
                            className={`type-btn gasto ${formData.tipo === 'gasto' ? 'active' : ''}`}
                            onClick={() => setFormData({ ...formData, tipo: 'gasto' })}
                        >
                            Gasto
                        </button>
                        <button
                            type="button"
                            className={`type-btn ingreso ${formData.tipo === 'ingreso' ? 'active' : ''}`}
                            onClick={() => setFormData({ ...formData, tipo: 'ingreso' })}
                        >
                            Ingreso
                        </button>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Monto</label>
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
                                <option value="">Seleccionar...</option>
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
                            placeholder="Ej: Supermercado Coto"
                            value={formData.descripcion}
                            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Cuenta</label>
                            <input
                                type="text"
                                placeholder="Banco Provincia, Efectivo..."
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
                            {loading ? 'Guardando...' : <><Save size={18} /> Guardar</>}
                        </button>
                    </div>
                </form>
            </div>

            <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }
        .modal-content {
          width: 100%;
          max-width: 500px;
          padding: 2rem;
          background: #1a1c23;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        .modal-header h3 {
          font-size: 1.5rem;
          color: #fff;
        }
        .close-btn {
          background: none;
          border: none;
          color: #8892b0;
          cursor: pointer;
        }
        .transaction-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .form-group.row {
          flex-direction: row;
          gap: 0.5rem;
        }
        label {
          font-size: 0.875rem;
          color: #8892b0;
        }
        input, select {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 0.75rem;
          color: #fff;
          outline: none;
        }
        input:focus { border-color: var(--primary); }
        .type-btn {
          flex: 1;
          padding: 0.75rem;
          border-radius: 8px;
          border: 1px solid transparent;
          background: rgba(255,255,255,0.05);
          color: #8892b0;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }
        .type-btn.gasto.active { 
          background: rgba(239, 68, 68, 0.15); 
          color: #ef4444; 
          border-color: #ef4444; 
        }
        .type-btn.ingreso.active { 
          background: rgba(16, 185, 129, 0.15); 
          color: #10b981; 
          border-color: #10b981; 
        }
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 1rem;
        }
        .btn-cancel {
          background: none;
          border: none;
          color: #8892b0;
          cursor: pointer;
        }
        .btn-submit {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--primary);
          color: #fff;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }
        .form-error {
          color: #ef4444;
          font-size: 0.875rem;
        }
      `}</style>
        </div>
    );
}
