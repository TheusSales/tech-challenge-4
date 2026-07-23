import { configureStore } from '@reduxjs/toolkit';
import { api } from '../api';
import authReducer from './authSlice';
import { listenerMiddleware } from './listeners';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [api.reducerPath]: api.reducer,
  },
  // O listener precisa vir antes do middleware da API para reagir ao logout
  // antes que qualquer requisição pendente seja processada.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(listenerMiddleware.middleware).concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
