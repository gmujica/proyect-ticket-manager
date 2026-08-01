import { toStoreIndexes } from './dragIndexes';
import { ALL, visibleCards } from './filtersSlice';
import listsReducer, { sort } from './listsSlice';

// c2 and c4 are hidden whenever the type filter is set to task, which is what
// makes the view indexes disagree with the store ones.
const board = () => [
  {
    id: 'list-a',
    title: 'A',
    cards: [
      { id: 'c1', text: 'one', type: 'task', priority: 'medium' },
      { id: 'c2', text: 'two', type: 'bug', priority: 'high' },
      { id: 'c3', text: 'three', type: 'task', priority: 'low' },
      { id: 'c4', text: 'four', type: 'bug', priority: 'lowest' }
    ]
  },
  {
    id: 'list-b',
    title: 'B',
    cards: [
      { id: 'c5', text: 'five', type: 'bug', priority: 'high' },
      { id: 'c6', text: 'six', type: 'task', priority: 'medium' }
    ]
  }
];

const onlyTasks = { type: 'task', priority: ALL };
const noFilter = { type: ALL, priority: ALL };

const at = (droppableId, index) => ({ droppableId, index });

const cardIds = (state, listId) =>
  state.find(list => list.id === listId).cards.map(card => card.id);

// Replays a drop the way App does: translate, then let the real reducer splice.
const drop = (lists, filters, source, destination, draggableId) => {
  const indexes = toStoreIndexes(lists, filters, source, destination, draggableId);

  return listsReducer(
    lists,
    sort(
      source.droppableId,
      destination.droppableId,
      indexes.startIndex,
      indexes.endIndex,
      draggableId,
      'card'
    )
  );
};

const visibleIds = (state, listId, filters) =>
  visibleCards(
    state.find(list => list.id === listId).cards,
    filters
  ).map(card => card.id);

describe('toStoreIndexes', () => {
  it('passes the indexes straight through with no filter', () => {
    const indexes = toStoreIndexes(
      board(),
      noFilter,
      at('list-a', 2),
      at('list-a', 0),
      'c3'
    );

    expect(indexes).toEqual({ startIndex: 2, endIndex: 0 });
  });

  it('maps a view index onto the card it actually points at', () => {
    // c3 sits at view index 1 but store index 2
    const indexes = toStoreIndexes(
      board(),
      onlyTasks,
      at('list-a', 1),
      at('list-a', 0),
      'c3'
    );

    expect(indexes.startIndex).toBe(2);
  });

  it('gives up on an unknown list', () => {
    expect(
      toStoreIndexes(board(), onlyTasks, at('list-z', 0), at('list-a', 0), 'c1')
    ).toBeNull();
  });

  it('gives up when the dragged card is not in the source list', () => {
    expect(
      toStoreIndexes(board(), onlyTasks, at('list-a', 0), at('list-a', 1), 'c6')
    ).toBeNull();
  });

  it('appends when the destination has nothing visible', () => {
    // priority lowest: only c4 shows, and list-b shows nothing at all
    const filters = { type: ALL, priority: 'lowest' };

    const indexes = toStoreIndexes(
      board(),
      filters,
      at('list-a', 0),
      at('list-b', 0),
      'c4'
    );

    expect(indexes).toEqual({ startIndex: 3, endIndex: 2 });
  });
});

// The translation is only correct if the reducer, which splices against the full
// arrays, lands the card where the filtered view showed it being dropped.
describe('dropping a card while filtered', () => {
  it('reorders within a list without disturbing the hidden cards', () => {
    // drag c1 below c3 in the view: [c1, c3] -> [c3, c1]
    const state = drop(board(), onlyTasks, at('list-a', 0), at('list-a', 1), 'c1');

    expect(visibleIds(state, 'list-a', onlyTasks)).toEqual(['c3', 'c1']);
    expect(cardIds(state, 'list-a')).toEqual(['c2', 'c3', 'c1', 'c4']);
  });

  it('reorders upwards just the same', () => {
    // drag c3 above c1 in the view: [c1, c3] -> [c3, c1]
    const state = drop(board(), onlyTasks, at('list-a', 1), at('list-a', 0), 'c3');

    expect(visibleIds(state, 'list-a', onlyTasks)).toEqual(['c3', 'c1']);
    expect(cardIds(state, 'list-a')).toEqual(['c3', 'c1', 'c2', 'c4']);
  });

  it('moves a card across lists above the visible card it was dropped on', () => {
    const state = drop(board(), onlyTasks, at('list-a', 0), at('list-b', 0), 'c1');

    expect(visibleIds(state, 'list-b', onlyTasks)).toEqual(['c1', 'c6']);
    // the hidden c5 keeps its place at the top of the list
    expect(cardIds(state, 'list-b')).toEqual(['c5', 'c1', 'c6']);
    expect(cardIds(state, 'list-a')).toEqual(['c2', 'c3', 'c4']);
  });

  it('moves a card to the end of another list', () => {
    const state = drop(board(), onlyTasks, at('list-a', 0), at('list-b', 1), 'c1');

    expect(visibleIds(state, 'list-b', onlyTasks)).toEqual(['c6', 'c1']);
    expect(cardIds(state, 'list-b')).toEqual(['c5', 'c6', 'c1']);
  });

  it('drops into a list whose cards are all hidden', () => {
    const filters = { type: ALL, priority: 'lowest' };

    const state = drop(board(), filters, at('list-a', 0), at('list-b', 0), 'c4');

    expect(cardIds(state, 'list-b')).toEqual(['c5', 'c6', 'c4']);
    expect(cardIds(state, 'list-a')).toEqual(['c1', 'c2', 'c3']);
  });

  // Both directions of the same trap: re-deriving the position from the visible
  // cards alone moved the card past a hidden neighbour, downwards from the first
  // visible slot and upwards from the last one.
  it('leaves the board unchanged when a card is dropped where it already was', () => {
    const state = drop(board(), onlyTasks, at('list-a', 1), at('list-a', 1), 'c3');

    expect(cardIds(state, 'list-a')).toEqual(['c1', 'c2', 'c3', 'c4']);
  });

  it('leaves the board unchanged for a no-op drop on the first visible card', () => {
    const state = drop(board(), onlyTasks, at('list-a', 0), at('list-a', 0), 'c1');

    expect(cardIds(state, 'list-a')).toEqual(['c1', 'c2', 'c3', 'c4']);
  });

  it('leaves the board unchanged for a no-op drop with no filter active', () => {
    const state = drop(board(), noFilter, at('list-a', 2), at('list-a', 2), 'c3');

    expect(cardIds(state, 'list-a')).toEqual(['c1', 'c2', 'c3', 'c4']);
  });
});
