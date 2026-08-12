import unittest
import os
import hashlib
from utils.validators import validar_monto, validar_categoria, validar_descripcion
from utils.formatters import format_moneda, format_fecha
import database as db

class TestFunctionalLogic(unittest.TestCase):

    def setUp(self):
        # Crear base de datos temporal en memoria para pruebas aisladas
        self.test_db_path = "test_gastos_temp.db"
        db.DATABASE_FILE = self.test_db_path
        db.inicializar_bd()
        db.insertar_categorias_defecto()

    def tearDown(self):
        if os.path.exists(self.test_db_path):
            os.remove(self.test_db_path)

    # 1. PRUEBAS DE VALIDACIÓN DE ENTRADAS DE USUARIO
    def test_validar_monto_valido(self):
        self.assertEqual(validar_monto("1500.50"), 1500.50)
        self.assertEqual(validar_monto("100"), 100.0)

    def test_validar_monto_invalido(self):
        self.assertIsNone(validar_monto("-50"))
        self.assertIsNone(validar_monto("abc"))
        self.assertIsNone(validar_monto("0"))

    def test_validar_categoria_valida(self):
        cat = validar_categoria("1")
        self.assertIsNotNone(cat)
        self.assertIsInstance(cat, str)

    def test_validar_categoria_invalida(self):
        self.assertIsNone(validar_categoria("999"))
        self.assertIsNone(validar_categoria("invalid"))

    def test_validar_descripcion(self):
        self.assertEqual(validar_descripcion("/saltar"), "")
        self.assertEqual(validar_descripcion("Supermercado"), "Supermercado")
        texto_largo = "A" * 600
        self.assertEqual(len(validar_descripcion(texto_largo)), 500)

    # 2. PRUEBAS DE FORMATEO DE MONEDA Y FECHAS
    def test_format_moneda(self):
        self.assertEqual(format_moneda(1500.5), "$1500.50")
        self.assertEqual(format_moneda(0), "$0.00")

    def test_format_fecha(self):
        self.assertEqual(format_fecha("2026-08-12"), "12/08/2026")
        self.assertEqual(format_fecha("2026-08-12T15:30:00"), "12/08/2026 15:30")

    # 3. PRUEBAS FUNCIONALES DE BASE DE DATOS Y USUARIOS
    def test_creacion_y_login_usuario(self):
        pass_hash = hashlib.sha256("secret123".encode('utf-8')).hexdigest()
        user = db.registrar_usuario_web("Test User", "test@spendbot.com", pass_hash)
        self.assertIsNotNone(user)
        self.assertEqual(user['email'], "test@spendbot.com")
        self.assertTrue(user['token_vinculacion'].startswith("VIN-"))

        # Recuperar usuario
        user_db = db.obtener_usuario_por_email("test@spendbot.com")
        self.assertIsNotNone(user_db)
        self.assertEqual(user_db['password_hash'], pass_hash)

    # 4. PRUEBAS DE REGISTRO DE GASTOS Y TRANSACCIONES
    def test_registro_gasto_y_estadisticas(self):
        pass_hash = hashlib.sha256("pass123".encode('utf-8')).hexdigest()
        user = db.registrar_usuario_web("Juan Perez", "juan@spendbot.com", pass_hash)
        user_id = user['id_usuario']

        # Registrar gasto con la firma de database.py
        db.registrar_gasto(
            id_usuario=user_id,
            monto=4500.0,
            categoria="comida",
            descripcion="Almuerzo de trabajo",
            origen="Telegram",
            tipo="GASTO"
        )

        # Verificar estadísticas de gastos
        stats = db.obtener_gastos_mes(user_id)
        self.assertEqual(len(stats), 1)
        self.assertEqual(stats[0][0], 4500.0)

if __name__ == '__main__':
    unittest.main()
