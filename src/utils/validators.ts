// Validação só o suficiente para evitar uma ida à API que já se sabe que vai
// falhar. A regra final é sempre a do backend.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Recebe a mensagem pronta, e não o nome do campo: montar "<campo> é
// obrigatório" quebra a concordância em português ("A senha é obrigatório").
export const required = (message: string) => (value: string | undefined) =>
  value && value.trim().length > 0 ? true : message;

export const validEmail = (value: string | undefined) =>
  value && EMAIL_RE.test(value.trim()) ? true : 'Informe um e-mail válido.';

export const minLength = (min: number) => (value: string | undefined) =>
  (value ?? '').length >= min ? true : `Use ao menos ${min} caracteres.`;
