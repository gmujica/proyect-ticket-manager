import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import filtersReducer from './filtersSlice';
import listsReducer, { addCard } from './listsSlice';
import { bootstrapSession, startBoardSync } from './sync';

const board = () => [
  {
    id: 'list-a',
    title: 'A',
    cards: [{ id: 'c1', text: 'one', type: 'task', priority: 'medium' }]
  }
];

const serverBoard = () => [
  {
    id: 'list-server',
    title: 'From the server',
    cards: [{ id: 'cs', text: 'remote', type: 'bug', priority: 'high' }]
  }
];

const makeStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
      filters: filtersReducer,
      lists: listsReducer
    },
    preloadedState: { lists: board() }
  });

const makeApi = (overrides = {}) => ({
  fetchMe: vi.fn().mockResolvedValue(null),
  fetchBoard: vi.fn().mockResolvedValue(null),
  putBoard: vi.fn().mockResolvedValue(1),
  ...overrides
});

const user = { id: 'u1', login: 'gmujica', avatarUrl: null };

describe('bootstrapSession', () => {
  it('marks the visitor anonymous when nobody is signed in', async () => {
    const store = makeStore();

    await bootstrapSession(store, makeApi());

    expect(store.getState().auth.status).toBe('anonymous');
    expect(store.getState().auth.user).toBeNull();
  });

  it('leaves the local board alone for an anonymous visitor', async () => {
    const store = makeStore();
    const api = makeApi();

    await bootstrapSession(store, api);

    expect(store.getState().lists).toEqual(board());
    expect(api.fetchBoard).not.toHaveBeenCalled();
  });

  it('signs the user in when the session is live', async () => {
    const store = makeStore();

    await bootstrapSession(store, makeApi({ fetchMe: vi.fn().mockResolvedValue(user) }));

    expect(store.getState().auth).toMatchObject({
      status: 'authenticated',
      user
    });
  });

  it('replaces the local board with the stored one', async () => {
    const store = makeStore();
    const api = makeApi({
      fetchMe: vi.fn().mockResolvedValue(user),
      fetchBoard: vi.fn().mockResolvedValue(serverBoard())
    });

    const result = await bootstrapSession(store, api);

    expect(store.getState().lists).toEqual(serverBoard());
    expect(api.putBoard).not.toHaveBeenCalled();
    expect(result.uploaded).toBe(false);
  });

  // The first sign-in is the case that decides whether someone's existing work
  // follows them into their new account or quietly disappears.
  it('uploads the local board when the account has none', async () => {
    const store = makeStore();
    const api = makeApi({ fetchMe: vi.fn().mockResolvedValue(user) });

    const result = await bootstrapSession(store, api);

    expect(api.putBoard).toHaveBeenCalledWith(board());
    expect(store.getState().lists).toEqual(board());
    expect(result.uploaded).toBe(true);
  });

  it('falls back to anonymous when the API is unreachable', async () => {
    const store = makeStore();
    const api = makeApi({
      fetchMe: vi.fn().mockRejectedValue(new Error('offline'))
    });

    await bootstrapSession(store, api);

    expect(store.getState().auth.status).toBe('anonymous');
    expect(store.getState().lists).toEqual(board());
  });

  it('keeps the session and the local board when the board request fails', async () => {
    const store = makeStore();
    const api = makeApi({
      fetchMe: vi.fn().mockResolvedValue(user),
      fetchBoard: vi.fn().mockRejectedValue(new Error('boom'))
    });

    await bootstrapSession(store, api);

    expect(store.getState().auth.status).toBe('authenticated');
    expect(store.getState().lists).toEqual(board());
  });

  it('ignores a malformed board rather than emptying the screen', async () => {
    const store = makeStore();
    const api = makeApi({
      fetchMe: vi.fn().mockResolvedValue(user),
      fetchBoard: vi.fn().mockResolvedValue([{ nonsense: true }])
    });

    await bootstrapSession(store, api);

    expect(store.getState().lists).toEqual(board());
  });
});

describe('startBoardSync', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const signIn = store => {
    store.dispatch({ type: 'auth/signedIn', payload: user });
  };

  it('does not push anything for an anonymous visitor', () => {
    const store = makeStore();
    const api = makeApi();

    startBoardSync(store, api, 100);
    store.dispatch(addCard('list-a', 'nuevo'));
    vi.advanceTimersByTime(100);

    expect(api.putBoard).not.toHaveBeenCalled();
  });

  it('pushes the board after an edit when signed in', () => {
    const store = makeStore();
    const api = makeApi();

    startBoardSync(store, api, 100);
    signIn(store);
    store.dispatch(addCard('list-a', 'nuevo'));
    vi.advanceTimersByTime(100);

    expect(api.putBoard).toHaveBeenCalledTimes(1);
    expect(api.putBoard).toHaveBeenCalledWith(store.getState().lists);
  });

  it('collapses a burst of edits into one request', () => {
    const store = makeStore();
    const api = makeApi();

    startBoardSync(store, api, 100);
    signIn(store);
    store.dispatch(addCard('list-a', 'uno'));
    store.dispatch(addCard('list-a', 'dos'));
    store.dispatch(addCard('list-a', 'tres'));
    vi.advanceTimersByTime(100);

    expect(api.putBoard).toHaveBeenCalledTimes(1);
  });

  it('ignores dispatches that leave the board untouched', () => {
    const store = makeStore();
    const api = makeApi();

    startBoardSync(store, api, 100);
    signIn(store);
    store.dispatch({ type: 'filters/setTypeFilter', payload: 'bug' });
    vi.advanceTimersByTime(100);

    expect(api.putBoard).not.toHaveBeenCalled();
  });

  it('flushes a pending save when stopped', () => {
    const store = makeStore();
    const api = makeApi();

    const stop = startBoardSync(store, api, 100);
    signIn(store);
    store.dispatch(addCard('list-a', 'nuevo'));
    stop();

    expect(api.putBoard).toHaveBeenCalledTimes(1);
  });

  it('stops listening once stopped', () => {
    const store = makeStore();
    const api = makeApi();

    const stop = startBoardSync(store, api, 100);
    signIn(store);
    stop();
    store.dispatch(addCard('list-a', 'nuevo'));
    vi.advanceTimersByTime(100);

    expect(api.putBoard).not.toHaveBeenCalled();
  });

  it('survives a failed save without throwing', async () => {
    const store = makeStore();
    const api = makeApi({
      putBoard: vi.fn().mockRejectedValue(new Error('offline'))
    });

    startBoardSync(store, api, 100);
    signIn(store);
    store.dispatch(addCard('list-a', 'nuevo'));
    vi.advanceTimersByTime(100);
    await vi.runAllTimersAsync();

    expect(store.getState().auth.syncing).toBe(false);
  });
});
