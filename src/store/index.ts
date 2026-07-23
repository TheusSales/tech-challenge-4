import { configureStore } from '@reduxjs/toolkit';
import { api } from '../api';
import authReducer from './authSlice';
import { listenerMiddleware } from './listeners';

// Fábrica em vez de um store solto: os testes precisam de uma instância limpa
// por caso, senão o cache do RTK Query e a sessão vazam de um teste para o
// outro. O app usa a instância única exportada abaixo.
export const createStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
      [api.reducerPath]: api.reducer,
    },
    // O listener precisa vir antes do middleware da API para reagir ao logout
    // antes que qualquer requisição pendente seja processada.
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().prepend(listenerMiddleware.middleware).concat(api.middleware),
  });

export const store = createStore();

export type AppStore = ReturnType<typeof createStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
