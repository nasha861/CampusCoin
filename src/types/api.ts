export interface ApiSuccess<T> {
  data: T;
  message?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface ApiErrorBody {
  message: string;
  code?: string;
  fieldErrors?: Record<string, string>;
}

export class ApiError extends Error {
  code?: string;
  status?: number;
  fieldErrors?: Record<string, string>;

  constructor(message: string, options?: { code?: string; status?: number; fieldErrors?: Record<string, string> }) {
    super(message);
    this.name = 'ApiError';
    this.code = options?.code;
    this.status = options?.status;
    this.fieldErrors = options?.fieldErrors;
  }
}
