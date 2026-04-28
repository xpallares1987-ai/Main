# Torre de Control - Monorepo

Este es el repositorio central (Monorepo) que agrupa diversas aplicaciones industriales y de logística desarrolladas con estándares de alta calidad, Vanilla CSS y TypeScript estricto.

## Proyectos Incluidos

1.  **[BPMN 2.0 Interactive Modeler](./BPMN-Modeler/):** Editor de procesos industriales interactivo con soporte para la nube (GitHub Gists).
2.  **[Shipment Tracker](./Shipment-Tracker/):** Sistema de seguimiento de embarques con analítica integrada y mapas dinámicos.
3.  **[Interactive Dashboard](./Logistics-Dashboard/):** Panel de control para análisis de auditoría y KPIs logísticos.
4.  **[Shared Utils](./Shared-Utils/):** Núcleo de utilidades compartidas y servicios de seguridad.

## Estándares del Proyecto

- **Lenguaje:** TypeScript 5+ (Modo Estricto).
- **Estilos:** Vanilla CSS (Zero Frameworks).
- **Arquitectura:** Monorepo con `TurboRepo` y `npm` workspaces.
- **Linting:** ESLint 9 (Flat Config) + Prettier.
- **Pruebas:** Vitest (Zero Failures).
- **Seguridad:** CSP riguroso y auditoría de dependencias limpia.

## Guía de Inicio

```bash
# Instalar todas las dependencias
npm install

# Construir todos los proyectos
npm run build

# Ejecutar pruebas
npm run test

# Formatear código
npm run format
```

## Despliegue

El monorepo está configurado para despliegue automático en GitHub Pages mediante GitHub Actions.

## Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.
