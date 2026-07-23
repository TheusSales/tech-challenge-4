import { authApi } from '../api/authApi';
import { readToken, clearToken } from '../api/tokenStorage';
import { setCredentials, tokenRestored, hydrationFinished } from './authSlice';
import type { AppDispatch } from './index';

// Roda uma vez no boot: restaura o token do SecureStore e confirma com o
// backend se ele ainda vale. Um token guardado pode ter expirado (8h) ou
// pertencer a um professor já excluído — nos dois casos o /auth/me responde
// 401 e a sessão é descartada antes de qualquer tela aparecer.
export const hydrateAuth = () => async (dispatch: AppDispatch) => {
  try {
    const token = await readToken();
    if (!token) {
      return;
    }

    // O token precisa estar no state antes da chamada: é dele que o
    // prepareHeaders monta o header Authorization.
    dispatch(tokenRestored(token));

    const professor = await dispatch(authApi.endpoints.me.initiate()).unwrap();
    dispatch(setCredentials({
      token,
      professor: { id: professor.id, name: professor.name, email: professor.email },
    }));
  } catch {
    // O 401 já disparou o logout no baseQueryWithReauth; aqui só garantimos
    // que o storage não fique com um token morto em falhas de outro tipo.
    await clearToken();
  } finally {
    dispatch(hydrationFinished());
  }
};
