// Espelha os VARCHAR de src/scripts/schema.sql do backend. Estourar qualquer
// um deles fazia o Postgres recusar a query; hoje o backend responde 400 com
// mensagem clara, mas o certo é o campo nem deixar digitar além disso.
export const LIMITES = {
  post: {
    titulo: 150,
    autor: 100,
    // `conteudo` é TEXT no banco: sem limite.
  },
  professor: {
    name: 120,
    email: 160,
  },
  student: {
    name: 120,
    email: 160,
    ra: 40,
  },
} as const;
