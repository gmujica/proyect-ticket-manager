import { signedIn, signedOut, syncSettled, syncStarted } from './authSlice';
import {
    boardAdded,
    boardOpened,
    boardRemoved,
    boardsCleared,
    boardsLoaded
} from './boardsSlice';
import { DEFAULT_BOARD_NAME } from '../constants/board';
import { debounce } from './debounce';
import { loadBoard } from './persistence';

// Long enough to swallow a burst of drags and keystrokes, short enough that the
// board is on the server before a normal person switches tabs.
export const SYNC_DELAY_MS = 1000;

/**
 * Which board to open of the ones the account has: the one that was open when
 * the tab was last closed, as long as the account still has it, and otherwise
 * the first of the list.
 */
const boardToOpen = (boards, remembered) =>
    boards.some(board => board.id === remembered) ? remembered : boards[0].id;

/**
 * Turns the board built in this browser into the account's first board.
 *
 * Two calls rather than one: the API creates boards empty, so the lists are a
 * separate save. In between, `boardOpened` moves the board on screen under the
 * new id — which is also what migrates its copy in localStorage from the
 * anonymous key to that board's own.
 */
const uploadLocalBoard = async (store, api) => {
    const { lists } = store.getState();
    const board = await api.createBoard(DEFAULT_BOARD_NAME);

    // Null only if the session ended between the two requests, which leaves the
    // local board on screen and unattached to any account — the state an
    // anonymous visitor is in, and the one the next edit is safe in.
    if (!board) {
        return false;
    }

    store.dispatch(boardAdded(board));
    store.dispatch(boardOpened({ id: board.id, lists }));

    await api.putBoard(board.id, lists);

    return true;
};

/**
 * Marks the visitor anonymous and puts the board of this browser back on screen.
 *
 * The second half only matters on a reload: the store boots with the board that
 * was open when the tab was closed, and if that session is over, that board is
 * not this browser's to show.
 */
const signOutLocally = store => {
    store.dispatch(signedOut());

    if (store.getState().boards.activeId !== null) {
        store.dispatch(boardsCleared({ lists: loadBoard() }));
    }
};

/**
 * Decides what is on screen at sign-in time.
 *
 * The asymmetry is deliberate. Boards on the server win over the local one,
 * because they are the account's and the local copy may be another visitor's
 * leftovers. No boards on the server means this is a first sign-in, and the
 * local board is the work the person did before creating an account — uploading
 * it is the difference between "my tickets came with me" and "my tickets are
 * gone".
 */
export const bootstrapSession = async (store, api) => {
    let user = null;

    try {
        user = await api.fetchMe();
    } catch {
        // The API being unreachable is not a reason to block the board: the app
        // still works against localStorage exactly as it did before any of this.
        signOutLocally(store);
        return { user: null, uploaded: false };
    }

    if (!user) {
        signOutLocally(store);
        return { user: null, uploaded: false };
    }

    store.dispatch(signedIn(user));

    try {
        const boards = await api.fetchBoards();

        if (boards.length === 0) {
            return { user, uploaded: await uploadLocalBoard(store, api) };
        }

        store.dispatch(boardsLoaded(boards));

        const id = boardToOpen(boards, store.getState().boards.activeId);
        const opened = await api.fetchBoard(id);

        if (opened) {
            store.dispatch(boardOpened({ id, lists: opened.lists }));
        } else {
            // Deleted from another device between the two requests. The local
            // board stays on screen — better than an empty one — and dropping
            // the board from the list is what keeps it there safely: the sync
            // refuses to push to a board the account does not have, so those
            // lists cannot end up written over a board they never belonged to.
            store.dispatch(boardRemoved(id));
        }

        return { user, uploaded: false };
    } catch {
        return { user, uploaded: false };
    }
};

/**
 * Pushes the board on screen to the server whenever it changes and someone is
 * signed in. Returns a function that stops the syncing and flushes anything
 * still pending.
 */
export const startBoardSync = (store, api, delay = SYNC_DELAY_MS) => {
    const initial = store.getState();
    let previousLists = initial.lists;
    let previousBoardId = initial.boards.activeId;

    // The board id travels with the lists rather than being read at the moment
    // the timer fires: a save that was queued for one board must land on that
    // board even if the person has moved on to another in the meantime.
    const push = debounce((boardId, lists) => {
        store.dispatch(syncStarted());

        // A failed save is deliberately quiet: localStorage already has the
        // board, so the work is not lost, and the next edit retries anyway.
        api
            .putBoard(boardId, lists)
            .catch(() => {})
            .finally(() => store.dispatch(syncSettled()));
    }, delay);

    const unsubscribe = store.subscribe(() => {
        const state = store.getState();
        const boardId = state.boards.activeId;

        if (boardId !== previousBoardId) {
            // A switch changes the lists too, but those lists came *from* the
            // server, so pushing them back would at best be a no-op. What is
            // pending belongs to the board being left, and carries its id, so
            // flushing it sends it where it goes. The bookkeeping is updated
            // first: the flush dispatches, and would otherwise be seen here
            // again as a change of its own.
            previousBoardId = boardId;
            previousLists = state.lists;
            push.flush();
            return;
        }

        if (state.lists === previousLists) {
            return;
        }

        previousLists = state.lists;

        // Never pushed to a board the account does not have. An id can outlive
        // its board — deleted from another tab, or left over from a session that
        // ended — and a save aimed at one is a 404 at best.
        const known = state.boards.items.some(item => item.id === boardId);

        if (state.auth.status === 'authenticated' && known) {
            push(boardId, state.lists);
        }
    });

    return () => {
        push.flush();
        unsubscribe();
    };
};