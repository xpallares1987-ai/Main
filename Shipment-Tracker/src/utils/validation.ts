export const ValidationUtils = {
  /**
   * Valida un número de contenedor (ISO 6346) básico.
   * Formato: 4 letras + 7 números.
   */
  isValidContainer(container: string): boolean {
    const regex = /^[A-Z]{4}\d{7}$/;
    return regex.test(container.toUpperCase().trim());
  },

  /**
   * Valida un formato de HAWB/MAWB básico.
   * Ejemplo: Al menos 3 letras/números y un guion o espacio opcional.
   */
  isValidReference(ref: string): boolean {
    return ref.trim().length >= 5;
  }
};



