import { configureStore } from '@reduxjs/toolkit';
import { ApiError } from '../api/client';
import authReducer from './authSlice';
import boardsReducer from './boardsSlice';
import filtersReducer from './filtersSlice';
import listsReducer from './listsSlice';
import {
  createBoard,
  openBoard,
  removeBoard,
  renameBoard,
  signOut
} from './boardThunks';

const boards = [
  { id: 'board-1', name: 'Work', updatedAt: 1 },
  { id: 'board-2', name: 'Home', updatedAt: 2 }
];

const board = () => [
  {
    id: 'list-a',
    title: 'A',
    cards: [{ id: 'c1', text: 'one', type: 'task', priority: 'medium' }]
  }
];

const otherBoard = () => [{ id: 'list-other', title: 'The other one', cards: [] }];

const makeApi = (overrides = {}) => ({
  fetchBoard: vi
    .fn()
    .mockImplementation(async id => ({
      board: boards.find(item => item.id === id),
      lists: otherBoard()
    })),
  createBoard: vi
    .fn()
    .mockResolvedValue({ id: 'board-3', name: 'Side project', updatedAt: 3 }),
  renameBoard: vi
    .fn()
    .mockImplementation(async (id, name) => ({ id, name, updatedAt: 4 })),
  deleteBoard: vi.fn().mockResolvedValue(undefined),
  logout: vi.fn().mockResolvedValue(undefined),
  ...overrides
});

