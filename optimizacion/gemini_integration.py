# gemini_integration.py - Integración con Google Gemini (SDK: google-genai)

import json
import logging
import os
import re
from dotenv import load_dotenv

load_dotenv()

try:
    from google import genai
    from google.genai import types as genai_types
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

from config_mejorada import (
    CATEGORIAS_GASTOS,
    CATEGORIAS_INGRESOS,
    generar_prompt_deteccion
)

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
GEMINI_MODEL   = os.getenv('GEMINI_MODEL', 'models/gemini-2.0-flash')


class DetectorCategorias:
    """
    Detecta automáticamente el tipo (GASTO/INGRESO), categoría y monto
    de un mensaje usando Google Gemini.
    """

    def __init__(self):
        if not GEMINI_AVAILABLE:
            raise ImportError(
                "La librería google-genai no está instalada. "
                "Ejecutá: pip install google-genai"
            )
        if not GEMINI_API_KEY:
            raise ValueError(
                "❌ GEMINI_API_KEY no está definida en .env\n"
                "Obtené tu API key gratis en: https://aistudio.google.com/app/apikey"
            )
        self.client = genai.Client(api_key=GEMINI_API_KEY)
        self.model  = GEMINI_MODEL

    # ---- Helpers ----

    def _ask(self, prompt: str, max_tokens: int = 500) -> str:
        """Envía un prompt a Gemini y retorna el texto de respuesta."""
        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt,
            config=genai_types.GenerateContentConfig(
                max_output_tokens=max_tokens,
                temperature=0.2,
            ),
        )
        return response.text.strip()

    # ---- Detección principal ----

    def detectar_desde_mensaje(self, mensaje: str) -> dict:
        """
        Detecta el tipo (GASTO/INGRESO), categoría y monto desde un mensaje natural.

        Returns:
            dict con: tipo, categoria, monto, confianza, descripcion, mensaje_original
        """
        try:
            tipo_detectado = self._detectar_tipo(mensaje)
            prompt          = generar_prompt_deteccion(mensaje, tipo=tipo_detectado)
            respuesta_texto = self._ask(prompt)
            resultado       = self._parsear_json(respuesta_texto)
            resultado       = self._validar_resultado(resultado, tipo_detectado)
            resultado['mensaje_original'] = mensaje
            logger.info(f"Detección exitosa: {resultado}")
            return resultado
        except Exception as e:
            logger.error(f"Error en detección: {e}")
            return {
                'tipo': 'GASTO',
                'categoria': 'otros',
                'monto': None,
                'confianza': 'baja',
                'descripcion': f'Error en detección automática: {e}',
                'mensaje_original': mensaje,
            }

    # ---- Clasificación GASTO / INGRESO ----

    def _detectar_tipo(self, mensaje: str) -> str:
        palabras_ingreso = [
            'recibí', 'me pagaron', 'gané', 'cobré', 'deposité',
            'salario', 'sueldo', 'bonificación', 'vendí', 'venta',
            'ganancias', 'heredé', 'regalaron', 'premio', 'beca', 'cobrar',
        ]
        palabras_gasto = [
            'compré', 'gasté', 'pagué', 'gasto', 'invertí', 'compra',
            'costo', 'tarifa', 'cuota', 'pago', 'cuesta', 'gastado',
            'tengo que pagar', 'pagando',
        ]
        ml = mensaje.lower()
        n_ing  = sum(1 for p in palabras_ingreso if p in ml)
        n_gast = sum(1 for p in palabras_gasto   if p in ml)

        if n_ing > 0 and n_gast > 0:
            return self._preguntar_tipo_ia(mensaje)
        return 'INGRESO' if n_ing > n_gast else 'GASTO'

    def _preguntar_tipo_ia(self, mensaje: str) -> str:
        prompt = (
            f'¿El siguiente texto describe un GASTO (dinero que sale) '
            f'o un INGRESO (dinero que entra)?\n'
            f'Responde SOLO con: GASTO o INGRESO\n\n'
            f'Mensaje: "{mensaje}"'
        )
        try:
            r = self._ask(prompt, max_tokens=10).upper()
            return 'INGRESO' if 'INGRESO' in r else 'GASTO'
        except Exception as e:
            logger.warning(f"Error en _preguntar_tipo_ia: {e} — asumo GASTO")
            return 'GASTO'

    # ---- Parseo JSON ----

    def _parsear_json(self, texto: str) -> dict:
        # Limpiar bloques markdown ```json … ```
        limpio = re.sub(r'```(?:json)?\s*', '', texto).replace('```', '').strip()
        try:
            return json.loads(limpio)
        except json.JSONDecodeError:
            match = re.search(r'\{.*?\}', limpio, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group())
                except json.JSONDecodeError:
                    pass
        logger.warning(f"No se pudo parsear JSON: {texto}")
        return {'tipo': 'GASTO', 'categoria': None, 'monto': None, 'confianza': 'baja'}

    # ---- Validación ----

    def _validar_resultado(self, resultado: dict, tipo_detectado: str) -> dict:
        resultado['tipo'] = (resultado.get('tipo') or tipo_detectado).upper()

        if resultado.get('categoria'):
            cats = CATEGORIAS_GASTOS if resultado['tipo'] == 'GASTO' else CATEGORIAS_INGRESOS
            cat_norm = resultado['categoria'].lower().replace(' ', '_')
            if cat_norm not in cats:
                # Buscar por nombre amigable
                for key, cat in cats.items():
                    if cat['nombre'].lower() == resultado['categoria'].lower():
                        cat_norm = key
                        break
                else:
                    cat_norm = list(cats.keys())[-1]   # fallback 'otros'
            resultado['categoria'] = cat_norm

        if resultado.get('monto') is not None:
            try:
                resultado['monto'] = float(resultado['monto'])
            except (ValueError, TypeError):
                resultado['monto'] = None

        if resultado.get('confianza') not in ('alta', 'media', 'baja'):
            resultado['confianza'] = 'media'

        return resultado

    # ---- Recomendaciones ----

    def obtener_categorias_recomendadas(self, mensaje: str, tipo: str = 'GASTO',
                                         cantidad: int = 3) -> list:
        cats  = CATEGORIAS_GASTOS if tipo.upper() == 'GASTO' else CATEGORIAS_INGRESOS
        lista = ', '.join(f"{c['emoji']} {c['nombre']}" for c in cats.values())
        prompt = (
            f"Dado el siguiente mensaje sobre un {tipo.lower()}, "
            f"sugiere las {cantidad} categorías MÁS PROBABLES de la lista.\n"
            f"Responde SOLO con los nombres, uno por línea, en orden de probabilidad.\n\n"
            f"Categorías disponibles: {lista}\n\n"
            f'Mensaje: "{mensaje}"'
        )
        try:
            respuesta = self._ask(prompt, max_tokens=150)
            candidatas = [
                ln.strip().split()[-1].lower().replace(' ', '_')
                for ln in respuesta.split('\n') if ln.strip()
            ]
            return [c for c in candidatas if c in cats][:cantidad]
        except Exception as e:
            logger.error(f"Error en recomendaciones: {e}")
            return list(cats.keys())[:cantidad]


