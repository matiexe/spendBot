# claude_integration.py - Integración con Claude API para IA

import anthropic
import json
import logging
from config_mejorada import (
    CLAUDE_API_KEY, 
    CLAUDE_MODEL, 
    CLAUDE_MAX_TOKENS,
    CATEGORIAS_GASTOS,
    CATEGORIAS_INGRESOS,
    generar_prompt_deteccion
)

logger = logging.getLogger(__name__)

class DetectorCategorias:
    """
    Clase para detectar automáticamente la categoría de un gasto/ingreso
    usando Claude API
    """
    
    def __init__(self):
        self.cliente = anthropic.Anthropic(api_key=CLAUDE_API_KEY)
        self.model = CLAUDE_MODEL
    
    def detectar_desde_mensaje(self, mensaje):
        """
        Detecta el tipo (GASTO/INGRESO), categoría y monto desde un mensaje
        
        Args:
            mensaje (str): Mensaje del usuario
        
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
            # Primero detectamos si es gasto o ingreso
            tipo_detectado = self._detectar_tipo(mensaje)
            
            # Luego usamos el tipo para refinar la categoría
            prompt = generar_prompt_deteccion(mensaje, tipo=tipo_detectado)
            
            response = self.cliente.messages.create(
                model=self.model,
                max_tokens=CLAUDE_MAX_TOKENS,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            # Extraer el texto de la respuesta
            respuesta_texto = response.content[0].text
            
            # Parsear JSON de la respuesta
            resultado = self._parsear_respuesta_json(respuesta_texto)
            
            # Validar y enriquecer el resultado
            resultado = self._validar_resultado(resultado, tipo_detectado)
            resultado['mensaje_original'] = mensaje
            
            logger.info(f"Detección exitosa: {resultado}")
            return resultado
            
        except Exception as e:
            logger.error(f"Error en detección de categoría: {e}")
            return {
                'tipo': None,
                'categoria': None,
                'monto': None,
                'confianza': 'baja',
                'descripcion': 'Error en detección automática',
                'mensaje_original': mensaje,
                'error': str(e)
            }
    
    def _detectar_tipo(self, mensaje):
        """
        Detecta si el mensaje es un GASTO o INGRESO
        
        Returns:
            str: 'GASTO' o 'INGRESO'
        """
        
        # Palabras clave para ingresos
        palabras_ingreso = [
            'recibí', 'me pagaron', 'gané', 'ingreso', 'cobré', 'deposité',
            'salario', 'sueldo', 'bonificación', 'vendí', 'venta', 'ganancias',
            'heredé', 'regalaron', 'premio', 'beca'
        ]
        
        # Palabras clave para gastos
        palabras_gasto = [
            'compré', 'gasté', 'pagué', 'gasto', 'invertí', 'invertir',
            'compra', 'costo', 'tarifa', 'cuota', 'pago', 'cuesta',
            'gastado', 'invertido', 'tengo que pagar'
        ]
        
        mensaje_lower = mensaje.lower()
        
        # Contar coincidencias
        coincidencias_ingreso = sum(1 for palabra in palabras_ingreso if palabra in mensaje_lower)
        coincidencias_gasto = sum(1 for palabra in palabras_gasto if palabra in mensaje_lower)
        
        # Si hay ambiguedad, preguntar a Claude
        if coincidencias_ingreso > 0 and coincidencias_gasto > 0:
            return self._preguntar_tipo_a_ia(mensaje)
        
        if coincidencias_ingreso >= coincidencias_gasto:
            return 'INGRESO'
        else:
            return 'GASTO'
    
    def _preguntar_tipo_a_ia(self, mensaje):
        """Pregunta a Claude si es gasto o ingreso cuando hay ambiguedad"""
        
        prompt = f"""¿El siguiente mensaje describe un GASTO (dinero que se gasta) o un INGRESO (dinero que se recibe)?

Responde SOLO con la palabra: GASTO o INGRESO

