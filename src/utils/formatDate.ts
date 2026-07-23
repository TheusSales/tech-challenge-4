const MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

const pad = (n: number) => String(n).padStart(2, '0');

// Formatação manual em vez de Intl/toLocaleDateString: o suporte a locale no
// Hermes depende de o build incluir ICU, e um device sem ICU cairia em inglês
// silenciosamente. Datas inválidas devolvem string vazia, para a tela não
// exibir "Invalid Date".
const parse = (iso: string): Date | null => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
};

// "22 de julho de 2026"
export const formatDate = (iso: string): string => {
  const date = parse(iso);
  if (!date) {
    return '';
  }
  return `${date.getDate()} de ${MESES[date.getMonth()]} de ${date.getFullYear()}`;
};

// "22/07/2026 às 21:24"
export const formatDateTime = (iso: string): string => {
  const date = parse(iso);
  if (!date) {
    return '';
  }
  const dia = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
  return `${dia} às ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
