import axios from "axios";

type ApiResponseData = {
  message?: unknown;
  errors?: unknown;
};

type ApiRequestErrorOptions = {
  data?: ApiResponseData;
  messages?: string[];
  status?: number;
};

export class ApiRequestError extends Error {
  data?: ApiResponseData;
  messages: string[];
  status?: number;

  constructor(message: string, options: ApiRequestErrorOptions = {}) {
    super(message);
    this.name = "ApiRequestError";
    this.data = options.data;
    this.messages = options.messages ?? [message];
    this.status = options.status;
  }
}

function normalizeMessages(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        typeof item === "string" ? item.trim() : String(item ?? "").trim(),
      )
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value.trim() ? [value.trim()] : [];
  }

  return [];
}

export function createApiRequestError(
  error: unknown,
  fallback = "Something went wrong",
): ApiRequestError {
  if (error instanceof ApiRequestError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const data = (error.response?.data ?? {}) as ApiResponseData;
    const messages = [
      ...normalizeMessages(data.errors),
      ...normalizeMessages(data.message),
    ];

    return new ApiRequestError(
      messages[0] ?? error.message ?? fallback,
      {
        data,
        messages: messages.length > 0 ? messages : [error.message ?? fallback],
        status: error.response?.status,
      },
    );
  }

  if (error instanceof Error) {
    return new ApiRequestError(error.message || fallback, {
      messages: error.message ? [error.message] : [fallback],
    });
  }

  return new ApiRequestError(fallback, {
    messages: [fallback],
  });
}

export function getApiErrorMessages(error: unknown, fallback?: string): string[] {
  const apiError = createApiRequestError(error, fallback);
  return apiError.messages.length > 0 ? apiError.messages : [apiError.message];
}

export function getApiErrorMessage(error: unknown, fallback?: string): string {
  return getApiErrorMessages(error, fallback)[0] ?? fallback ?? "Something went wrong";
}

export function mapApiErrorsToFields<TField extends string>(
  error: unknown,
  matchers: Partial<Record<TField, RegExp | RegExp[]>>,
): Partial<Record<TField, string>> {
  const messages = getApiErrorMessages(error);
  const fieldErrors: Partial<Record<TField, string>> = {};

  for (const message of messages) {
    for (const [field, patternSet] of Object.entries(matchers) as Array<
      [TField, RegExp | RegExp[] | undefined]
    >) {
      if (!patternSet || fieldErrors[field]) {
        continue;
      }

      const patterns = Array.isArray(patternSet) ? patternSet : [patternSet];

      if (patterns.some((pattern) => pattern.test(message))) {
        fieldErrors[field] = message;
      }
    }
  }

  return fieldErrors;
}
