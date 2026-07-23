export interface Professor {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface ProfessorInput {
  name: string;
  email: string;
  // Na edição, omitir a senha mantém a atual (COALESCE no backend).
  password?: string;
}

export interface ProfessorMutationResponse {
  message: string;
  professor: Professor;
}
