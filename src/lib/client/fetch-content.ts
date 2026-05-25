export type FetchContentResult<T> =
  | { data: T }
  | { error: { message: string; status: number | null } }

function errorMessageFromBody(body: unknown, fallback: string) {
  if (body && typeof body === 'object' && 'error' in body) {
    const message = (body as { error?: unknown }).error
    if (typeof message === 'string' && message.trim().length > 0) return message
  }
  return fallback
}

export async function fetchContent<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<FetchContentResult<T>> {
  try {
    const response = await fetch(input, init)
    const body = await response.json().catch(() => null)

    if (!response.ok) {
      return {
        error: {
          message: errorMessageFromBody(body, `Request failed with status ${response.status}`),
          status: response.status,
        },
      }
    }

    return { data: body as T }
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Unable to load content.',
        status: null,
      },
    }
  }
}

export function fetchContentErrorMessage(results: Array<FetchContentResult<unknown>>) {
  return results.find((result): result is { error: { message: string; status: number | null } } => 'error' in result)
    ?.error.message ?? null
}

export function contentDataOr<T>(result: FetchContentResult<T>, fallback: T): T {
  return 'data' in result ? result.data : fallback
}
