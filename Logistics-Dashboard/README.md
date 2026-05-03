# Logistics Intelligence Dashboard

Un panel de BI avanzado para la auditoría, análisis de KPIs y gestión unificada de **Almacenes Externos**. Permite la ingesta dinámica de archivos Excel/CSV y la sincronización automática de datos mediante XML.

## Nuevas Capacidades
- **Gestión de Almacenes Externos:** Visualización unificada de Embarques, Recepciones y Stock (España/Francia).
- **Sincronización Local:** Botón "Actualizar" que ejecuta scripts de PowerShell (sin necesidad de administrador) para descargar datos en tiempo real.
- **Transformación de Datos:** Replicación exacta de lógicas de Power Query (redondeos, formatos europeos, filtros de año actual).
- **IA Audit:** Generación de diagnósticos operativos automáticos (Hugo Chat Bot).

## Stack Tecnológico
- **Framework:** Next.js (App Router).
- **Lenguaje:** TypeScript.
- **Utilidades:** `@repo/shared` (Share-Utils) para procesamiento de XML.
- **Visualización:** ApexCharts & Chart.js.

## Estructura de Datos
- `data/`: Contiene los archivos XML locales sincronizados.
- `scripts/`: Scripts de PowerShell para la descarga y unificación de fuentes externas.

## Comandos
- `npm run dev`: Servidor de desarrollo con HMR.
- `npm run build`: Compilación optimizada.
- `POST /api/external-warehouses/sync`: Endpoint para disparar la sincronización de datos.

## Seguridad
- Ejecución de scripts locales mediante políticas de bypass controladas.
- Procesamiento local de archivos (sin envío de datos sensibles a servidores externos).
- Sanitización estricta de valores XML.
