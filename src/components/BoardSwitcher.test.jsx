import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ApiError } from '../api/client';
import authReducer from '../store/authSlice';
import boardsReducer from '../store/boardsSlice';
import filtersReducer from '../store/filtersSlice';
import listsReducer from '../store/listsSlice';
import BoardSwitcher from './BoardSwitcher';

const boards = [
  { id: 'board-1', name: 'Work', updatedAt: 1 },
  { id: 'board-2', name: 'Home', updatedAt: 2 }
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

const mount = ({ api = makeApi(), items = boards, status = 'authenticated' } = {}) => {
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
      auth: { user: { id: 'u1', login: 'gmujica' }, status, syncing: false },
      boards: { items, activeId: items[0]?.id ?? null, busy: false }
    }
  });

  const user = userEvent.setup();

  render(
    <Provider store={store}>
      <BoardSwitcher />
    </Provider>
  );

  return { api, store, user };
};

const openMenu = async user => {
  await user.click(screen.getByRole('button', { name: /Work/ }));
};

describe('BoardSwitcher', () => {
  // The header of an anonymous visitor is exactly what it was before boards had
  // ids: one board, and nothing to switch between.
  it('renders nothing for an anonymous visitor', () => {
    const { container } = render(
      <Provider
        store={configureStore({
          reducer: {
            auth: authReducer,
            boards: boardsReducer,
            filters: filtersReducer,
            lists: listsReducer
          }
        })}
      >
        <BoardSwitcher />
      </Provider>
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing until the board list has arrived', () => {
    mount({ items: [] });

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('names the board on screen', () => {
    mount();

    expect(screen.getByRole('button', { name: /Work/ })).toBeInTheDocument();
  });

  it('lists the account boards and marks the one on screen', async () => {
    const { user } = mount();

    await openMenu(user);

    expect(screen.getByRole('menuitem', { name: 'Work' })).toHaveAttribute(
      'aria-current',
      'true'
    );
    expect(screen.getByRole('menuitem', { name: 'Home' })).not.toHaveAttribute(
      'aria-current'
    );
  });

  it('opens the board that was picked', async () => {
    const { api, store, user } = mount();

    await openMenu(user);
    await user.click(screen.getByRole('menuitem', { name: 'Home' }));

    await waitFor(() => expect(store.getState().boards.activeId).toBe('board-2'));
    expect(api.fetchBoard).toHaveBeenCalledWith('board-2');
    expect(store.getState().lists).toEqual(otherBoard());
  });

  // A failed switch has no dialog to speak through, and it leaves the previous
  // board on screen, so it says so where the person is looking.
  it('reports a switch that failed', async () => {
    const api = makeApi({ fetchBoard: vi.fn().mockRejectedValue(new Error('offline')) });
    const { store, user } = mount({ api });

    await openMenu(user);
    await user.click(screen.getByRole('menuitem', { name: 'Home' }));

    expect(await screen.findByText('Could not open that board.')).toBeInTheDocument();
    expect(store.getState().boards.activeId).toBe('board-1');
  });

  describe('creating a board', () => {
    const openDialog = async user => {
      await openMenu(user);
      await user.click(screen.getByRole('menuitem', { name: 'New board' }));
    };

    it('creates it and opens it', async () => {
      const { api, store, user } = mount();

      await openDialog(user);
      await user.type(screen.getByLabelText('Board name'), 'Side project');
      await user.click(screen.getByRole('button', { name: 'Create' }));

      await waitFor(() => expect(store.getState().boards.activeId).toBe('board-3'));
      expect(api.createBoard).toHaveBeenCalledWith('Side project');
      expect(store.getState().lists).toEqual([]);
    });

    it('will not submit a name that is only spaces', async () => {
      const { api, user } = mount();

      await openDialog(user);
      await user.type(screen.getByLabelText('Board name'), '   ');

      expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();
      expect(api.createBoard).not.toHaveBeenCalled();
    });

    it('keeps the dialog open and shows why the API refused', async () => {
      const api = makeApi({
        createBoard: vi
          .fn()
          .mockRejectedValue(new ApiError('POST', '/api/boards', 409, 'Too many boards'))
      });
      const { user } = mount({ api });

      await openDialog(user);
      await user.type(screen.getByLabelText('Board name'), 'One more');
      await user.click(screen.getByRole('button', { name: 'Create' }));

      expect(await screen.findByText('Too many boards')).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('renaming a board', () => {
    it('starts from the current name and saves the new one', async () => {
      const { api, store, user } = mount();

      await openMenu(user);
      await user.click(screen.getByRole('menuitem', { name: 'Rename board' }));

      const field = screen.getByLabelText('Board name');
      expect(field).toHaveValue('Work');

      await user.clear(field);
      await user.type(field, 'Day job');
      await user.click(screen.getByRole('button', { name: 'Rename' }));

      await waitFor(() =>
        expect(store.getState().boards.items[0].name).toBe('Day job')
      );
      expect(api.renameBoard).toHaveBeenCalledWith('board-1', 'Day job');
    });
  });

  describe('deleting a board', () => {
    it('asks first, and says what is going with it', async () => {
      const { api, user } = mount();

      await openMenu(user);
      await user.click(screen.getByRole('menuitem', { name: 'Delete board' }));

      expect(
        screen.getByText(/every list and card on it will be deleted/)
      ).toBeInTheDocument();
      expect(api.deleteBoard).not.toHaveBeenCalled();
    });

    it('deletes on confirmation and moves to what is left', async () => {
      const { api, store, user } = mount();

      await openMenu(user);
      await user.click(screen.getByRole('menuitem', { name: 'Delete board' }));
      await user.click(screen.getByRole('button', { name: 'Delete' }));

      await waitFor(() => expect(store.getState().boards.activeId).toBe('board-2'));
      expect(api.deleteBoard).toHaveBeenCalledWith('board-1');
      expect(store.getState().boards.items).toHaveLength(1);
    });

    // Greyed out rather than missing: an account always has somewhere to put its
    // tickets, and that is a rule worth showing rather than hiding.
    it('is not offered on the last board', async () => {
      const { user } = mount({ items: [boards[0]] });

      await openMenu(user);

      expect(screen.getByRole('menuitem', { name: 'Delete board' })).toHaveAttribute(
        'aria-disabled',
        'true'
      );
    });
  });
});
