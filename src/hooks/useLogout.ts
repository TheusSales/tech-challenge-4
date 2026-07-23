import { useCallback } from 'react';
import { useAppDispatch } from './useAuth';
import { logout } from '../store/authSlice';
import { clearToken } from '../api/tokenStorage';

// Saída explícita pelo botão "Sair". O descarte do cache do RTK Query acontece
// no reducer raiz, ao ver a action `logout` — ver src/store/index.ts.
export const useLogout = () => {
  const dispatch = useAppDispatch();

  return useCallback(async () => {
    await clearToken();
    dispatch(logout());
  }, [dispatch]);
};
