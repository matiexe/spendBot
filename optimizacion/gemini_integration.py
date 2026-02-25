# gemini_integration.py - Integración con Google Gemini API para IA

import json
import logging
import os
import re
from dotenv import load_dotenv

load_dotenv()

try:
    import google.generativeai as genai
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
GEMINI_MODEL = os.getenv('GEMINI_MODEL', 'gemini-1.5-flash')


class DetectorCategorias:
    """
    Clase para detectar automáticamente la categoría de un gasto/ingreso
    usando Google Gemini API
    """

    def __init__(self):
        if not GEMINI_AVAILABLE:
            raise ImportError(
                "La librería google-generativeai no está instalada. "
                "Ejecutá: pip install google-generativeai"
            )
        if not GEMINI_API_KEY:
            raise ValueError(
                "❌ GEMINI_API_KEY no está definida en .env\n"
                "Obtené tu API key gratis en: https://aistudio.google.com/app/apikey"
            )
        genai.configure(api_key=GEMINI_API_KEY)
        self.model = genai.GenerativeModel(GEMINI_MODEL)

    def _generar_texto(self, prompt, max_output_tokens=500):
        """Llama a Gemini y devuelve el texto de respuesta."""
        response = self.model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=max_output_tokens,
                temperature=0.2,
            )
        )
        return response.text.strip()

    def detectar_desde_mensaje(self, mensaje):
        """
        Detecta el tipo (GASTO/INGRESO), categoría y monto desde un mensaje.

        Returns:
            dict: {
                'tipo': 'GASTO|INGRESO',
                'categoria': 'nombre_categoria',
                'monto': float o None,
                'confianza': 'alta|media|baja',
                'descripcion': str,
                'mensaje_original': str
            }
        """
        try:
            tipo_detectado = self._detectar_tipo(mensaje)
            prompt = generar_prompt_deteccion(mensaje, tipo=tipo_detectado)
            respuesta_texto = self._generar_texto(prompt)
            resultado = self._parsear_respuesta_json(respuesta_texto)
            resultado = self._validar_resultado(resultado, tipo_detectado)
            resultado['mensaje_original'] = mensaje

            logger.info(f"Detección exitosa: {resultado}")
            return resultado

        except Exception as e:
            logger.error(f"Error en detección de categoría: {e}")
            return {
                'tipo': 'GASTO',
                'categoria': 'otros',
                'monto': None,
                'confianza': 'baja',
                'descripcion': 'Error en detección automática',
                'mensaje_original': mensaje,
                'error': str(e)
            }

    def _detectar_tipo(self, mensaje):
        """Detecta si el mensaje es un GASTO o INGRESO usando palabras clave primero, luego IA."""
        palabras_ingreso = [
            'recibí', 'me pagaron', 'gané', 'ingreso', 'cobré', 'deposité',
            'salario', 'sueldo', 'bonificación', 'vendí', 'venta', 'ganancias',
            'heredé', 'regalaron', 'premio', 'beca', 'cobrar'
        ]
        palabras_gasto = [
            'compré', 'gasté', 'pagué', 'gasto', 'invertí', 'compra',
            'costo', 'tarifa', 'cuota', 'pago', 'cuesta', 'gastado',
            'tengo que pagar', 'pagando'
        ]

        mensaje_lower = mensaje.lower()
        coincidencias_ingreso = sum(1 for p in palabras_ingreso if p in mensaje_lower)
        coincidencias_gasto = sum(1 for p in palabras_gasto if p in mensaje_lower)

        if coincidencias_ingreso > 0 and coincidencias_gasto > 0:
            return self._preguntar_tipo_a_ia(mensaje)

        if coincidencias_ingreso >= coincidencias_gasto:
            return 'INGRESO' if coincidencias_ingreso > 0 else 'GASTO'
        return 'GASTO'

    def _preguntar_tipo_a_ia(self, mensaje):
        """Pregunta a Gemini si es un gasto o ingreso cuando hay ambigüedad."""
        prompt = (
            f'¿El siguiente mensaje describe un GASTO (dinero que se gasta) '
            f'o un INGRESO (dinero que se recibe)?\n\n'
            f'Responde SOLO con la palabra: GASTO o INGRESO\n\n'
            f'Mensaje: "{mensaje}"'
        )
        try:
            respuesta = self._generar_texto(prompt, max_output_tokens=10).upper()
            return 'INGRESO' if 'INGRESO' in respuesta else 'GASTO'
        except Exception as e:
            logger.warning(f"Error detectando tipo con IA: {e}, asumiendo GASTO")
            return 'GASTO'

    def _parsear_respuesta_json(self, respuesta_texto):
        """Extrae JSON de la respuesta de Gemini."""
        # Eliminar bloques markdown ```json ... ```
        cleaned = re.sub(r'```(?:json)?\s*', '', respuesta_texto).replace('```', '').strip()

        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            # Intentar extraer el primer bloque JSON del texto
            match = re.search(r'\{.*?\}', cleaned, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group())
                except json.JSONDecodeError:
                    pass

        logger.warning(f"No se pudo parsear JSON de: {respuesta_texto}")
        return {
            'tipo': 'GASTO',
            'categoria': None,
            'monto': None,
            'confianza': 'baja'
        }

    def _validar_resultado(self, resultado, tipo_detectado):
        """Valida y enriquece el resultado con valores por defecto."""
        # Tipo
        resultado['tipo'] = (
            resultado.get('tipo', tipo_detectado) or tipo_detectado
        ).upper()

        # Validar categoría contra el diccionario real
        if resultado.get('categoria'):
            categorias = CATEGORIAS_GASTOS if resultado['tipo'] == 'GASTO' else CATEGORIAS_INGRESOS
            cat_norm = resultado['categoria'].lower().replace(' ', '_')

            if cat_norm not in categorias:
                # Buscar por nombre amigable
                for key, cat in categorias.items():
                    if cat['nombre'].lower() == resultado['categoria'].lower():
                        cat_norm = key
                        break
                else:
                    cat_norm = list(categorias.keys())[-1]  # 'otros' o 'otros_ingresos'

            resultado['categoria'] = cat_norm

        # Monto
        if resultado.get('monto') is not None:
            try:
                resultado['monto'] = float(resultado['monto'])
            except (ValueError, TypeError):
                resultado['monto'] = None

        # Confianza
        if resultado.get('confianza') not in ('alta', 'media', 'baja'):
            resultado['confianza'] = 'media'

        return resultado

    def obtener_categorias_recomendadas(self, mensaje, tipo='GASTO', cantidad=3):
        """Obtiene las N categorías más probables para un mensaje."""
        categorias = CATEGORIAS_GASTOS if tipo == 'GASTO' else CATEGORIAS_INGRESOS
        categorias_lista = ', '.join(
            [f"{cat['emoji']} {cat['nombre']}" for cat in categorias.values()]
        )

        prompt = (
            f"Dado el siguiente mensaje sobre un {tipo.lower()}, "
            f"sugiere las {cantidad} categorías MÁS PROBABLES de la lista.\n\n"
            f"Responde SOLO con los nombres de las categorías, uno por línea, en orden de probabilidad.\n\n"
            f"Categorías disponibles: {categorias_lista}\n\n"
            f'Mensaje: "{mensaje}"'
        )

        try:
            respuesta = self._generar_texto(prompt, max_output_tokens=200)
            recomendaciones = [
                linea.strip().split()[-1].lower().replace(' ', '_')
                for linea in respuesta.split('\n') if linea.strip()
            ]
            return [c for c in recomendaciones if c in categorias][:cantidad]
        except Exception as e:
            logger.error(f"Error obteniendo recomendaciones: {e}")
            return list(categorias.keys())[:cantidad]


