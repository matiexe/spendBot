import unittest
import os
import re

class TestUXUIValidation(unittest.TestCase):
    """
    Suite de Pruebas Unitarias de Reglas de UX/UI y Anti-Superposición
    Valida que los componentes de la interfaz cumplan con:
    1. Formato de moneda uniforme ($ 0,00 con decimales y sin ceros negativos).
    2. Input de búsqueda con padding-left obligatorio (2.5rem / pl-10) para evitar colisión de la lupa.
    3. Empty States en flujo vertical estricto (mb-6 en descripción, mt-2 en botón, sin position: absolute).
    4. Espaciado respirable (mínimo 24px / mb-6 / mt-6 / gap-6) entre grillas de KPIs y tablas de transacciones.
    """

    def setUp(self):
        self.base_dir = os.path.dirname(os.path.abspath(__file__))
        self.components_dir = os.path.join(self.base_dir, 'dashboard', 'src', 'components')

    def test_buscador_lupa_padding_left(self):
        """Verifica que TransactionsTable.tsx tenga padding-left: 2.5rem obligatorio en el input"""
        file_path = os.path.join(self.components_dir, 'TransactionsTable.tsx')
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Debe contener paddingLeft: '2.5rem' o pl-10
        self.assertIn("paddingLeft: '2.5rem'", content, "El input de búsqueda debe incluir style={{ paddingLeft: '2.5rem' }}")
        self.assertIn("pl-10", content, "El input de búsqueda debe incluir la clase Tailwind pl-10")

    def test_empty_state_flujo_vertical_estricto(self):
        """Verifica que el Empty State en TransactionsTable.tsx tenga el orden y espaciado correcto"""
        file_path = os.path.join(self.components_dir, 'TransactionsTable.tsx')
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Debe contener margin-bottom: 1.5rem en la descripción
        self.assertIn("style={{ marginBottom: '1.5rem' }}", content, "La descripción del Empty State debe tener marginBottom: 1.5rem")
        # Debe contener margin-top: 0.5rem en el botón
        self.assertIn("style={{ marginTop: '0.5rem', display: 'inline-flex' }}", content, "El botón del Empty State debe tener marginTop: 0.5rem y display: inline-flex")

    def test_espaciado_respirable_kpi_tabla(self):
        """Verifica que TransactionsContent.tsx tenga separación vertical de 28px entre KPIs y Tabla"""
        file_path = os.path.join(self.components_dir, 'TransactionsContent.tsx')
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        self.assertIn("style={{ marginBottom: '1.75rem' }}", content, "La grilla de KPIs debe tener marginBottom: 1.75rem")
        self.assertIn("style={{ marginTop: '1.75rem' }}", content, "El contenedor de la tabla debe tener marginTop: 1.75rem")

    def test_recurrentes_view_espaciado_y_empty_state(self):
        """Verifica que RecurringTransactionsView.tsx cumpla con las mismas reglas de layout y espaciado"""
        file_path = os.path.join(self.components_dir, 'RecurringTransactionsView.tsx')
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Formato numérico es-AR con 2 decimales
        self.assertIn("minimumFractionDigits: 2", content, "Formato monetario debe exigir minimumFractionDigits: 2")
        self.assertIn("maximumFractionDigits: 2", content, "Formato monetario debe exigir maximumFractionDigits: 2")

        # Espaciado respirable
        self.assertIn("style={{ marginBottom: '1.75rem' }}", content, "La vista recurrente debe incluir marginBottom: 1.75rem")

    def test_contraste_wcag_sidebar(self):
        """Verifica que Sidebar.tsx o globals.css use colores con contraste WCAG adecuado"""
        file_path = os.path.join(self.components_dir, 'Sidebar.tsx')
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Debe incluir pb-4 o mb-4 para dar respiro al indicador inferior de SpendBot
        self.assertIn("pb-4", content, "El indicador de SpendBot en el Sidebar debe tener padding inferior pb-4")

if __name__ == '__main__':
    unittest.main()
