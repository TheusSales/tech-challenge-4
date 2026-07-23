import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '../store';

// Versões tipadas dos hooks do react-redux — evita anotar RootState em cada uso.
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const useAuth = () => useAppSelector((state) => state.auth);

export const useIsAuthenticated = () => useAppSelector((state) => state.auth.token !== null);
