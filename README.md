# Torre de Control (Control Tower)

Este es el repositorio central (Monorepo) que agrupa diversas aplicaciones industriales y de logística desarrolladas con estándares de alta calidad, Vanilla CSS y TypeScript estricto.

## Proyectos Incluidos

1.  **[BPMN 2.0 Interactive Modeler](./BPMN-Modeler/):** Editor de procesos industriales interactivo con soporte para Camunda 8 y persistencia en la nube.
2.  **[Logistics Intelligence Dashboard](./Logistics-Dashboard/):** Panel de BI para auditoría de datos, procesamiento de Excel y análisis con IA.
3.  **[Shipment Tracker](./Shipment-Tracker/):** Sistema de seguimiento de embarques en tiempo real con mapas interactivos y capacidades PWA.

## Estándares del Proyecto

- **Lenguaje:** TypeScript 5+ (Modo Estricto).
- **Estilos:** Vanilla CSS (Zero Frameworks) - Enfoque en rendimiento y flexibilidad.
- **Despliegue:** Configurado para GitHub Pages en subcarpetas (requiere `basePath` y `.nojekyll`).
- **Arquitectura:** Monorepo gestionado con `TurboRepo`.
- **Linting:** ESLint 9 (Flat Config) + Prettier para un estilo de código consistente.
- **Pruebas:** Vitest para asegurar la integridad de cada módulo.
- **Seguridad:** Implementación de CSP, sanitización de datos y procesamiento local de información sensible.

## Estructura del Workspace

```text
/
├── BPMN-Modeler/       # Modelador de procesos
├── Logistics-Dashboard/# Dashboard de auditoría e IA
├── Shipment-Tracker/   # Seguimiento de envíos (PWA)
├── package.json        # Configuración raíz y scripts de Turbo
└── turbo.json          # Orquestación de tareas
```

## Guía de Inicio Rápido

### Instalación

```bash
npm install
```

### Comandos de Turbo

```bash
# Iniciar todos los proyectos en modo desarrollo
npm run dev

# Construir todos los proyectos para producción
npm run build

# Ejecutar todos los tests
npm run test

# Verificar linting en todo el monorepo
npm run lint
```

## Configuración

Copia el archivo `.env.example` a `.env` y configura las variables necesarias (principalmente para la sincronización con GitHub Gist si usas el BPMN Modeler).

## Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.
