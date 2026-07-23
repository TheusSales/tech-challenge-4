import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthProfessor } from '../types/auth';

export interface AuthState {
  token: string | null;
  professor: AuthProfessor | null;
  // `true` enquanto o boot lê o SecureStore. Sem isso o RootNavigator
  // piscaria a tela de login antes do token guardado ser restaurado.
  hydrating: boolean;
}

const initialState: AuthState = {
  token: null,
  professor: null,
  hydrating: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ token: string; professor: AuthProfessor }>) => {
      state.token = action.payload.token;
      state.professor = action.payload.professor;
    },
    // Só o token, sem professor: usado no boot, antes de o /auth/me confirmar
    // quem é o dono do token restaurado.
    tokenRestored: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    },
    logout: (state) => {
      state.token = null;
      state.professor = null;
    },
    hydrationFinished: (state) => {
      state.hydrating = false;
    },
  },
});

export const { setCredentials, tokenRestored, logout, hydrationFinished } = authSlice.actions;
export default authSlice.reducer;
