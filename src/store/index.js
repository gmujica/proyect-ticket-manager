import { configureStore } from '@reduxjs/toolkit';
import filtersReducer from './filtersSlice';
import listsReducer from './listsSlice';
import { loadBoard, saveBoard } from './persistence';

const persistedLists = loadBoard();

// Only `lists` is preloaded: `filters` is view state and starts cleared on every
// visit, so it deliberately has nothing in localStorage to restore.
const store = configureStore({
  reducer: { filters: filtersReducer, lists: listsReducer },
  preloadedState: persistedLists ? { lists: persistedLists } : undefined
});

// Persist on every change to the board. The reducer is immutable, so a changed
// reference is a reliable signal and unrelated dispatches cost nothing.
let previousLists = store.getState().lists;

store.subscribe(() => {
  const { lists } = store.getState();
  if (lists !== previousLists) {
    previousLists = lists;
    saveBoard(lists);
  }
});

export default store;