// Everything the switcher does that needs the server. It lives in thunks rather
// than in the components because each of these is more than one dispatch, and
// because the order of those dispatches is the difference between a board being
// filed correctly and being filed under its neighbour.
//
// The API client arrives as the thunk's third argument — `extraArgument`, set in
// store/index.js — so a test can drive these against a stub without reaching for
// the module registry.

import { signedOut } from './authSlice';
import {
    boardAdded,
    boardOpened,
    boardRemoved,
    boardRenamed,
    boardsBusy,
    boardsCleared
} from './boardsSlice';
import { forgetBoard, loadBoard } from './persistence';

// What the caller shows when something did not work. The API's own sentence when
// there is one — "Too many boards" says more than any wording invented here —
// and a generic line when the request never got an answer at all.
const failed = (error, fallback) => ({
    ok: false,
    error: error?.detail ?? fallback
});

/**
 * Fetches a board and puts it on screen. Returns false when the account no
 * longer has it.
 *
 * The busy flag is deliberately left to the caller: opening a board can be the
 * second half of a larger operation (deleting the one currently on screen), and
 * the switcher should stay disabled until the whole of it is over.
 */
const swapIn = async (dispatch, api, id) => {
    const opened = await api.fetchBoard(id);

    if (!opened) {
        return false;
    }

    dispatch(boardOpened({ id, lists: opened.lists }));

    return true;
};

export const openBoard = id => async (dispatch, getState, api) => {
    if (id === getState().boards.activeId) {
        return { ok: true };
    }

    dispatch(boardsBusy(true));

    try {
        if (await swapIn(dispatch, api, id)) {
            return { ok: true };
        }

        // Deleted from another tab or another device. Dropping it from the list
        // is the honest answer: it is not coming back, and leaving the row there
        // invites the same failed click again.
        dispatch(boardRemoved(id));

        return { ok: false, error: 'That board no longer exists.' };
    } catch (error) {
        // The board on screen is untouched, which is what makes this safe to
        // report and forget: nothing was half-switched.
        return failed(error, 'Could not open that board.');
    } finally {
        dispatch(boardsBusy(false));
    }
};

export const createBoard = name => async (dispatch, getState, api) => {
    dispatch(boardsBusy(true));

    try {
        const board = await api.createBoard(name);

        if (!board) {
            return { ok: false, error: 'Your session has ended. Sign in again.' };
        }

        dispatch(boardAdded(board));
        // Opened right away, and empty rather than fetched: the server just told
        // us it has no lists. Creating a board and staying on the previous one
        // would leave the person wondering whether it worked.
        dispatch(boardOpened({ id: board.id, lists: [] }));

        return { ok: true, board };
    } catch (error) {
        return failed(error, 'Could not create the board.');
    } finally {
        dispatch(boardsBusy(false));
    }
};

export const renameBoard = (id, name) => async (dispatch, getState, api) => {
    dispatch(boardsBusy(true));

    try {
        const board = await api.renameBoard(id, name);

        if (!board) {
            return { ok: false, error: 'Your session has ended. Sign in again.' };
        }

        dispatch(boardRenamed({ id, name: board.name }));

        return { ok: true, board };
    } catch (error) {
        return failed(error, 'Could not rename the board.');
    } finally {
        dispatch(boardsBusy(false));
    }
};

/**
 * Deletes a board with everything on it, and moves to another one when it was
 * the board on screen.
 *
 * The last board is refused rather than deleted. The API would allow it, but an
 * account with no boards has nothing to draw, and the recovery — creating one
 * before anything can be typed into it — is worse than the rename the person
 * probably wanted in the first place.
 */
export const removeBoard = id => async (dispatch, getState, api) => {
    const remaining = getState().boards.items.filter(item => item.id !== id);

    if (remaining.length === 0) {
        return { ok: false, error: 'A board cannot be deleted while it is the only one.' };
    }

    dispatch(boardsBusy(true));

    try {
        await api.deleteBoard(id);
        dispatch(boardRemoved(id));
        forgetBoard(id);

        // Only after the delete succeeded, and only when it took the board on
        // screen with it. Moving first would put someone on a different board and
        // then leave them there with the one they asked to delete still present.
        if (getState().boards.activeId === id) {
            await swapIn(dispatch, api, remaining[0].id);
        }

        return { ok: true };
    } catch (error) {
        return failed(error, 'Could not delete the board.');
    } finally {
        dispatch(boardsBusy(false));
    }
};

/**
 * Ends the session and hands the screen back to the board this browser owns.
 *
 * The store is updated before the request, not after: the save of the board is
 * on a delay, and clearing the active board is what flushes it. Doing that after
 * the cookie is gone would push the last edits into a 401.
 *
 * The session ends locally even if the request fails, for the same reason it
 * always has: if the cookie survived, the cost is one extra sign-in, and a UI
 * claiming a session that may be over is worse than that.
 */
export const signOut = () => async (dispatch, getState, api) => {
    dispatch(signedOut());
    dispatch(boardsCleared({ lists: loadBoard() }));

    try {
        await api.logout();
    } catch {
        // already signed out as far as this tab is concerned
    }
};