# ============= INSTANCIA GLOBAL =============

try:
    detector = DetectorCategorias()
    logger.info("✅ Gemini detector inicializado correctamente")
except Exception as e:
    logger.warning(f"⚠️  No se pudo inicializar Gemini detector: {e}")
    detector = None


# ============= FUNCIONES PÚBLICAS =============

def detectar_gasto_o_ingreso(mensaje: str) -> dict:
    if detector is None:
        return {
            'tipo': 'GASTO', 'categoria': 'otros', 'monto': None,
            'confianza': 'baja',
            'descripcion': 'IA no disponible — revisá GEMINI_API_KEY en .env',
            'mensaje_original': mensaje,
        }
    return detector.detectar_desde_mensaje(mensaje)


def obtener_recomendaciones(mensaje: str, tipo: str = 'GASTO') -> list:
    if detector is None:
        return []
    return detector.obtener_categorias_recomendadas(mensaje, tipo)


# ============= PRUEBA RÁPIDA =============

if __name__ == '__main__':
    ejemplos = [
        "Compré una hamburguesa por $50",
        "Me pagaron el sueldo de $5000",
        "Gasté $200 en la farmacia",
        "Vendí un producto por $300",
        "Pagué la cuota del gimnasio por $2000",
    ]
    print("🧪 Pruebas de detección con Gemini:\n")
    for ej in ejemplos:
        print(f"Msg : {ej}")
        res = detectar_gasto_o_ingreso(ej)
        print(f"Res : tipo={res['tipo']} cat={res['categoria']} "
              f"monto={res['monto']} confianza={res['confianza']}\n")
