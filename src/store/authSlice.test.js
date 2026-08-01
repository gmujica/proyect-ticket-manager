import authReducer, {
  isAuthenticated,
  signedIn,
  signedOut,
  syncSettled,
  syncStarted
} from './authSlice';

const user = { id: 'u1', login: 'gmujica', avatarUrl: null };

describe('authSlice', () => {
  // Anything other than `checking` on boot would let the header render an answer
  // it does not have yet.
  it('starts out checking, with nobody signed in', () => {
    const state = authReducer(undefined, { type: 'INIT' });

    expect(state).toEqual({ user: null, status: 'checking', syncing: false });
  });

  it('stores the user on sign-in', () => {
    const state = authReducer(undefined, signedIn(user));

    expect(state).toMatchObject({ user, status: 'authenticated' });
  });

  it('clears the user on sign-out', () => {
    const signedInState = authReducer(undefined, signedIn(user));
    const state = authReducer(signedInState, signedOut());

    expect(state).toMatchObject({ user: null, status: 'anonymous' });
  });

  it('stops reporting a sync in flight after signing out', () => {
    const syncingState = authReducer(
      authReducer(undefined, signedIn(user)),
      syncStarted()
    );

    expect(authReducer(syncingState, signedOut()).syncing).toBe(false);
  });

  it('tracks a save in flight', () => {
    const started = authReducer(undefined, syncStarted());

    expect(started.syncing).toBe(true);
    expect(authReducer(started, syncSettled()).syncing).toBe(false);
  });

  describe('isAuthenticated', () => {
    it('is false while still checking', () => {
      expect(isAuthenticated({ auth: authReducer(undefined, { type: 'INIT' }) })).toBe(
        false
      );
    });

    it('is false for an anonymous visitor', () => {
      expect(isAuthenticated({ auth: authReducer(undefined, signedOut()) })).toBe(
        false
      );
    });

    it('is true once signed in', () => {
      expect(isAuthenticated({ auth: authReducer(undefined, signedIn(user)) })).toBe(
        true
      );
    });
  });
});
