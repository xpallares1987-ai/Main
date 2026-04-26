# Logistics Intelligence Dashboard

Un panel de BI avanzado para la auditoría y análisis de ecosistemas de datos logísticos, financieros y operativos. Permite la ingesta dinámica de archivos Excel/CSV y genera visualizaciones interactivas e insights mediante IA.

## Objetivos del Proyecto
- Facilitar la auditoría multidimensional de reportes corporativos.
- Proporcionar inteligencia visual mediante gráficos dinámicos.
- Generar diagnósticos operativos automáticos (Hugo Chat Bot).
- Asegurar un entorno de análisis rápido y seguro.

## Stack Tecnológico
- **Frontend:** TypeScript, HTML5, CSS3 (Vanilla).
- **Bundler:** Vite.
- **Librerías Core:**
  - `xlsx` (SheetJS): Motor de procesamiento de hojas de cálculo.
  - `chart.js`: Visualización de datos.
  - `vitest`: Pruebas unitarias.

## Estructura de Archivos
- `src/main.ts`: Punto de entrada y orquestación de eventos.
- `src/state.ts`: Gestión del estado reactivo de la aplicación.
- `src/services/`:
  - `excelParser.ts`: Lógica de lectura y sanitización de archivos.
  - `aiAnalyzer.ts`: Motor de generación de insights operativos.
  - `chartBuilder.ts`: Gestión de instancias de Chart.js.
- `src/ui/`:
  - `render.ts`: Lógica de manipulación del DOM.
  - `components.ts`: Plantillas de elementos UI (KPIs, Toasts, Chips).
- `assets/css/app.css`: Estilos globales y variables de marca.

## Seguridad e Integridad
- **CSP Estricta:** Implementada para mitigar ataques XSS eliminando scripts `'unsafe-inline'`.
- **Sanitización:** Los datos se escapan sistemáticamente antes de su renderizado en el DOM.
- **Privacidad:** El procesamiento de archivos ocurre localmente en el navegador; ningún dato es enviado a servidores externos.

## Comandos Útiles
- `npm run dev`: Servidor de desarrollo (HMR).
- `npm run build`: Compilación optimizada para producción.
- `npm run lint`: Verificación estática de código.
- `npm run test`: Ejecución de pruebas con Vitest.
