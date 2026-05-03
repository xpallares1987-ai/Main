# Torre de Control

Este es el repositorio central (Monorepo) que agrupa diversas aplicaciones industriales y de logística desarrolladas con estándares de alta calidad, Next.js y TypeScript estricto.

## Proyectos Incluidos

1.  **[BPMN 2.0 Interactive Modeler](./BPMN-Modeler/):** Editor de procesos industriales interactivo con soporte para la nube (GitHub Gists).
2.  **[Shipment Tracker](./Shipment-Tracker/):** Sistema de seguimiento de embarques con analítica integrada y mapas dinámicos.
3.  **[Logistics Intelligence](./Logistics-Dashboard/):** Panel de control avanzado para auditoría, KPIs y gestión unificada de **Almacenes Externos** con sincronización local automatizada.

## Estándares del Proyecto

- **Lenguaje:** TypeScript 5+ (Modo Estricto).
- **Frontend:** Next.js (Logistics Dashboard) & Vite (Shipment/BPMN).
- **Estilos:** Vanilla CSS (Zero Frameworks).
- **Arquitectura:** Monorepo con utilidades compartidas (**Share-Utils**) bajo `@repo/shared`.
- **Automatización:** Sincronización de datos mediante PowerShell (Local-Sync).
- **Linting:** ESLint 9 (Flat Config) + Prettier.
- **Pruebas:** Vitest (Zero Failures).

## Guía de Inicio

```bash
# Instalar todas las dependencias
npm install

# Iniciar Dashboard Logístico (Next.js)
npm run dev:saica

# Iniciar Modeler o Tracker (Vite)
npm run dev:bpmn
npm run dev:shipment
```

## Licencia

MIT - ver el archivo [LICENSE](LICENSE) para más detalles.
