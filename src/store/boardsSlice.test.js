import boardsReducer, {
  activeBoard,
  boardAdded,
  boardOpened,
  boardRemoved,
  boardRenamed,
  boardsBusy,
  boardsCleared,
  boardsLoaded,
  preloadedBoards
} from './boardsSlice';

const boards = [
  { id: 'board-1', name: 'Work', updatedAt: 1 },
  { id: 'board-2', name: 'Home', updatedAt: 2 }
];

const loaded = (activeId = 'board-1') => ({
  items: boards,
  activeId,
  busy: false
});

describe('boardsSlice', () => {
  it('starts with no boards and none open', () => {
    expect(boardsReducer(undefined, { type: 'SOMETHING_ELSE' })).toEqual({
      items: [],
      activeId: null,
      busy: false
    });
  });

  describe('boardsLoaded', () => {
    it('takes the list as the server gave it, in that order', () => {
      const state = boardsReducer(undefined, boardsLoaded(boards));

      expect(state.items).toEqual(boards);
    });

    it('keeps only the fields the switcher needs', () => {
      const state = boardsReducer(
        undefined,
        boardsLoaded([{ id: 'board-1', name: 'Work', updatedAt: 1, secret: 'x' }])
      );

      expect(state.items[0]).toEqual({ id: 'board-1', name: 'Work', updatedAt: 1 });
    });

    // An unlabelled row would open something, and say nothing about what.
    it('drops an entry that is not a board', () => {
      const state = boardsReducer(
        undefined,
        boardsLoaded([boards[0], null, { id: 'board-3' }, { name: 'no id' }])
      );

      expect(state.items).toEqual([boards[0]]);
    });
  });

  describe('boardOpened', () => {
    it('makes the board the active one', () => {
      const state = boardsReducer(loaded(), boardOpened({ id: 'board-2', lists: [] }));

      expect(state.activeId).toBe('board-2');
    });

    // The lists in the payload are for listsSlice to answer; keeping a copy of
    // them here is how the two would drift apart.
    it('does not keep the lists it carries', () => {
      const state = boardsReducer(
        loaded(),
        boardOpened({ id: 'board-2', lists: [{ id: 'list-a', title: 'A', cards: [] }] })
      );

      expect(JSON.stringify(state)).not.toContain('list-a');
    });
  });

  describe('boardAdded', () => {
    it('appends the new board', () => {
      const state = boardsReducer(
        loaded(),
        boardAdded({ id: 'board-3', name: 'Side project', updatedAt: 3 })
      );

      expect(state.items.map(item => item.id)).toEqual([
        'board-1',
        'board-2',
        'board-3'
      ]);
    });

    // Creating a board does not open it: that is `boardOpened`'s job, and it
    // takes the lists along with it.
    it('leaves the board on screen where it was', () => {
      const state = boardsReducer(
        loaded(),
        boardAdded({ id: 'board-3', name: 'Side project' })
      );

      expect(state.activeId).toBe('board-1');
    });

    it('fills in a missing timestamp rather than storing undefined', () => {
      const state = boardsReducer(undefined, boardAdded({ id: 'b', name: 'B' }));

      expect(state.items[0].updatedAt).toBeNull();
    });
  });

  describe('boardRenamed', () => {
    it('renames the board it names', () => {
      const state = boardsReducer(
        loaded(),
        boardRenamed({ id: 'board-2', name: 'House' })
      );

      expect(state.items[1].name).toBe('House');
      expect(state.items[0].name).toBe('Work');
    });

    it('ignores a board that is not in the list', () => {
      const state = boardsReducer(loaded(), boardRenamed({ id: 'nope', name: 'X' }));

      expect(state.items).toEqual(boards);
    });
  });

  describe('boardRemoved', () => {
    it('drops the board from the list', () => {
      const state = boardsReducer(loaded(), boardRemoved('board-1'));

      expect(state.items.map(item => item.id)).toEqual(['board-2']);
    });

    // Moving to another board is a separate step, and it carries its lists. The
    // stale id left here is why the sync refuses to push to a board that is not
    // on the list.
    it('does not choose the next board on its own', () => {
      const state = boardsReducer(loaded(), boardRemoved('board-1'));

      expect(state.activeId).toBe('board-1');
    });
  });

  describe('boardsCleared', () => {
    it('leaves nothing of the session behind', () => {
      const state = boardsReducer({ ...loaded(), busy: true }, boardsCleared());

      expect(state).toEqual({ items: [], activeId: null, busy: false });
    });
  });

  it('tracks whether an operation is in flight', () => {
    const busy = boardsReducer(loaded(), boardsBusy(true));

    expect(busy.busy).toBe(true);
    expect(boardsReducer(busy, boardsBusy(false)).busy).toBe(false);
  });
});

describe('activeBoard', () => {
  it('is the board on screen', () => {
    expect(activeBoard({ boards: loaded('board-2') })).toEqual(boards[1]);
  });

  it('is null while nobody is signed in', () => {
    expect(activeBoard({ boards: { items: [], activeId: null } })).toBeNull();
  });

  // The window between a board being removed and another being opened.
  it('is null when the active id is not on the list', () => {
    expect(activeBoard({ boards: loaded('board-gone') })).toBeNull();
  });
});

describe('preloadedBoards', () => {
  it('boots with the remembered board selected and nothing else known', () => {
    expect(preloadedBoards('board-2')).toEqual({
      items: [],
      activeId: 'board-2',
      busy: false
    });
  });

  it('boots with no board at all for a browser that has never signed in', () => {
    expect(preloadedBoards(null).activeId).toBeNull();
  });
});
