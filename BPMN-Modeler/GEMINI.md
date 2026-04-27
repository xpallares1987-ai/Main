# BPMN 2.0 Interactive Modeler - Camunda 8

Este proyecto es un modelador BPMN basado en la web diseñado para uso personal o profesional, con soporte específico para Camunda 8 y paneles de propiedades personalizados.

## Objetivos del Proyecto
- Proporcionar una interfaz intuitiva para modelar procesos BPMN 2.0.
- Integración nativa con Camunda 8 (Zeebe).
- Capacidad de importar y exportar archivos `.bpmn` y `.xml`.
- Persistencia de sesión local para evitar pérdida de datos accidental.
- Gestión de múltiples pestañas de diagramas.

## Stack Tecnológico
- **Frontend:** TypeScript, HTML5, CSS3 (Vanilla).
- **Bundler:** Vite.
- **Testing:** Vitest.
- **Librerías Core:**
  - `bpmn-js`: Motor de modelado.
  - `zeebe-bpmn-moddle`: Soporte para extensiones de Camunda 8.
  - `bpmn-js-properties-panel`: Panel de propiedades dinámico.

## Estructura de Archivos
- `index.html`: Punto de entrada de la aplicación.
- `src/main.ts`: Punto de entrada de TypeScript y orquestación.
- `src/state.ts`: Gestión del estado global reactivo.
- `src/types.ts`: Definiciones de tipos e interfaces.
- `src/services/`: Capa de lógica de negocio (modeler, storage, xml, cloud).
- `src/ui/`: Componentes de interfaz de usuario y renderizado.
- `src/utils/`: Funciones de utilidad y helpers de DOM.
- `assets/`: Recursos estáticos y estilos.
- `xml/`: Diagramas de ejemplo y por defecto.

## Guías de Desarrollo
- **TypeScript:** Mantener tipado estricto. Evitar el uso de `any`.
- **Estado:** Utilizar el objeto `state` en `src/state.ts` para la gestión del estado global.
- **Validación:** Asegurar que todos los elementos BPMN sigan el estándar 2.0 y las extensiones de Camunda 8.
- **Testing:** Escribir tests unitarios en archivos `.test.ts` usando Vitest para servicios y utilidades.

## Comandos Útiles
- `npm run dev`: Inicia el servidor de desarrollo.
- `npm run build`: Compila el proyecto para producción.
- `npm run test`: Ejecuta los tests unitarios.
- `npm run lint`: Ejecuta el linter.
- `npm run format`: Formatea el código con Prettier.
