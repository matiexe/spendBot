import { NextResponse } from 'next/server';
import { getDb, Expense } from '@/lib/db';

export async function GET() {
    try {
        const db = getDb();

        const expenses = db.prepare(`
      SELECT 
        g.id, g.id_usuario, g.monto, g.categoria_id, g.descripcion, g.fecha, g.cuenta, g.origen,
        c.nombre as categoriaNombre, c.emoji as categoriaEmoji,
        u.nombre as usuarioNombre
      FROM gastos g
      LEFT JOIN categorias c ON g.categoria_id = c.id
      LEFT JOIN usuarios u ON g.id_usuario = u.id_usuario
      ORDER BY g.fecha DESC
    `).all() as Expense[];

        return NextResponse.json({ success: true, data: expenses });
    } catch (error: any) {
        console.error('Error fetching transactions:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id_usuario, monto, categoria_id, descripcion, cuenta, origen } = body;

        // Validate required fields
        if (!id_usuario || !monto || !categoria_id) {
            return NextResponse.json(
                { success: false, error: 'Completar id_usuario, monto y categoria_id es requerido' },
                { status: 400 }
            );
        }

        const db = getDb();

        const result = db.prepare(`
      INSERT INTO gastos (id_usuario, monto, categoria_id, descripcion, cuenta, origen)
      VALUES (@id_usuario, @monto, @categoria_id, @descripcion, @cuenta, @origen)
    `).run({
            id_usuario: Number(id_usuario),
            monto: Number(monto),
            categoria_id: Number(categoria_id),
            descripcion: descripcion || '',
            cuenta: cuenta || '-',
            origen: origen || 'Web'
        });

        return NextResponse.json({
            success: true,
            data: { id: result.lastInsertRowid }
        });

    } catch (error: any) {
        console.error('Error creating transaction:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
