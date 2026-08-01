import {
    DEFAULT_PRIORITY,
    DEFAULT_TYPE,
    isValidPriority,
    isValidType
} from '../constants/ticket';

// Shared by the browser and by the Pages Functions under /functions: a board
// arriving from the API deserves exactly the same suspicion as one read out of
// localStorage, and duplicating these rules is how the two ends drift apart.

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
 * Returns the board in its canonical shape, or undefined when the input is not
 * a board at all. Unknown fields are dropped rather than carried through, so
 * nothing a caller did not ask for reaches the store or the database.
 *
 * A malformed *list* rejects the whole board, because a board missing a column
 * is worse than no board: the reducer would happily render the remains and the
 * user would think work had been lost. A malformed *card* is dropped on its own,
 * since the rest of the board is still coherent without it.
 */
export const normalizeBoard = value => {
    if (!Array.isArray(value) || !value.every(isValidList)) {
        return undefined;
    }

    return value.map(list => ({
        id: list.id,
        title: list.title,
        cards: list.cards.filter(isValidCard).map(normalizeCard)
    }));
};
