# Logistics Intelligence Dashboard

Un panel de BI avanzado para la auditoría y análisis de ecosistemas de datos logísticos, financieros y operativos. Permite la ingesta dinámica de archivos Excel/CSV y genera visualizaciones interactivas e insights mediante IA.

## Características Principales

- **Auditoría Multidimensional:** Análisis profundo de reportes corporativos.
- **Visualización Dinámica:** Gráficos interactivos construidos con Chart.js.
- **Hugo Chat Bot:** Asistente de IA integrado para diagnósticos operativos automáticos.
- **Procesamiento Local:** Los archivos se procesan enteramente en el navegador, garantizando privacidad y seguridad.
- **Diseño Responsivo:** Interfaz optimizada para diferentes tamaños de pantalla utilizando Vanilla CSS.

## Stack Tecnológico

- **Frontend:** TypeScript, HTML5, CSS3 (Vanilla).
- **Procesamiento de Datos:** [xlsx (SheetJS)](https://sheetjs.com/).
- **Gráficos:** [Chart.js](https://www.chartjs.org/).
- **Herramientas:** Vite, Vitest, ESLint.

## Estructura del Proyecto

- `src/main.ts`: Punto de entrada y gestión de eventos.
- `src/state.ts`: Gestión del estado reactivo.
- `src/services/excelParser.ts`: Lógica de lectura de archivos.
- `src/services/aiAnalyzer.ts`: Motor de generación de insights.
- `src/ui/render.ts`: Lógica de manipulación del DOM.

## Guía de Inicio

### Requisitos

- Node.js (v18 o superior)
- npm

### Instalación

```bash
npm install
```

### Desarrollo

```bash
npm run dev
```

### Construcción

```bash
npm run build
```

### Pruebas

```bash
npm run test
```

## Seguridad

Este proyecto implementa políticas de seguridad estrictas (CSP) para mitigar riesgos de XSS y asegurar que los datos sensibles no salgan del cliente.

## Licencia

Este proyecto es parte de la **Torre de Control** y hereda su licencia MIT.
