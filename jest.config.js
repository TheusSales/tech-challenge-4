// O app formata datas no fuso local do aparelho, que é o comportamento certo
// para o usuário — mas deixa os testes dependentes do relógio da máquina. Um
// post das 00:24 UTC cai no dia anterior no Brasil. Fixar o fuso aqui mantém
// os testes determinísticos em qualquer máquina e no CI.
process.env.TZ = 'America/Sao_Paulo';

/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // O preset do Expo não transpila node_modules por padrão, mas boa parte do
  // ecossistema RN é publicada em ESM/JSX não compilado. `immer`, `react-redux`
  // e `redux` entram na lista pelo mesmo motivo: o Jest carrega o build ESM
  // deles e engasga no `import`.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|immer|react-redux|redux|reselect|@reduxjs/toolkit))',
  ],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
};
