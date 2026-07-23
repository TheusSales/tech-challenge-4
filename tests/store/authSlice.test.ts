import reducer, {
  setCredentials,
  tokenRestored,
  logout,
  hydrationFinished,
  type AuthState,
} from '../../src/store/authSlice';

const PROFESSOR = { id: 1, name: 'Administrador FIAP', email: 'admin@fiap.com' };

const loggedIn: AuthState = {
  token: 'token-valido',
  professor: PROFESSOR,
  hydrating: false,
};

describe('authSlice', () => {
  it('começa deslogado e em hidratação', () => {
    const state = reducer(undefined, { type: '@@INIT' });
    expect(state).toEqual({ token: null, professor: null, hydrating: true });
  });

  it('guarda token e professor no login', () => {
    const state = reducer(undefined, setCredentials({ token: 'abc', professor: PROFESSOR }));
    expect(state.token).toBe('abc');
    expect(state.professor).toEqual(PROFESSOR);
  });

  // O boot restaura o token antes de saber de quem ele é: o /auth/me só pode
  // ser chamado depois que o token está no state, porque é dele que o
  // prepareHeaders monta o header Authorization.
  it('restaura só o token, sem professor', () => {
    const state = reducer(undefined, tokenRestored('token-do-storage'));
    expect(state.token).toBe('token-do-storage');
    expect(state.professor).toBeNull();
  });

  it('limpa token e professor no logout', () => {
    const state = reducer(loggedIn, logout());
    expect(state.token).toBeNull();
    expect(state.professor).toBeNull();
  });

  // Se o logout reativasse a hidratação, o RootNavigator voltaria ao spinner e
  // ficaria preso lá — o hydrateAuth só roda uma vez, no mount.
  it('não volta a hidratar depois do logout', () => {
    const state = reducer(loggedIn, logout());
    expect(state.hydrating).toBe(false);
  });

  it('encerra a hidratação sem mexer na sessão', () => {
    const state = reducer({ ...loggedIn, hydrating: true }, hydrationFinished());
    expect(state.hydrating).toBe(false);
    expect(state.token).toBe('token-valido');
  });
});
