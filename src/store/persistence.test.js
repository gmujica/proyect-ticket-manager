import {
  forgetBoard,
  loadActiveBoardId,
  loadBoard,
  saveActiveBoardId,
  saveBoard
} from './persistence';
import { DEFAULT_PRIORITY, DEFAULT_TYPE } from '../constants/ticket';

// Mirrors the private constants in persistence.js. Duplicated on purpose: these
// tests pin the on-disk format, so a change to the keys should fail here and be
// an explicit decision about migrating existing users.
const STORAGE_KEY = 'ptm.board.v1';
const ACTIVE_KEY = 'ptm.activeBoard.v1';

const write = value => window.localStorage.setItem(STORAGE_KEY, value);

const validBoard = [
  {
    id: 'list-a',
    title: 'A',
    cards: [{ id: 'c1', text: 'one', type: 'bug', priority: 'highest' }]
  }
];

beforeEach(() => {
  window.localStorage.clear();
});

describe('saveBoard', () => {
  it('writes the board as JSON under the versioned key', () => {
    saveBoard(null, validBoard);

    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY))).toEqual(validBoard);
  });

  it('survives a round trip through loadBoard', () => {
    saveBoard(null, validBoard);

    expect(loadBoard()).toEqual(validBoard);
  });

  it('does not throw when storage rejects the write', () => {
    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new DOMException('QuotaExceededError');
      });

    expect(() => saveBoard(null, validBoard)).not.toThrow();

    setItem.mockRestore();
  });
});

// The reason the key is not a single one any more: an account with several
// boards would otherwise have each of them overwrite the last, and the board
// built before signing in would be the first casualty.
describe('one key per board', () => {
  const otherBoard = [{ id: 'list-b', title: 'B', cards: [] }];

  it('keeps each board under its own key', () => {
    saveBoard('board-1', validBoard);
    saveBoard('board-2', otherBoard);

    expect(loadBoard('board-1')).toEqual(validBoard);
    expect(loadBoard('board-2')).toEqual(otherBoard);
  });

  it('does not disturb the board of an anonymous visitor', () => {
    saveBoard(null, validBoard);
    saveBoard('board-1', otherBoard);

    expect(loadBoard()).toEqual(validBoard);
  });

  it('answers undefined for a board this browser has never seen', () => {
    saveBoard('board-1', validBoard);

    expect(loadBoard('board-2')).toBeUndefined();
  });

  it('forgets one board without touching the others', () => {
    saveBoard('board-1', validBoard);
    saveBoard('board-2', otherBoard);

    forgetBoard('board-1');

    expect(loadBoard('board-1')).toBeUndefined();
    expect(loadBoard('board-2')).toEqual(otherBoard);
  });

  it('does not throw when storage is unavailable', () => {
    const removeItem = vi
      .spyOn(Storage.prototype, 'removeItem')
      .mockImplementation(() => {
        throw new DOMException('SecurityError');
      });

    expect(() => forgetBoard('board-1')).not.toThrow();

    removeItem.mockRestore();
  });
});

describe('the active board id', () => {
  it('round trips', () => {
    saveActiveBoardId('board-1');

    expect(window.localStorage.getItem(ACTIVE_KEY)).toBe('board-1');
    expect(loadActiveBoardId()).toBe('board-1');
  });

  it('is null when nothing has been saved', () => {
    expect(loadActiveBoardId()).toBeNull();
  });

  // Signing out clears it: the next visitor to this browser is not necessarily
  // the same person, and the id would send them looking for somebody else's
  // board.
  it('is cleared rather than stored empty', () => {
    saveActiveBoardId('board-1');
    saveActiveBoardId(null);

    expect(window.localStorage.getItem(ACTIVE_KEY)).toBeNull();
    expect(loadActiveBoardId()).toBeNull();
  });

  it('does not throw when storage is unreadable', () => {
    const getItem = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new DOMException('SecurityError');
      });

    expect(loadActiveBoardId()).toBeNull();

    getItem.mockRestore();
  });
});

describe('loadBoard', () => {
  it('returns undefined when nothing has been saved', () => {
    expect(loadBoard()).toBeUndefined();
  });

  it('returns undefined for corrupt JSON', () => {
    write('{ not json');

    expect(loadBoard()).toBeUndefined();
  });

  it('returns undefined when the payload is not an array', () => {
    write(JSON.stringify({ lists: [] }));

    expect(loadBoard()).toBeUndefined();
  });

  it('returns undefined when any list is malformed', () => {
    write(JSON.stringify([validBoard[0], { id: 'list-b', title: 'B' }]));

    expect(loadBoard()).toBeUndefined();
  });

  it('returns undefined when a list title is missing', () => {
    write(JSON.stringify([{ id: 'list-a', cards: [] }]));

    expect(loadBoard()).toBeUndefined();
  });

  it('does not throw when storage is unreadable', () => {
    const getItem = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new DOMException('SecurityError');
      });

    expect(loadBoard()).toBeUndefined();

    getItem.mockRestore();
  });

  it('reads an empty board back as an empty array', () => {
    write(JSON.stringify([]));

    expect(loadBoard()).toEqual([]);
  });

  // Boards written before type/priority existed must still open.
  describe('migrating older cards', () => {
    it('fills in a missing type and priority', () => {
      write(JSON.stringify([{ id: 'list-a', title: 'A', cards: [{ id: 'c1', text: 'one' }] }]));

      expect(loadBoard()[0].cards[0]).toEqual({
        id: 'c1',
        text: 'one',
        type: DEFAULT_TYPE,
        priority: DEFAULT_PRIORITY
      });
    });

    it('replaces a type that is no longer in the catalog', () => {
      write(
        JSON.stringify([
          {
            id: 'list-a',
            title: 'A',
            cards: [{ id: 'c1', text: 'one', type: 'epic', priority: 'high' }]
          }
        ])
      );

      const card = loadBoard()[0].cards[0];

      expect(card.type).toBe(DEFAULT_TYPE);
      expect(card.priority).toBe('high');
    });

    it('replaces a priority that is no longer in the catalog', () => {
      write(
        JSON.stringify([
          {
            id: 'list-a',
            title: 'A',
            cards: [{ id: 'c1', text: 'one', type: 'bug', priority: 'blocker' }]
          }
        ])
      );

      const card = loadBoard()[0].cards[0];

      expect(card.priority).toBe(DEFAULT_PRIORITY);
      expect(card.type).toBe('bug');
    });

    it('drops cards that have no usable text', () => {
      write(
        JSON.stringify([
          {
            id: 'list-a',
            title: 'A',
            cards: [{ id: 'c1', text: 'one' }, { id: 'c2' }, null]
          }
        ])
      );

      const { cards } = loadBoard()[0];

      expect(cards).toHaveLength(1);
      expect(cards[0].id).toBe('c1');
    });

    it('keeps the list but empties it when every card is unusable', () => {
      write(JSON.stringify([{ id: 'list-a', title: 'A', cards: [{ text: 'no id' }] }]));

      expect(loadBoard()).toEqual([{ id: 'list-a', title: 'A', cards: [] }]);
    });

    it('strips unknown properties instead of passing them to the store', () => {
      write(
        JSON.stringify([
          {
            id: 'list-a',
            title: 'A',
            colour: 'red',
            cards: [{ id: 'c1', text: 'one', assignee: 'someone' }]
          }
        ])
      );

      const [list] = loadBoard();

      expect(list).not.toHaveProperty('colour');
      expect(list.cards[0]).not.toHaveProperty('assignee');
    });
  });
});
