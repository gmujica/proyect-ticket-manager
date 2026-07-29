import listsReducer, { addCard, addList, deleteCard, sort } from './listsSlice';
import { DEFAULT_PRIORITY, DEFAULT_TYPE } from '../constants/ticket';

// A two-list board used as the starting point for most cases. Built by a
// factory so a test that mutates it by accident cannot leak into the next one.
const board = () => [
  {
    id: 'list-a',
    title: 'A',
    cards: [
      { id: 'c1', text: 'one', type: 'task', priority: 'medium' },
      { id: 'c2', text: 'two', type: 'bug', priority: 'high' },
      { id: 'c3', text: 'three', type: 'story', priority: 'low' }
    ]
  },
  {
    id: 'list-b',
    title: 'B',
    cards: [{ id: 'c4', text: 'four', type: 'task', priority: 'lowest' }]
  }
];

const cardIds = (state, listId) =>
  state.find(list => list.id === listId).cards.map(card => card.id);

const listIds = state => state.map(list => list.id);

describe('listsSlice', () => {
  it('returns the seed board for an unknown action', () => {
    const state = listsReducer(undefined, { type: 'SOMETHING_ELSE' });

    expect(state).toHaveLength(2);
    expect(listIds(state)).toEqual(['list-todo', 'list-in-process']);
  });

  it('leaves state untouched for an unknown action', () => {
    const initial = board();

    expect(listsReducer(initial, { type: 'NOPE' })).toBe(initial);
  });

  describe('ADD_LIST', () => {
    it('appends an empty list with the given title', () => {
      const state = listsReducer(board(), addList('Done'));

      expect(state).toHaveLength(3);
      expect(state[2]).toMatchObject({ title: 'Done', cards: [] });
      expect(state[2].id).toMatch(/^list-/);
    });

    it('gives each new list a distinct id', () => {
      const first = listsReducer(board(), addList('Done'));
      const second = listsReducer(first, addList('Archived'));

      expect(second[2].id).not.toBe(second[3].id);
    });

    it('does not mutate the previous state', () => {
      const initial = board();
      listsReducer(initial, addList('Done'));

      expect(initial).toHaveLength(2);
    });
  });

  describe('ADD_CARD', () => {
    it('appends the card to the target list only', () => {
      const state = listsReducer(board(), addCard('list-b', 'new card'));

      expect(cardIds(state, 'list-a')).toEqual(['c1', 'c2', 'c3']);
      expect(state.find(l => l.id === 'list-b').cards).toHaveLength(2);
      expect(state.find(l => l.id === 'list-b').cards[1]).toMatchObject({
        text: 'new card'
      });
    });

    it('falls back to the default type and priority', () => {
      const state = listsReducer(board(), addCard('list-a', 'plain'));
      const added = state[0].cards.at(-1);

      expect(added.type).toBe(DEFAULT_TYPE);
      expect(added.priority).toBe(DEFAULT_PRIORITY);
    });

    it('keeps the type and priority it was given', () => {
      const state = listsReducer(board(), addCard('list-a', 'a bug', 'bug', 'highest'));
      const added = state[0].cards.at(-1);

      expect(added).toMatchObject({ type: 'bug', priority: 'highest' });
    });

    it('ignores a list id that does not exist', () => {
      const state = listsReducer(board(), addCard('list-ghost', 'nowhere'));

      expect(cardIds(state, 'list-a')).toEqual(['c1', 'c2', 'c3']);
      expect(cardIds(state, 'list-b')).toEqual(['c4']);
    });

    it('does not mutate the source list', () => {
      const initial = board();
      listsReducer(initial, addCard('list-a', 'new card'));

      expect(initial[0].cards).toHaveLength(3);
    });
  });

  describe('DELETE_CARD', () => {
    it('removes only the requested card', () => {
      const state = listsReducer(board(), deleteCard('list-a', 'c2'));

      expect(cardIds(state, 'list-a')).toEqual(['c1', 'c3']);
      expect(cardIds(state, 'list-b')).toEqual(['c4']);
    });

    it('ignores a card id that is not in that list', () => {
      const state = listsReducer(board(), deleteCard('list-a', 'c4'));

      expect(cardIds(state, 'list-a')).toEqual(['c1', 'c2', 'c3']);
    });

    it('ignores a list id that does not exist', () => {
      const initial = board();

      expect(listsReducer(initial, deleteCard('list-ghost', 'c1'))).toBe(initial);
    });

    it('does not mutate the source list', () => {
      const initial = board();
      listsReducer(initial, deleteCard('list-a', 'c2'));

      expect(initial[0].cards).toHaveLength(3);
    });
  });

  // The riskiest branch in the app: three different index-based paths, all
  // reachable from a single drag gesture.
  describe('DRAG_HAPPENED', () => {
    describe('dragging a whole list', () => {
      it('moves the list to its new position', () => {
        const state = listsReducer(
          board(),
          sort('all-list', 'all-list', 1, 0, 'list-b', 'list')
        );

        expect(listIds(state)).toEqual(['list-b', 'list-a']);
      });

      it('keeps the cards with their list', () => {
        const state = listsReducer(
          board(),
          sort('all-list', 'all-list', 0, 1, 'list-a', 'list')
        );

        expect(cardIds(state, 'list-a')).toEqual(['c1', 'c2', 'c3']);
        expect(cardIds(state, 'list-b')).toEqual(['c4']);
      });

      it('does not mutate the previous order', () => {
        const initial = board();
        listsReducer(initial, sort('all-list', 'all-list', 1, 0, 'list-b', 'list'));

        expect(listIds(initial)).toEqual(['list-a', 'list-b']);
      });
    });

    describe('reordering inside one list', () => {
      it('moves a card down', () => {
        const state = listsReducer(
          board(),
          sort('list-a', 'list-a', 0, 2, 'c1', 'card')
        );

        expect(cardIds(state, 'list-a')).toEqual(['c2', 'c3', 'c1']);
      });

      it('moves a card up', () => {
        const state = listsReducer(
          board(),
          sort('list-a', 'list-a', 2, 0, 'c3', 'card')
        );

        expect(cardIds(state, 'list-a')).toEqual(['c3', 'c1', 'c2']);
      });

      it('is a no-op when dropped where it started', () => {
        const state = listsReducer(
          board(),
          sort('list-a', 'list-a', 1, 1, 'c2', 'card')
        );

        expect(cardIds(state, 'list-a')).toEqual(['c1', 'c2', 'c3']);
      });

      it('leaves the other list alone', () => {
        const state = listsReducer(
          board(),
          sort('list-a', 'list-a', 0, 2, 'c1', 'card')
        );

        expect(cardIds(state, 'list-b')).toEqual(['c4']);
      });

      it('does not mutate the source list', () => {
        const initial = board();
        listsReducer(initial, sort('list-a', 'list-a', 0, 2, 'c1', 'card'));

        expect(initial[0].cards.map(c => c.id)).toEqual(['c1', 'c2', 'c3']);
      });
    });

    describe('moving a card between lists', () => {
      it('removes the card from the source list', () => {
        const state = listsReducer(
          board(),
          sort('list-a', 'list-b', 1, 0, 'c2', 'card')
        );

        expect(cardIds(state, 'list-a')).toEqual(['c1', 'c3']);
      });

      it('inserts the card at the drop index of the target list', () => {
        const state = listsReducer(
          board(),
          sort('list-a', 'list-b', 1, 0, 'c2', 'card')
        );

        expect(cardIds(state, 'list-b')).toEqual(['c2', 'c4']);
      });

      it('appends when dropped past the last card', () => {
        const state = listsReducer(
          board(),
          sort('list-a', 'list-b', 0, 1, 'c1', 'card')
        );

        expect(cardIds(state, 'list-b')).toEqual(['c4', 'c1']);
      });

      it('carries the card contents across unchanged', () => {
        const state = listsReducer(
          board(),
          sort('list-a', 'list-b', 1, 0, 'c2', 'card')
        );

        expect(state.find(l => l.id === 'list-b').cards[0]).toEqual({
          id: 'c2',
          text: 'two',
          type: 'bug',
          priority: 'high'
        });
      });

      it('moves into an empty list', () => {
        const withEmpty = [...board(), { id: 'list-c', title: 'C', cards: [] }];
        const state = listsReducer(
          withEmpty,
          sort('list-a', 'list-c', 0, 0, 'c1', 'card')
        );

        expect(cardIds(state, 'list-c')).toEqual(['c1']);
        expect(cardIds(state, 'list-a')).toEqual(['c2', 'c3']);
      });

      it('empties the source list when it held the last card', () => {
        const state = listsReducer(
          board(),
          sort('list-b', 'list-a', 0, 0, 'c4', 'card')
        );

        expect(cardIds(state, 'list-b')).toEqual([]);
        expect(cardIds(state, 'list-a')).toEqual(['c4', 'c1', 'c2', 'c3']);
      });

      it('does not mutate either list', () => {
        const initial = board();
        listsReducer(initial, sort('list-a', 'list-b', 1, 0, 'c2', 'card'));

        expect(initial[0].cards.map(c => c.id)).toEqual(['c1', 'c2', 'c3']);
        expect(initial[1].cards.map(c => c.id)).toEqual(['c4']);
      });

      it('ignores a drop onto a list that no longer exists', () => {
        const initial = board();
        const state = listsReducer(initial, sort('list-a', 'list-ghost', 0, 0, 'c1', 'card'));

        expect(state).toBe(initial);
      });

      it('ignores a drag out of a list that no longer exists', () => {
        const initial = board();
        const state = listsReducer(initial, sort('list-ghost', 'list-a', 0, 0, 'c1', 'card'));

        expect(state).toBe(initial);
      });
    });
  });
});
