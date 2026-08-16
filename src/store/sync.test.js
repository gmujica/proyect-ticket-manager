import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import boardsReducer from './boardsSlice';
import filtersReducer from './filtersSlice';
import listsReducer, { addCard } from './listsSlice';
import { bootstrapSession, startBoardSync } from './sync';
import { DEFAULT_BOARD_NAME } from '../constants/board';

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

const otherBoard = () => [{ id: 'list-other', title: 'The other one', cards: [] }];

const boards = [
  { id: 'board-1', name: 'Work', updatedAt: 1 },
  { id: 'board-2', name: 'Home', updatedAt: 2 }
];

const makeStore = (activeId = null, items = []) =>
  configureStore({
    reducer: {
      auth: authReducer,
      boards: boardsReducer,
      filters: filtersReducer,
      lists: listsReducer
    },
    preloadedState: {
      boards: { items, activeId, busy: false },
      lists: board()
    }
  });

// The stub answers as an account with two boards and content on the first one.
// Each test that cares about a different account overrides one call.
const makeApi = (overrides = {}) => ({
  fetchMe: vi.fn().mockResolvedValue(null),
  fetchBoards: vi.fn().mockResolvedValue(boards),
  fetchBoard: vi
    .fn()
    .mockImplementation(async id => ({
      board: boards.find(item => item.id === id),
      lists: id === 'board-1' ? serverBoard() : otherBoard()
    })),
  createBoard: vi
    .fn()
    .mockResolvedValue({ id: 'board-new', name: DEFAULT_BOARD_NAME, updatedAt: 3 }),
  putBoard: vi.fn().mockResolvedValue(1),
  ...overrides
});