Mensaje: "{mensaje}"
"""
        
        try:
            response = self.cliente.messages.create(
                model=self.model,
                max_tokens=50,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            respuesta = response.content[0].text.strip().upper()
            
            if 'INGRESO' in respuesta:
                return 'INGRESO'
            else:
                return 'GASTO'
                
        except Exception as e:
            logger.warning(f"Error detectando tipo con IA: {e}, asumiendo GASTO")
            return 'GASTO'
    
    def _parsear_respuesta_json(self, respuesta_texto):
        """
        Extrae JSON de la respuesta de Claude
        
        Args:
            respuesta_texto (str): Texto de respuesta de Claude
        
        Returns:
            dict: JSON parseado
        """
        
        try:
            # Intentar parsearlo directamente
            return json.loads(respuesta_texto)
        except json.JSONDecodeError:
            # Si no es JSON válido, intentar extraer el JSON del texto
            try:
                inicio = respuesta_texto.find('{')
                fin = respuesta_texto.rfind('}') + 1
                
                if inicio >= 0 and fin > inicio:
                    json_str = respuesta_texto[inicio:fin]
                    return json.loads(json_str)
            except:
                pass
            
            # Si todo falla, retornar estructura vacía
            logger.warning(f"No se pudo parsear JSON de: {respuesta_texto}")
            return {
                'tipo': 'GASTO',
                'categoria': None,
                'monto': None,
                'confianza': 'baja'
            }
    
    def _validar_resultado(self, resultado, tipo_detectado):
        """
        Valida y enriquece el resultado con valores por defecto
        
        Args:
            resultado (dict): Resultado a validar
            tipo_detectado (str): Tipo detectado ('GASTO' o 'INGRESO')
        
        Returns:
            dict: Resultado validado
        """
        
        # Usar tipo detectado si no está en el resultado
        if not resultado.get('tipo'):
            resultado['tipo'] = tipo_detectado
        
        # Asegurar que el tipo esté en mayúsculas
        resultado['tipo'] = resultado['tipo'].upper() if resultado.get('tipo') else tipo_detectado
        
        # Validar que la categoría existe
        if resultado.get('categoria'):
            categorias = CATEGORIAS_GASTOS if resultado['tipo'] == 'GASTO' else CATEGORIAS_INGRESOS
            
            # Buscar coincidencia exacta
            categoria_normalizada = resultado['categoria'].lower().replace(' ', '_')
            
            if categoria_normalizada not in categorias:
                # Buscar por nombre amigable
                for key, cat in categorias.items():
                    if cat['nombre'].lower() == resultado['categoria'].lower():
                        categoria_normalizada = key
                        break
            
            resultado['categoria'] = categoria_normalizada
        
        # Convertir monto a float si es string
        if resultado.get('monto'):
            try:
                resultado['monto'] = float(resultado['monto'])
            except (ValueError, TypeError):
                resultado['monto'] = None
        
        # Asegurar que confianza tenga valor
        if not resultado.get('confianza'):
            resultado['confianza'] = 'media'
        
        return resultado
    
    def obtener_categorias_recomendadas(self, mensaje, tipo='GASTO', cantidad=3):
        """
        Obtiene las N categorías más probables para un mensaje
        
        Args:
            mensaje (str): Mensaje del usuario
            tipo (str): 'GASTO' o 'INGRESO'
            cantidad (int): Número de recomendaciones
        
        Returns:
            list: Lista de categorías recomendadas
        """
        
        categorias = CATEGORIAS_GASTOS if tipo == 'GASTO' else CATEGORIAS_INGRESOS
        categorias_lista = ', '.join([f"{cat['emoji']} {cat['nombre']}" for cat in categorias.values()])
        
        prompt = f"""Dado el siguiente mensaje sobre un {tipo.lower()}, sugiere las {cantidad} categorías MÁS PROBABLES de la lista.

Responde SOLO con los nombres de las categorías, uno por línea, en orden de probabilidad.

Categorías disponibles: {categorias_lista}

Mensaje: "{mensaje}"
"""
        
        try:
            response = self.cliente.messages.create(
                model=self.model,
                max_tokens=200,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            respuesta = response.content[0].text.strip()
            recomendaciones = [linea.strip().split()[-1].lower().replace(' ', '_') 
                              for linea in respuesta.split('\n') if linea.strip()]
            
            # Validar que existan en las categorías
            recomendaciones_validas = [cat for cat in recomendaciones if cat in categorias]
            
            return recomendaciones_validas[:cantidad]
            
        except Exception as e:
            logger.error(f"Error obteniendo recomendaciones: {e}")
            return list(categorias.keys())[:cantidad]

# ============= INSTANCIA GLOBAL =============

detector = DetectorCategorias()

# ============= FUNCIONES DE CONVENIENCIA =============

def detectar_gasto_o_ingreso(mensaje):
    """Función wrapper para detectar categoría"""
    return detector.detectar_desde_mensaje(mensaje)

def obtener_recomendaciones(mensaje, tipo='GASTO'):
    """Función wrapper para obtener recomendaciones"""
    return detector.obtener_categorias_recomendadas(mensaje, tipo)

if __name__ == '__main__':
    # Pruebas
    print("🧪 Pruebas de detección de categorías:\n")
    
    ejemplos = [
        "Compré una hamburguesa por $50",
        "Me pagaron el sueldo de $5000",
        "Gasté $200 en un viaje a la playa",
        "Vendí un producto por $300",
        "Pagué la cuota del gimnasio",
    ]
    
    for ejemplo in ejemplos:
        print(f"Mensaje: {ejemplo}")
        resultado = detectar_gasto_o_ingreso(ejemplo)
        print(f"Resultado: {resultado}\n")
