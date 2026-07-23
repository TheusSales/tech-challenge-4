// Envelope das listagens paginadas (/posts/admin, /professors, /students).
// Espelha src/utils/pagination.ts do backend.
export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface PageParams {
  page?: number;
  pageSize?: number;
}

// Todo erro do backend responde { message }.
export interface ApiError {
  message: string;
}
