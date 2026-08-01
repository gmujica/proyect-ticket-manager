import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import filtersReducer from './filtersSlice';
import listsReducer from './listsSlice';
import { loadBoard, saveBoard } from './persistence';

const persistedLists = loadBoard();

// Only `lists` is preloaded: `filters` is view state and starts cleared on every
// visit, and `auth` is answered by the server on boot, so neither has anything
// in localStorage to restore.
const store = configureStore({
  reducer: {
    auth: authReducer,
    filters: filtersReducer,
    lists: listsReducer
  },
  preloadedState: persistedLists ? { lists: persistedLists } : undefined
});

// Persist on every change to the board. The reducer is immutable, so a changed
// reference is a reliable signal and unrelated dispatches cost nothing.
//
// This one stays undebounced on purpose, unlike the push to the server in
// sync.js: localStorage is synchronous and local, so writing on every dispatch
// costs nothing and guarantees the board survives a tab closed mid-edit.
let previousLists = store.getState().lists;

store.subscribe(() => {
  const { lists } = store.getState();
  if (lists !== previousLists) {
    previousLists = lists;
    saveBoard(lists);
  }
});

export default store;