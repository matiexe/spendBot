from config import CATEGORIAS_DEFECTO, MONTO_MINIMO, MONTO_MAXIMO, DESCRIPCION_MAX_LENGTH

def validar_monto(texto):
    try:
        monto = float(texto)
        if MONTO_MINIMO <= monto <= MONTO_MAXIMO:
            return monto
        return None
    except ValueError:
        return None

def validar_categoria(texto):
    try:
        opcion = int(texto)
        if 1 <= opcion <= len(CATEGORIAS_DEFECTO):
            return list(CATEGORIAS_DEFECTO.keys())[opcion - 1]
        return None
    except ValueError:
        return None

def validar_descripcion(texto):
    if texto == "/saltar":
        return ""
    if len(texto) > DESCRIPCION_MAX_LENGTH:
        return texto[:DESCRIPCION_MAX_LENGTH]
    return texto
