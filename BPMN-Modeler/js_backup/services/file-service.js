function resolveTarget(target) {
  if (!target) {
    throw new Error('No se recibió un target válido');
  }

  if (typeof target === 'string') {
    const element = document.querySelector(target);

    if (!element) {
      throw new Error(`No se encontró el elemento: ${target}`);
    }

    return element;
  }

  return target;
}

function ensureFile(file) {
  if (!file) {
    throw new Error('No se recibió ningún archivo');
  }

  return file;
}

function normalizeFileName(fileName, fallback = 'diagram.bpmn') {
  if (typeof fileName !== 'string' || !fileName.trim()) {
    return fallback;
  }

  return fileName.trim();
}

export function resetFileInput(fileInput) {
  const input = resolveTarget(fileInput);
  input.value = '';
}

export function openFileDialog(fileInput) {
  const input = resolveTarget(fileInput);
  input.click();
}

export function waitForSingleFileSelection(fileInput) {
  const input = resolveTarget(fileInput);

  return new Promise((resolve) => {
    const handleChange = () => {
      const file = input.files?.[0] || null;
      input.removeEventListener('change', handleChange);
      resolve(file);
    };

    input.addEventListener('change', handleChange, { once: true });
    input.click();
  });
}

export function readFileAsText(file) {
  const safeFile = ensureFile(file);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(String(reader.result || ''));
    };

    reader.onerror = () => {
      reject(new Error(`No se pudo leer el archivo: ${safeFile.name || 'desconocido'}`));
    };

    reader.readAsText(safeFile);
  });
}

export async function openTextFile(fileInput) {
  const file = await waitForSingleFileSelection(fileInput);

  if (!file) {
    return null;
  }

  const text = await readFileAsText(file);

  return {
    file,
    name: normalizeFileName(file.name),
    text,
  };
}

export function downloadFile(fileName, content, mimeType = 'application/octet-stream') {
  const safeName = normalizeFileName(fileName);
  const safeContent = typeof content === 'string' ? content : String(content ?? '');
  const blob = new Blob([safeContent], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = safeName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);

  return {
    fileName: safeName,
    size: safeContent.length,
  };
}
