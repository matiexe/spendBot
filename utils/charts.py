# charts.py - Generación de gráficos y estadísticas

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from datetime import datetime, timedelta
import io
import os

# Configurar matplotlib para no mostrar interfaz gráfica
plt.switch_backend('Agg')

def generar_grafico_pastel(gastos_por_categoria, titulo="Gastos por Categoría"):
    """
    Genera un gráfico de pastel con los gastos por categoría
    
    Args:
        gastos_por_categoria: Lista de tuplas (nombre, emoji, total, cantidad)
        titulo: Título del gráfico
    
    Returns:
        BytesIO con la imagen del gráfico
    """
    if not gastos_por_categoria:
        return None
    
    categorias = [g[0] for g in gastos_por_categoria]
    emojis = [g[1] for g in gastos_por_categoria]
    totales = [g[2] for g in gastos_por_categoria]
    
    # Crear etiquetas con emoji y nombre
    labels = [f"{emoji} {cat}" for emoji, cat in zip(emojis, categorias)]
    
    # Crear figura
    fig, ax = plt.subplots(figsize=(10, 8))
    
    # Colores
    colores = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE']
    
    # Crear gráfico de pastel
    wedges, texts, autotexts = ax.pie(
        totales,
        labels=labels,
        autopct='%1.1f%%',
        colors=colores[:len(categorias)],
        startangle=90,
        textprops={'fontsize': 10}
    )
    
    # Mejorar apariencia del porcentaje
    for autotext in autotexts:
        autotext.set_color('white')
        autotext.set_weight('bold')
        autotext.set_fontsize(9)
    
    # Título
    ax.set_title(titulo, fontsize=14, fontweight='bold', pad=20)
    
    # Guardar en memoria
    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight', dpi=100)
    buf.seek(0)
    plt.close()
    
    return buf

def generar_grafico_barras(datos_diarios, titulo="Gastos por Día"):
    """
    Genera un gráfico de barras con gastos por día
    
    Args:
        datos_diarios: Diccionario {fecha: monto}
        titulo: Título del gráfico
    
    Returns:
        BytesIO con la imagen del gráfico
    """
    if not datos_diarios:
        return None
    
    fechas = sorted(datos_diarios.keys())
    montos = [datos_diarios[f] for f in fechas]
    
    # Formatear fechas para mostrar
    labels = [f.strftime('%d/%m') for f in fechas]
    
    # Crear figura
    fig, ax = plt.subplots(figsize=(12, 6))
    
    # Color basado en el monto
    colores = ['#45B7D1' if m < max(montos) * 0.7 else '#FF6B6B' for m in montos]
    
    # Crear gráfico de barras
    bars = ax.bar(range(len(fechas)), montos, color=colores, edgecolor='black', linewidth=1.2)
    
    # Agregar valores en las barras
    for bar, monto in zip(bars, montos):
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., height,
                f'${monto:.0f}',
                ha='center', va='bottom', fontsize=9, fontweight='bold')
    
    # Configurar eje X
    ax.set_xticks(range(len(fechas)))
    ax.set_xticklabels(labels, rotation=45, ha='right')
    
    # Etiquetas y título
    ax.set_xlabel('Fecha', fontsize=11, fontweight='bold')
    ax.set_ylabel('Monto ($)', fontsize=11, fontweight='bold')
    ax.set_title(titulo, fontsize=14, fontweight='bold', pad=20)
    
    # Grid
    ax.grid(axis='y', alpha=0.3, linestyle='--')
    ax.set_axisbelow(True)
    
    # Guardar en memoria
    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight', dpi=100)
    buf.seek(0)
    plt.close()
    
    return buf

def generar_estadisticas_texto(gastos, gastos_por_categoria):
    """
    Genera un resumen de estadísticas en texto
    
    Args:
        gastos: Lista de gastos (monto, categoria, emoji, descripcion, fecha)
        gastos_por_categoria: Lista de (categoria, emoji, total, cantidad)
    
    Returns:
        String con las estadísticas formateadas
    """
    if not gastos:
        return "📊 No hay gastos registrados"
    
    # Calcular estadísticas
    total = sum(g[0] for g in gastos)
    promedio = total / len(gastos) if gastos else 0
    maximo = max(g[0] for g in gastos)
    minimo = min(g[0] for g in gastos)
    
    # Encontrar categoría con más gastos
    categoria_top = gastos_por_categoria[0] if gastos_por_categoria else None
    
    # Construir mensaje
    mensaje = f"""
📊 ESTADÍSTICAS DE GASTOS

💰 Total: ${total:.2f}
📈 Promedio por gasto: ${promedio:.2f}
🔝 Gasto máximo: ${maximo:.2f}
🔻 Gasto mínimo: ${minimo:.2f}
📝 Total de gastos: {len(gastos)}

📂 Categoría con más gastos:
   {categoria_top[1]} {categoria_top[0]}: ${categoria_top[2]:.2f} ({categoria_top[3]} gastos)
    """
    
    return mensaje

def generar_mensaje_resumen(gastos, periodo=""):
    """
    Genera un resumen formateado de los gastos
    
    Args:
        gastos: Lista de gastos (monto, categoria, emoji, descripcion, fecha)
        periodo: Descripción del período (ej: "de hoy", "de este mes")
    
    Returns:
        String con el resumen formateado
    """
    if not gastos:
        return f"📊 No hay gastos registrados {periodo}"
    
    total = sum(g[0] for g in gastos)
    
    # Encabezado
    mensaje = f"📊 RESUMEN DE GASTOS {periodo.upper()}\n"
    mensaje += f"{'='*40}\n\n"
    
    # Listar gastos
    for i, (monto, categoria, emoji, descripcion, fecha) in enumerate(gastos, 1):
        fecha_formateada = datetime.fromisoformat(fecha).strftime('%d/%m %H:%M')
        
        mensaje += f"{i}. {emoji} {categoria:12} ${monto:8.2f} - {fecha_formateada}\n"
        if descripcion:
            mensaje += f"   📝 {descripcion}\n"
    
    # Total
    mensaje += f"{'='*40}\n"
    mensaje += f"💰 TOTAL: ${total:.2f}\n"
    
    return mensaje

def procesar_gastos_por_dia(gastos):
    """
    Procesa gastos y los agrupa por día
    
    Args:
        gastos: Lista de gastos (monto, categoria, emoji, descripcion, fecha)
    
    Returns:
        Diccionario {fecha_date: total_monto}
    """
    gastos_agrupados = {}
    
    for monto, categoria, emoji, descripcion, fecha in gastos:
        fecha_obj = datetime.fromisoformat(fecha)
        fecha_date = fecha_obj.date()
        
        if fecha_date not in gastos_agrupados:
            gastos_agrupados[fecha_date] = 0
        
        gastos_agrupados[fecha_date] += monto
    
    return gastos_agrupados

if __name__ == '__main__':
    # Ejemplo de uso
    print("✅ Módulo de gráficos cargado correctamente")
