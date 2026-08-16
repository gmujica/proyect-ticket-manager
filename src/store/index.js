import { configureStore } from '@reduxjs/toolkit';
import * as api from '../api/client';
import authReducer from './authSlice';
import boardsReducer, { preloadedBoards } from './boardsSlice';
import filtersReducer from './filtersSlice';
import listsReducer from './listsSlice';
import {
    loadActiveBoardId,
    loadBoard,
    saveActiveBoardId,
    saveBoard
} from './persistence';

// The board that was open when this browser was last here, and its contents.
// Reading both is what makes a reload come back to the same board without
// waiting for the API: the session and the board list are answered a moment
// later, and `bootstrapSession` corrects the screen if either has changed.
const activeBoardId = loadActiveBoardId();
const persistedLists = loadBoard(activeBoardId);

// Only `lists` and the active board id are preloaded: `filters` is view state
// and starts cleared on every visit, and `auth` is answered by the server on
// boot, so neither has anything in localStorage to restore.
//
// The API client is handed to the thunks as their extra argument rather than
// imported by each of them, so a test can drive the board operations against a
// stub without touching the module registry.
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
        boards: preloadedBoards(activeBoardId),
        ...(persistedLists ? { lists: persistedLists } : {})
    }
});

// Persist on every change to the board, and on every change of which board that
// is. The reducers are immutable, so a changed reference is a reliable signal
// and unrelated dispatches cost nothing.
//
// This one stays undebounced on purpose, unlike the push to the server in
// sync.js: localStorage is synchronous and local, so writing on every dispatch
// costs nothing and guarantees the board survives a tab closed mid-edit.
let previousLists = store.getState().lists;
let previousBoardId = store.getState().boards.activeId;

store.subscribe(() => {
    const { boards, lists } = store.getState();
    const switched = boards.activeId !== previousBoardId;

    if (switched) {
        previousBoardId = boards.activeId;
        saveActiveBoardId(boards.activeId);
    }

    // A switch is written even when the lists come out identical: they are the
    // same board's lists under a different key, and the point of the write is
    // the key. `boards.activeId` is read from the state that carries these
    // lists, never from before the switch, which is what keeps one board's work
    // from being filed under another's name.
    if (switched || lists !== previousLists) {
        previousLists = lists;
        saveBoard(boards.activeId, lists);
    }
});

export default store;