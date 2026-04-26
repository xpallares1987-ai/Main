import { downloadXmlFile } from './xml-service.js';

/**
 * Exporta el diagrama actual como archivo SVG.
 * @param {Object} modeler Instancia de bpmn-js
 * @param {string} fileName Nombre del archivo sin extensión
 */
export async function exportToSvg(modeler, fileName) {
  try {
    const { svg } = await modeler.saveSVG();
    await downloadXmlFile(`${fileName}.svg`, svg, 'image/svg+xml');
    return true;
  } catch (error) {
    console.error('Error exportando SVG:', error);
    throw error;
  }
}

/**
 * Exporta el diagrama actual como archivo PNG.
 * @param {Object} modeler Instancia de bpmn-js
 * @param {string} fileName Nombre del archivo sin extensión
 */
export async function exportToPng(modeler, fileName) {
  try {
    const { svg } = await modeler.saveSVG();

    const canvas = document.createElement('canvas');
    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      // Ajustamos el canvas al tamaño del SVG
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      // Fondo blanco opcional para el PNG
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `${fileName}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      URL.revokeObjectURL(url);
    };

    img.src = url;
    return true;
  } catch (error) {
    console.error('Error exportando PNG:', error);
    throw error;
  }
}
