const GITHUB_API_URL = 'https://api.github.com/gists';

/**
 * Guarda el diagrama en GitHub como un Gist.
 * @param {string} token GitHub Personal Access Token
 * @param {string} fileName Nombre del archivo
 * @param {string} content Contenido XML del diagrama
 * @param {string} gistId ID del Gist existente (opcional para actualizar)
 */
export async function saveToGitHub(token, fileName, content, gistId = null) {
  if (!token) {
    throw new Error('Se requiere un token de acceso de GitHub');
  }

  const method = gistId ? 'PATCH' : 'POST';
  const url = gistId ? `${GITHUB_API_URL}/${gistId}` : GITHUB_API_URL;

  const body = {
    description: 'BPMN Diagram saved from Interactive Modeler',
    public: false,
    files: {
      [fileName]: {
        content: content,
      },
    },
  };

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error al conectar con GitHub');
  }

  return await response.json();
}
