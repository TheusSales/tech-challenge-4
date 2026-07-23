import type { Professor } from './professor';

export interface LoginInput {
  email: string;
  password: string;
}

// O professor devolvido pelo login traz só id/name/email — sem created_at.
export type AuthProfessor = Pick<Professor, 'id' | 'name' | 'email'>;

export interface LoginResponse {
  token: string;
  professor: AuthProfessor;
}
