import { createSlice } from '@reduxjs/toolkit';

// What the account has, and which one is on screen. The contents of the board on
// screen stay in `lists`, exactly where they were before boards had ids: `App`,
// the lists, the filters and the drag and drop code go on reading "the board"
// and none of them has to learn that there is now more than one.
//
// `busy` covers the operations that talk to the server — opening, creating,
// renaming, deleting — and is what keeps the switcher from firing a second one
// on top of the first.
const initialState = { items: [], activeId: null, busy: false };

// Only the fields the switcher needs. A board's lists never travel in here, so
// there is no chance of the list on the left and the board on screen disagreeing
// about what is on it.
const toItem = board => ({
    id: board.id,
    name: board.name,
    updatedAt: board.updatedAt ?? null
});

const isBoard = board =>
    board && typeof board.id === 'string' && typeof board.name === 'string';

const boardsSlice = createSlice({
    name: 'boards',
    initialState,
    reducers: {
        // The list as the server has it. A malformed entry is dropped rather than
        // rendered as an unlabelled row that opens nothing.
        boardsLoaded(state, action) {
            state.items = action.payload.filter(isBoard).map(toItem);
        },

        /**
         * Switching boards, in one action for both slices.
         *
         * `listsSlice` handles this same action to swap in `payload.lists`, and
         * that is the whole point of it existing: setting the id and the lists in
         * two dispatches would leave a state in between where the new board's id
         * sits next to the old board's lists. Both subscribers on the store —
         * the one that writes to localStorage and the one that uploads — would
         * take that snapshot at face value and file one board's work under
         * another board's name.
         */
        boardOpened(state, action) {
            state.activeId = action.payload.id;
        },

        boardAdded(state, action) {
            state.items.push(toItem(action.payload));
        },

        boardRenamed(state, action) {
            const board = state.items.find(item => item.id === action.payload.id);

            if (board) {
                board.name = action.payload.name;
            }
        },

        boardRemoved(state, action) {
            state.items = state.items.filter(item => item.id !== action.payload);
        },

        // Signing out: the account's boards stop being this browser's business.
        // `listsSlice` handles it too, to put the anonymous board back on screen
        // in place of the one that belonged to the session.
        boardsCleared(state) {
            state.items = [];
            state.activeId = null;
            state.busy = false;
        },

        boardsBusy(state, action) {
            state.busy = action.payload;
        }
    }
});

/** The board on screen, or null while nobody is signed in. */
export const activeBoard = state =>
    state.boards.items.find(item => item.id === state.boards.activeId) ?? null;

/**
 * The slice as it starts on boot, with the board that was open last time already
 * selected. The id is all that survives a reload; the list of boards is answered
 * by the server, and the lists by whichever of localStorage and the API gets
 * there first.
 */
export const preloadedBoards = activeId => ({ ...initialState, activeId });

export const {
    boardAdded,
    boardOpened,
    boardRemoved,
    boardRenamed,
    boardsBusy,
    boardsCleared,
    boardsLoaded
} = boardsSlice.actions;

export default boardsSlice.reducer;