// Signed in with the first board open, which is the state every one of these
// operations starts from.
const makeStore = (api, activeId = 'board-1') =>
  configureStore({
    reducer: {
      auth: authReducer,
      boards: boardsReducer,
      filters: filtersReducer,
      lists: listsReducer
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({ thunk: { extraArgument: api } }),
    preloadedState: {
      auth: { user: { id: 'u1', login: 'gmujica' }, status: 'authenticated', syncing: false },
      boards: { items: boards, activeId, busy: false },
      lists: board()
    }
  });

const refused = (status, detail) => new ApiError('POST', '/api/boards', status, detail);

beforeEach(() => {
  window.localStorage.clear();
});

describe('openBoard', () => {
  it('puts the board and its lists on screen in one step', async () => {
    const api = makeApi();
    const store = makeStore(api);

    const result = await store.dispatch(openBoard('board-2'));

    expect(result.ok).toBe(true);
    expect(store.getState().boards.activeId).toBe('board-2');
    expect(store.getState().lists).toEqual(otherBoard());
  });

  it('does nothing when the board is already open', async () => {
    const api = makeApi();
    const store = makeStore(api);

    await store.dispatch(openBoard('board-1'));

    expect(api.fetchBoard).not.toHaveBeenCalled();
    expect(store.getState().lists).toEqual(board());
  });

  // Deleted from another tab or another device: the row is not coming back, and
  // leaving it there invites the same failed click again.
  it('drops a board the account no longer has', async () => {
    const api = makeApi({ fetchBoard: vi.fn().mockResolvedValue(null) });
    const store = makeStore(api);

    const result = await store.dispatch(openBoard('board-2'));

    expect(result.ok).toBe(false);
    expect(store.getState().boards.items.map(item => item.id)).toEqual(['board-1']);
    expect(store.getState().boards.activeId).toBe('board-1');
  });

  it('leaves the board on screen alone when the request fails', async () => {
    const api = makeApi({ fetchBoard: vi.fn().mockRejectedValue(new Error('offline')) });
    const store = makeStore(api);

    const result = await store.dispatch(openBoard('board-2'));

    expect(result).toEqual({ ok: false, error: 'Could not open that board.' });
    expect(store.getState().boards.activeId).toBe('board-1');
    expect(store.getState().lists).toEqual(board());
  });

  it('clears the busy flag whether or not it worked', async () => {
    const api = makeApi({ fetchBoard: vi.fn().mockRejectedValue(new Error('offline')) });
    const store = makeStore(api);

    await store.dispatch(openBoard('board-2'));

    expect(store.getState().boards.busy).toBe(false);
  });
});

describe('createBoard', () => {
  it('adds the board and opens it empty', async () => {
    const api = makeApi();
    const store = makeStore(api);

    const result = await store.dispatch(createBoard('Side project'));

    expect(api.createBoard).toHaveBeenCalledWith('Side project');
    expect(result.ok).toBe(true);
    expect(store.getState().boards.items.map(item => item.name)).toContain(
      'Side project'
    );
    expect(store.getState().boards.activeId).toBe('board-3');
    expect(store.getState().lists).toEqual([]);
  });

  // "Too many boards" says more about what happened than any wording invented
  // on this side would.
  it('reports the reason the API gave', async () => {
    const api = makeApi({
      createBoard: vi.fn().mockRejectedValue(refused(409, 'Too many boards'))
    });
    const store = makeStore(api);

    const result = await store.dispatch(createBoard('One more'));

    expect(result).toEqual({ ok: false, error: 'Too many boards' });
    expect(store.getState().boards.items).toEqual(boards);
    expect(store.getState().boards.activeId).toBe('board-1');
  });

  it('falls back to its own wording when the API sent none', async () => {
    const api = makeApi({
      createBoard: vi.fn().mockRejectedValue(new Error('offline'))
    });
    const store = makeStore(api);

    const result = await store.dispatch(createBoard('Side project'));

    expect(result).toEqual({ ok: false, error: 'Could not create the board.' });
  });

  it('says so when the session has ended', async () => {
    const api = makeApi({ createBoard: vi.fn().mockResolvedValue(null) });
    const store = makeStore(api);

    const result = await store.dispatch(createBoard('Side project'));

    expect(result.ok).toBe(false);
    expect(store.getState().boards.items).toEqual(boards);
  });
});

describe('renameBoard', () => {
  it('renames the board in the list', async () => {
    const api = makeApi();
    const store = makeStore(api);

    const result = await store.dispatch(renameBoard('board-2', 'House'));

    expect(api.renameBoard).toHaveBeenCalledWith('board-2', 'House');
    expect(result.ok).toBe(true);
    expect(store.getState().boards.items[1].name).toBe('House');
  });

  it('keeps the old name when the rename fails', async () => {
    const api = makeApi({
      renameBoard: vi.fn().mockRejectedValue(refused(400, 'Invalid board name'))
    });
    const store = makeStore(api);

    const result = await store.dispatch(renameBoard('board-2', '   '));

    expect(result).toEqual({ ok: false, error: 'Invalid board name' });
    expect(store.getState().boards.items[1].name).toBe('Home');
  });
});

describe('removeBoard', () => {
  it('deletes the board and opens what is left when it was on screen', async () => {
    const api = makeApi();
    const store = makeStore(api, 'board-2');

    const result = await store.dispatch(removeBoard('board-2'));

    expect(api.deleteBoard).toHaveBeenCalledWith('board-2');
    expect(result.ok).toBe(true);
    expect(store.getState().boards.items.map(item => item.id)).toEqual(['board-1']);
    expect(store.getState().boards.activeId).toBe('board-1');
    expect(store.getState().lists).toEqual(otherBoard());
  });

  it('leaves the screen alone when another board was deleted', async () => {
    const api = makeApi();
    const store = makeStore(api);

    await store.dispatch(removeBoard('board-2'));

    expect(api.fetchBoard).not.toHaveBeenCalled();
    expect(store.getState().boards.activeId).toBe('board-1');
    expect(store.getState().lists).toEqual(board());
  });

  it('drops the deleted board from this browser as well', async () => {
    window.localStorage.setItem('ptm.board.v1.board-2', JSON.stringify(otherBoard()));

    const store = makeStore(makeApi());

    await store.dispatch(removeBoard('board-2'));

    expect(window.localStorage.getItem('ptm.board.v1.board-2')).toBeNull();
  });

  // The API would allow it. An account with no boards has nothing to draw, and
  // recovering from that is worse than the rename the person probably wanted.
  it('refuses to delete the only board', async () => {
    const api = makeApi();
    const store = configureStore({
      reducer: {
        auth: authReducer,
        boards: boardsReducer,
        filters: filtersReducer,
        lists: listsReducer
      },
      middleware: getDefaultMiddleware =>
        getDefaultMiddleware({ thunk: { extraArgument: api } }),
      preloadedState: {
        boards: { items: [boards[0]], activeId: 'board-1', busy: false }
      }
    });

    const result = await store.dispatch(removeBoard('board-1'));

    expect(result.ok).toBe(false);
    expect(api.deleteBoard).not.toHaveBeenCalled();
    expect(store.getState().boards.items).toHaveLength(1);
  });

  it('keeps the board when the delete fails', async () => {
    const api = makeApi({
      deleteBoard: vi.fn().mockRejectedValue(new Error('offline'))
    });
    const store = makeStore(api);

    const result = await store.dispatch(removeBoard('board-2'));

    expect(result).toEqual({ ok: false, error: 'Could not delete the board.' });
    expect(store.getState().boards.items).toEqual(boards);
  });
});

describe('signOut', () => {
  it('ends the session and hands the screen back to the local board', async () => {
    const local = [{ id: 'list-local', title: 'Local', cards: [] }];
    window.localStorage.setItem('ptm.board.v1', JSON.stringify(local));

    const api = makeApi();
    const store = makeStore(api);

    await store.dispatch(signOut());

    expect(api.logout).toHaveBeenCalled();
    expect(store.getState().auth.status).toBe('anonymous');
    expect(store.getState().boards).toEqual({
      items: [],
      activeId: null,
      busy: false
    });
    expect(store.getState().lists).toEqual(local);
  });

  it('leaves the board on screen when this browser has none of its own', async () => {
    const store = makeStore(makeApi());

    await store.dispatch(signOut());

    expect(store.getState().lists).toEqual(board());
  });

  // If the cookie survived, the cost is one extra sign-in. A UI claiming a
  // session that may be over is worse than that.
  it('signs out locally even when the request fails', async () => {
    const api = makeApi({ logout: vi.fn().mockRejectedValue(new Error('offline')) });
    const store = makeStore(api);

    await store.dispatch(signOut());

    expect(store.getState().auth.status).toBe('anonymous');
    expect(store.getState().boards.activeId).toBeNull();
  });
});
