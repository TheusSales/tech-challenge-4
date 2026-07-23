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
