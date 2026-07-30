import filtersReducer, {
  ALL,
  clearFilters,
  isFilterActive,
  matchesFilters,
  setPriorityFilter,
  setTypeFilter,
  visibleCards
} from './filtersSlice';

const cards = [
  { id: 'c1', text: 'one', type: 'task', priority: 'medium' },
  { id: 'c2', text: 'two', type: 'bug', priority: 'high' },
  { id: 'c3', text: 'three', type: 'task', priority: 'low' }
];

const ids = list => list.map(card => card.id);

describe('filtersSlice', () => {
  it('starts with nothing filtered', () => {
    expect(filtersReducer(undefined, { type: 'INIT' })).toEqual({
      type: ALL,
      priority: ALL
    });
  });

  it('sets a type', () => {
    const state = filtersReducer(undefined, setTypeFilter('bug'));

    expect(state).toEqual({ type: 'bug', priority: ALL });
  });

  it('sets a priority', () => {
    const state = filtersReducer(undefined, setPriorityFilter('highest'));

    expect(state).toEqual({ type: ALL, priority: 'highest' });
  });

  it('keeps both fields independent', () => {
    let state = filtersReducer(undefined, setTypeFilter('story'));
    state = filtersReducer(state, setPriorityFilter('low'));

    expect(state).toEqual({ type: 'story', priority: 'low' });
  });

  // A key outside the catalog would hide every card with no way back.
  it('falls back to all for an unknown type', () => {
    const state = filtersReducer({ type: 'bug', priority: ALL }, setTypeFilter('epic'));

    expect(state.type).toBe(ALL);
  });

  it('falls back to all for an unknown priority', () => {
    const state = filtersReducer(
      { type: ALL, priority: 'low' },
      setPriorityFilter('urgent')
    );

    expect(state.priority).toBe(ALL);
  });

  it('clears both fields at once', () => {
    const state = filtersReducer({ type: 'bug', priority: 'high' }, clearFilters());

    expect(state).toEqual({ type: ALL, priority: ALL });
  });
});

describe('isFilterActive', () => {
  it('is false with nothing set', () => {
    expect(isFilterActive({ type: ALL, priority: ALL })).toBe(false);
  });

  it('is true with either field set', () => {
    expect(isFilterActive({ type: 'bug', priority: ALL })).toBe(true);
    expect(isFilterActive({ type: ALL, priority: 'low' })).toBe(true);
  });
});

describe('matchesFilters', () => {
  it('accepts everything with nothing set', () => {
    expect(matchesFilters(cards[0], { type: ALL, priority: ALL })).toBe(true);
  });

  it('requires both fields to match', () => {
    const filters = { type: 'task', priority: 'low' };

    expect(matchesFilters(cards[2], filters)).toBe(true);
    // right type, wrong priority
    expect(matchesFilters(cards[0], filters)).toBe(false);
  });
});

describe('visibleCards', () => {
  it('returns the same array when no filter is set', () => {
    expect(visibleCards(cards, { type: ALL, priority: ALL })).toBe(cards);
  });

  it('keeps only the matching cards, in board order', () => {
    expect(ids(visibleCards(cards, { type: 'task', priority: ALL }))).toEqual([
      'c1',
      'c3'
    ]);
  });

  it('can end up empty', () => {
    expect(visibleCards(cards, { type: 'story', priority: ALL })).toEqual([]);
  });
});
