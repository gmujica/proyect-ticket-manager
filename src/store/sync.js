import { signedIn, signedOut, syncSettled, syncStarted } from './authSlice';
import { debounce } from './debounce';
import { replaceBoard } from './listsSlice';

// Long enough to swallow a burst of drags and keystrokes, short enough that the
// board is on the server before a normal person switches tabs.
export const SYNC_DELAY_MS = 1000;

/**
 * Decides what the board should be at sign-in time.
 *
 * The asymmetry is deliberate. A board on the server wins over the local one,
 * because it is the account's board and the local copy may be another visitor's
 * leftovers. No board on the server means this is a first sign-in, and the local
 * board is the work the person did before creating an account — uploading it is
 * the difference between "my tickets came with me" and "my tickets are gone".
 */
export const bootstrapSession = async (store, api) => {
    let user = null;

    try {
        user = await api.fetchMe();
    } catch {
        // The API being unreachable is not a reason to block the board: the app
        // still works against localStorage exactly as it did before any of this.
        store.dispatch(signedOut());
        return { user: null, uploaded: false };
    }

    if (!user) {
        store.dispatch(signedOut());
        return { user: null, uploaded: false };
    }

    store.dispatch(signedIn(user));

    try {
        const board = await api.fetchBoard();

        if (board) {
            store.dispatch(replaceBoard(board));
            return { user, uploaded: false };
        }

        await api.putBoard(store.getState().lists);
        return { user, uploaded: true };
    } catch {
        return { user, uploaded: false };
    }
};

/**
 * Pushes the board to the server whenever it changes and someone is signed in.
 * Returns a function that stops the syncing and flushes anything still pending.
 */
export const startBoardSync = (store, api, delay = SYNC_DELAY_MS) => {
    let previousLists = store.getState().lists;

    const push = debounce(lists => {
        store.dispatch(syncStarted());

        // A failed save is deliberately quiet: localStorage already has the
        // board, so the work is not lost, and the next edit retries anyway.
        api
            .putBoard(lists)
            .catch(() => {})
            .finally(() => store.dispatch(syncSettled()));
    }, delay);

    const unsubscribe = store.subscribe(() => {
        const state = store.getState();

        if (state.lists === previousLists) {
            return;
        }

        previousLists = state.lists;

        if (state.auth.status === 'authenticated') {
            push(state.lists);
        }
    });

    return () => {
        push.flush();
        unsubscribe();
    };
};
