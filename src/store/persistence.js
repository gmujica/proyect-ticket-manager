import { normalizeBoard } from './boardSchema';

// One key per board. A single key would mean the board just opened overwriting
// the one left behind, and — the case that actually loses work — the board built
// in this browser before signing in being replaced the first time an account's
// board is opened.
//
// The board of an anonymous visitor keeps the bare key it has always had, so a
// browser that has never seen this version reads its board back unchanged.
const STORAGE_PREFIX = 'ptm.board.v1';

// Which board was open when the tab was closed. Only meaningful while signed in:
// it is what makes a reload come back to the board that was on screen instead of
// to the first one in the list.
const ACTIVE_KEY = 'ptm.activeBoard.v1';

const keyFor = boardId => (boardId ? `${STORAGE_PREFIX}.${boardId}` : STORAGE_PREFIX);

/**
 * Returns the persisted board, or undefined so the reducer falls back to its
 * seed data. Anything unreadable or malformed is treated as "no saved board"
 * rather than crashing the app on boot.
 *
 * Without an id it answers with the board of an anonymous visitor, which is the
 * one this browser owns rather than one that belongs to an account.
 */
export const loadBoard = (boardId = null) => {
    try {
        const raw = window.localStorage.getItem(keyFor(boardId));
        if (!raw) {
            return undefined;
        }

        return normalizeBoard(JSON.parse(raw));
    } catch {
        // corrupt JSON, or storage blocked (private mode / disabled cookies)
        return undefined;
    }
};

export const saveBoard = (boardId, lists) => {
    try {
        window.localStorage.setItem(keyFor(boardId), JSON.stringify(lists));
    } catch {
        // quota exceeded or storage unavailable: the board simply won't persist
    }
};

/**
 * Drops a board's copy in this browser, for a board that was deleted on the
 * server. Leaving it behind would not show it anywhere, but it would keep taking
 * up a quota that a handful of boards can genuinely exhaust.
 */
export const forgetBoard = boardId => {
    try {
        window.localStorage.removeItem(keyFor(boardId));
    } catch {
        // storage unavailable: nothing was written in the first place
    }
};

export const loadActiveBoardId = () => {
    try {
        return window.localStorage.getItem(ACTIVE_KEY) || null;
    } catch {
        return null;
    }
};

export const saveActiveBoardId = boardId => {
    try {
        if (boardId) {
            window.localStorage.setItem(ACTIVE_KEY, boardId);
        } else {
            // Signing out clears it rather than keeping the last board: the next
            // visitor to this browser is not necessarily the same person, and the
            // id would send them looking for somebody else's board.
            window.localStorage.removeItem(ACTIVE_KEY);
        }
    } catch {
        // storage unavailable: the next boot simply opens the first board
    }
};
