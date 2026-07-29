import { configureStore } from '@reduxjs/toolkit';
import listsReducer from './listsSlice';
import { loadBoard, saveBoard } from './persistence';

const persistedLists = loadBoard();

const store = configureStore({
  reducer: { lists: listsReducer },
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