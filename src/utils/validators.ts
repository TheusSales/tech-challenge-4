// Validação só o suficiente para evitar uma ida à API que já se sabe que vai
// falhar. A regra final é sempre a do backend.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const required = (label: string) => (value: string | undefined) =>
  value && value.trim().length > 0 ? true : `${label} é obrigatório.`;

export const validEmail = (value: string | undefined) =>
  value && EMAIL_RE.test(value.trim()) ? true : 'Informe um e-mail válido.';

export const minLength = (min: number) => (value: string | undefined) =>
  (value ?? '').length >= min ? true : `Use ao menos ${min} caracteres.`;
