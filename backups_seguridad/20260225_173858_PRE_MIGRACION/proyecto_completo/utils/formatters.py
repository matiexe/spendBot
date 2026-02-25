from config import MONEDA
from datetime import datetime

def format_moneda(monto):
    return f"{MONEDA}{monto:.2f}"

def format_fecha(fecha_str):
    try:
        if " " in fecha_str or "T" in fecha_str:
            obj = datetime.fromisoformat(fecha_str)
            return obj.strftime('%d/%m/%Y %H:%M')
        else:
            obj = datetime.strptime(fecha_str, '%Y-%m-%d')
            return obj.strftime('%d/%m/%Y')
    except Exception:
        return fecha_str
