import { createListenerMiddleware } from '@reduxjs/toolkit';
import { api } from '../api';
import { logout } from './authSlice';

export const listenerMiddleware = createListenerMiddleware();

// Ao sair, o cache do RTK Query é descartado junto com a sessão. Sem isso, os
// dados do professor anterior reapareceriam por um instante no próximo login,
// antes de o refetch chegar. Reagir à action (em vez de chamar isso no botão
// "Sair") cobre os dois caminhos de logout: o explícito e o automático que o
// baseQueryWithReauth dispara ao ver um 401.
listenerMiddleware.startListening({
  actionCreator: logout,
  effect: (_action, listenerApi) => {
    listenerApi.dispatch(api.util.resetApiState());
  },
});
