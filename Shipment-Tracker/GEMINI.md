# Shipment Tracker - Real-time Logistics Dashboard

Este es un tablero interactivo para el seguimiento de envíos de carga (marítimo, aéreo y terrestre) en tiempo real, con capacidades de visualización en mapas y análisis de datos.

## Objetivos del Proyecto
- Proporcionar visibilidad clara del estado de los envíos.
- Visualización geográfica de rutas y posiciones actuales.
- Gestión de agentes y contactos logísticos.
- Funcionalidad offline mediante PWA (Progressive Web App).

## Stack Tecnológico
- **Frontend:** TypeScript, HTML5, Vanilla CSS.
- **Bundler:** Vite.
- **PWA:** `vite-plugin-pwa`.
- **Visualización:** Chart.js para estadísticas y MapBox/Leaflet para mapas.
- **Testing:** Vitest.

## Estructura de Archivos
- `src/main.ts`: Punto de entrada y gestión del estado de la UI.
- `src/services/`: Lógica de negocio (shipments, agents, maps, charts).
- `src/ui/`: Componentes reutilizables de UI.
- `src/utils/`: Helpers y utilidades de DOM.
- `public/`: Activos estáticos y manifiesto PWA.

## Guías de Desarrollo
- **Tipado:** Evitar el uso de `any`. Definir interfaces en `src/types.ts`.
- **Internacionalización:** Utilizar `I18nService` para todos los textos visibles.
- **Rendimiento:** Implementar debounce en búsquedas y filtros.
- **Offline:** Verificar siempre el estado `state.isOnline` para operaciones que requieran red.

## Comandos Útiles
- `npm run dev`: Desarrollo local.
- `npm run build`: Compilación para producción (genera service worker).
- `npm run test`: Ejecución de pruebas unitarias.
- `npm run lint`: Verificación de reglas de código.
- `npm run format`: Formateo automático de archivos.