const user = { id: 'u1', login: 'gmujica', avatarUrl: null };
const signedInApi = (overrides = {}) =>
  makeApi({ fetchMe: vi.fn().mockResolvedValue(user), ...overrides });

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
    expect(api.fetchBoards).not.toHaveBeenCalled();
  });

  // A reload after the session expired: the store boots with the board that was
  // open last time, and that board is not this browser's to show any more.
  it('puts the local board back when the remembered session is over', async () => {
    const local = [{ id: 'list-local', title: 'Local', cards: [] }];
    window.localStorage.setItem('ptm.board.v1', JSON.stringify(local));

    const store = makeStore('board-1', boards);

    await bootstrapSession(store, makeApi());

    expect(store.getState().boards).toMatchObject({ items: [], activeId: null });
    expect(store.getState().lists).toEqual(local);

    window.localStorage.clear();
  });

  it('signs the user in when the session is live', async () => {
    const store = makeStore();

    await bootstrapSession(store, signedInApi());

    expect(store.getState().auth).toMatchObject({
      status: 'authenticated',
      user
    });
  });

  it('lists the account boards and opens the first of them', async () => {
    const store = makeStore();
    const api = signedInApi();

    const result = await bootstrapSession(store, api);

    expect(store.getState().boards.items).toEqual(boards);
    expect(store.getState().boards.activeId).toBe('board-1');
    expect(store.getState().lists).toEqual(serverBoard());
    expect(api.putBoard).not.toHaveBeenCalled();
    expect(result.uploaded).toBe(false);
  });

  it('comes back to the board that was open last time', async () => {
    const store = makeStore('board-2');

    await bootstrapSession(store, signedInApi());

    expect(store.getState().boards.activeId).toBe('board-2');
    expect(store.getState().lists).toEqual(otherBoard());
  });

  it('falls back to the first board when the remembered one is gone', async () => {
    const store = makeStore('board-deleted-elsewhere');

    await bootstrapSession(store, signedInApi());

    expect(store.getState().boards.activeId).toBe('board-1');
  });

  // The first sign-in is the case that decides whether someone's existing work
  // follows them into their new account or quietly disappears.
  it('uploads the local board when the account has none', async () => {
    const store = makeStore();
    const api = signedInApi({ fetchBoards: vi.fn().mockResolvedValue([]) });

    const result = await bootstrapSession(store, api);

    expect(api.createBoard).toHaveBeenCalledWith(DEFAULT_BOARD_NAME);
    expect(api.putBoard).toHaveBeenCalledWith('board-new', board());
    expect(store.getState().boards.items).toEqual([
      { id: 'board-new', name: DEFAULT_BOARD_NAME, updatedAt: 3 }
    ]);
    expect(store.getState().boards.activeId).toBe('board-new');
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

  it('keeps the session and the local board when the board list fails', async () => {
    const store = makeStore();
    const api = signedInApi({
      fetchBoards: vi.fn().mockRejectedValue(new Error('boom'))
    });

    await bootstrapSession(store, api);

    expect(store.getState().auth.status).toBe('authenticated');
    expect(store.getState().boards.activeId).toBeNull();
    expect(store.getState().lists).toEqual(board());
  });

  // Deleted from another device between the two requests. The local board stays
  // on screen, and the board that is gone leaves the list, which is what stops
  // those lists from being pushed onto a board they never belonged to.
  it('keeps the local board when the board it went to open is gone', async () => {
    const store = makeStore();
    const api = signedInApi({ fetchBoard: vi.fn().mockResolvedValue(null) });

    await bootstrapSession(store, api);

    expect(store.getState().boards.items).toEqual([boards[1]]);
    expect(store.getState().lists).toEqual(board());
  });

  it('opens a board whose lists are malformed as an empty one', async () => {
    const store = makeStore();
    const api = signedInApi({
      fetchBoard: vi
        .fn()
        .mockResolvedValue({ board: boards[0], lists: [{ nonsense: true }] })
    });

    await bootstrapSession(store, api);

    expect(store.getState().boards.activeId).toBe('board-1');
    expect(store.getState().lists).toEqual([]);
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

  // Signed in, with the first board open: the state the app spends its time in.
  const openStore = () => {
    const store = makeStore('board-1', boards);
    signIn(store);
    return store;
  };

  it('does not push anything for an anonymous visitor', () => {
    const store = makeStore('board-1', boards);
    const api = makeApi();

    startBoardSync(store, api, 100);
    store.dispatch(addCard('list-a', 'nuevo'));
    vi.advanceTimersByTime(100);

    expect(api.putBoard).not.toHaveBeenCalled();
  });

  it('pushes the board after an edit, under the id of the board on screen', () => {
    const store = openStore();
    const api = makeApi();

    startBoardSync(store, api, 100);
    store.dispatch(addCard('list-a', 'nuevo'));
    vi.advanceTimersByTime(100);

    expect(api.putBoard).toHaveBeenCalledTimes(1);
    expect(api.putBoard).toHaveBeenCalledWith('board-1', store.getState().lists);
  });

  it('collapses a burst of edits into one request', () => {
    const store = openStore();
    const api = makeApi();

    startBoardSync(store, api, 100);
    store.dispatch(addCard('list-a', 'uno'));
    store.dispatch(addCard('list-a', 'dos'));
    store.dispatch(addCard('list-a', 'tres'));
    vi.advanceTimersByTime(100);

    expect(api.putBoard).toHaveBeenCalledTimes(1);
  });

  it('ignores dispatches that leave the board untouched', () => {
    const store = openStore();
    const api = makeApi();

    startBoardSync(store, api, 100);
    store.dispatch({ type: 'filters/setTypeFilter', payload: 'bug' });
    vi.advanceTimersByTime(100);

    expect(api.putBoard).not.toHaveBeenCalled();
  });

  // The lists of the board being opened came *from* the server; pushing them
  // back would be a round trip that changes nothing at best.
  it('does not push a board that was just opened', () => {
    const store = openStore();
    const api = makeApi();

    startBoardSync(store, api, 100);
    store.dispatch({
      type: 'boards/boardOpened',
      payload: { id: 'board-2', lists: otherBoard() }
    });
    vi.advanceTimersByTime(100);

    expect(api.putBoard).not.toHaveBeenCalled();
  });

  // The case the board ids exist to prevent: an edit that was still waiting when
  // the person moved on must land on the board they made it in.
  it('sends a pending save to the board it was made on', () => {
    const store = openStore();
    const api = makeApi();

    startBoardSync(store, api, 100);
    store.dispatch(addCard('list-a', 'nuevo'));

    const edited = store.getState().lists;

    store.dispatch({
      type: 'boards/boardOpened',
      payload: { id: 'board-2', lists: otherBoard() }
    });

    expect(api.putBoard).toHaveBeenCalledTimes(1);
    expect(api.putBoard).toHaveBeenCalledWith('board-1', edited);
  });

  it('does not push to a board the account no longer has', () => {
    const store = openStore();
    const api = makeApi();

    startBoardSync(store, api, 100);
    store.dispatch({ type: 'boards/boardRemoved', payload: 'board-1' });
    store.dispatch(addCard('list-a', 'nuevo'));
    vi.advanceTimersByTime(100);

    expect(api.putBoard).not.toHaveBeenCalled();
  });

  it('flushes a pending save when stopped', () => {
    const store = openStore();
    const api = makeApi();

    const stop = startBoardSync(store, api, 100);
    store.dispatch(addCard('list-a', 'nuevo'));
    stop();

    expect(api.putBoard).toHaveBeenCalledTimes(1);
  });

  it('stops listening once stopped', () => {
    const store = openStore();
    const api = makeApi();

    const stop = startBoardSync(store, api, 100);
    stop();
    store.dispatch(addCard('list-a', 'nuevo'));
    vi.advanceTimersByTime(100);

    expect(api.putBoard).not.toHaveBeenCalled();
  });

  it('survives a failed save without throwing', async () => {
    const store = openStore();
    const api = makeApi({
      putBoard: vi.fn().mockRejectedValue(new Error('offline'))
    });

    startBoardSync(store, api, 100);
    store.dispatch(addCard('list-a', 'nuevo'));
    vi.advanceTimersByTime(100);
    await vi.runAllTimersAsync();

    expect(store.getState().auth.syncing).toBe(false);
  });
});
