import { normalizeBoard } from './boardSchema';

const STORAGE_KEY = 'ptm.board.v1';

/**
 * Returns the persisted board, or undefined so the reducer falls back to its
 * seed data. Anything unreadable or malformed is treated as "no saved board"
 * rather than crashing the app on boot.
 */
export const loadBoard = () => {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return undefined;
        }

        return normalizeBoard(JSON.parse(raw));
    } catch {
        // corrupt JSON, or storage blocked (private mode / disabled cookies)
        return undefined;
    }
};

export const saveBoard = lists => {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
    } catch {
        // quota exceeded or storage unavailable: the board simply won't persist
    }
};
