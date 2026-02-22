export interface ApiSuccess<T = unknown> {
  success: true;
  message: string;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: { field: string; message: string }[];
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;
