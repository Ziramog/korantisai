export class ApiError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number | null,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function userFacingError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === 'TIMEOUT') return 'La conexión tardó demasiado. Intentá de nuevo.';
    if (error.status === null) return 'No pudimos conectarnos. Revisá tu conexión.';
    if (error.status >= 500) return 'Korantis no está disponible por el momento.';
  }
  return 'No pudimos cargar este contenido.';
}
