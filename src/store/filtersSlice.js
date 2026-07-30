import { createSlice } from '@reduxjs/toolkit';
import { isValidPriority, isValidType } from '../constants/ticket';

// Sentinel for "do not filter on this field". It is not a valid type or
// priority key, so it can never collide with a real one.
export const ALL = 'all';

const initialState = { type: ALL, priority: ALL };

// Filters are view state, not board data: they live outside the persisted slice
// on purpose, so a reload always comes back to the whole board instead of to a
// partial one with no visible explanation.
const filtersSlice = createSlice({
    name: 'filters',
    initialState,
    reducers: {
        // An unknown key would hide every card with no way back, so anything
        // outside the catalog falls back to showing everything.
        setTypeFilter(state, action) {
            state.type = isValidType(action.payload) ? action.payload : ALL;
        },

        setPriorityFilter(state, action) {
            state.priority = isValidPriority(action.payload) ? action.payload : ALL;
        },

        clearFilters() {
            return initialState;
        }
    }
});

export const isFilterActive = ({ type, priority }) =>
    type !== ALL || priority !== ALL;

export const matchesFilters = (card, { type, priority }) =>
    (type === ALL || card.type === type) &&
    (priority === ALL || card.priority === priority);

/**
 * The cards of a list that the active filter lets through. Returns the original
 * array when no filter is set, so an untouched board keeps its references and
 * renders exactly as it did before filtering existed.
 */
export const visibleCards = (cards, filters) =>
    isFilterActive(filters)
        ? cards.filter(card => matchesFilters(card, filters))
        : cards;

export const { clearFilters, setPriorityFilter, setTypeFilter } =
    filtersSlice.actions;

export default filtersSlice.reducer;