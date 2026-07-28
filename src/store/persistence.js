import {
    DEFAULT_PRIORITY,
    DEFAULT_TYPE,
    isValidPriority,
    isValidType
} from '../constants/ticket';

const STORAGE_KEY = 'ptm.board.v1';

const isValidCard = card =>
    card && typeof card.id === 'string' && typeof card.text === 'string';

const isValidList = list =>
    list &&
    typeof list.id === 'string' &&
    typeof list.title === 'string' &&
    Array.isArray(list.cards);

// Cards saved before type/priority existed, or with a value that is no longer in
// the catalog, are brought back on the defaults instead of rendering as blank.
const normalizeCard = card => ({
    id: card.id,
    text: card.text,
    type: isValidType(card.type) ? card.type : DEFAULT_TYPE,
    priority: isValidPriority(card.priority) ? card.priority : DEFAULT_PRIORITY
});

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

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed) || !parsed.every(isValidList)) {
            return undefined;
        }

        return parsed.map(list => ({
            id: list.id,
            title: list.title,
            cards: list.cards.filter(isValidCard).map(normalizeCard)
        }));
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
