/* eslint-env jest */

// O expo-secure-store chama o módulo nativo, que não existe no ambiente de
// teste. O mock guarda em memória, então os testes também conseguem verificar
// o que foi gravado.
jest.mock('expo-secure-store', () => {
  const store = new Map();
  return {
    setItemAsync: jest.fn(async (key, value) => {
      store.set(key, value);
    }),
    getItemAsync: jest.fn(async (key) => (store.has(key) ? store.get(key) : null)),
    deleteItemAsync: jest.fn(async (key) => {
      store.delete(key);
    }),
    __reset: () => store.clear(),
  };
});
