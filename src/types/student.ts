export interface Student {
  id: number;
  name: string;
  email: string;
  ra: string | null;
  created_at: string;
}

export interface StudentInput {
  name: string;
  email: string;
  ra?: string | null;
}

export interface StudentMutationResponse {
  message: string;
  student: Student;
}
