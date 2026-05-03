# BPMN 2.0 Interactive Modeler

Este proyecto es un modelador BPMN basado en la web diseñado para uso personal o profesional, con soporte específico para Camunda 8 y paneles de propiedades personalizados.

## Características Principales

- **Modelado Intuitivo:** Interfaz moderna para diseñar procesos BPMN 2.0.
- **Camunda 8 Native:** Integración con extensiones de Zeebe y paneles de propiedades dinámicos.
- **Gestión de Archivos:** Importación y exportación de archivos `.bpmn` y `.xml`.
- **Persistencia Local:** Los cambios se guardan automáticamente en la sesión local para evitar pérdida de datos.
- **Multitarea:** Soporte para trabajar con múltiples diagramas en pestañas.
- **Sincronización Cloud:** Integración opcional con GitHub Gists para almacenamiento en la nube.

## Stack Tecnológico

- **Frontend:** TypeScript, HTML5, CSS3 (Vanilla).
- **Motor BPMN:** [bpmn-js](https://github.com/bpmn-io/bpmn-js).
- **Extensiones:** `zeebe-bpmn-moddle`, `bpmn-js-properties-panel`.
- **Herramientas:** Vite, Vitest, ESLint, Prettier.

## Estructura del Proyecto

- `src/main.ts`: Punto de entrada y orquestación.
- `src/state.ts`: Gestión del estado global reactivo.
- `src/services/`: Lógica de negocio (modeler, storage, xml, cloud).
- `src/ui/`: Componentes de interfaz de usuario.
- `assets/`: Estilos y recursos estáticos.

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