# ============= INSTANCIA GLOBAL =============

try:
    detector = DetectorCategorias()
except Exception as e:
    logger.warning(f"No se pudo inicializar DetectorCategorias: {e}")
    detector = None


# ============= FUNCIONES DE CONVENIENCIA =============

def detectar_gasto_o_ingreso(mensaje):
    """Función wrapper para detectar categoría."""
    if detector is None:
        return {
            'tipo': 'GASTO',
            'categoria': 'otros',
            'monto': None,
            'confianza': 'baja',
            'descripcion': 'IA no disponible (revisar GEMINI_API_KEY)',
            'mensaje_original': mensaje,
        }
    return detector.detectar_desde_mensaje(mensaje)


def obtener_recomendaciones(mensaje, tipo='GASTO'):
    """Función wrapper para obtener recomendaciones."""
    if detector is None:
        return []
    return detector.obtener_categorias_recomendadas(mensaje, tipo)


if __name__ == '__main__':
    print("🧪 Pruebas de detección con Gemini:\n")
    ejemplos = [
        "Compré una hamburguesa por $50",
        "Me pagaron el sueldo de $5000",
        "Gasté $200 en la farmacia",
        "Vendí un producto por $300",
        "Pagué la cuota del gimnasio",
    ]
    for ejemplo in ejemplos:
        print(f"Mensaje: {ejemplo}")
        resultado = detectar_gasto_o_ingreso(ejemplo)
        print(f"Resultado: {resultado}\n")
