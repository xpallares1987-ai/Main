# Shipment Tracker - Real-time Logistics Dashboard

Tablero interactivo para el seguimiento de envíos de carga (marítimo, aéreo y terrestre) en tiempo real, con capacidades de visualización en mapas y análisis de datos.

## Características Principales

- **Seguimiento en Tiempo Real:** Visibilidad clara del estado y ubicación de los embarques.
- **Mapas Interactivos:** Visualización geográfica de rutas y posiciones actuales.
- **Gestión de Agentes:** Directorio integrado de contactos y agentes logísticos.
- **Capacidad Offline (PWA):** Funciona sin conexión mediante Service Workers.
- **Analítica Integrada:** Gráficos estadísticos sobre el rendimiento de los envíos.

## Stack Tecnológico

- **Frontend:** TypeScript, HTML5, Vanilla CSS.
- **PWA:** `vite-plugin-pwa`.
- **Mapas:** Integración con MapBox/Leaflet.
- **Gráficos:** Chart.js.
- **Iconografía:** Lucide Icons.
- **Herramientas:** Vite, Vitest.

## Estructura del Proyecto

- `src/main.ts`: Punto de entrada y gestión de la UI.
- `src/services/`: Lógica de seguimiento, agentes y mapas.
- `src/ui/`: Componentes reutilizables.
- `public/`: Manifiesto PWA y activos estáticos.

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

## Licencia

Este proyecto es parte de la **Torre de Control** y hereda su licencia MIT.
