import { isFilterActive, visibleCards } from './filtersSlice';

/**
 * Translates the indexes reported by a card drop into indexes the `sort` reducer
 * can splice with.
 *
 * The board only renders the cards that pass the active filter, so a drop
 * reports positions within that filtered view, while `sort` splices against the
 * full `cards` arrays. Dispatching the view indexes unchanged would move the
 * wrong card as soon as a filter hides anything. With no filter active both
 * views are the same array and this is a pass-through.
 *
 * Returns null when the drop cannot be resolved (unknown list, or a card that is
 * no longer where it was dragged from), which the caller treats as "do nothing".
 */
export const toStoreIndexes = (lists, filters, source, destination, draggableId) => {
    if (!isFilterActive(filters)) {
        return { startIndex: source.index, endIndex: destination.index };
    }

    const startList = lists.find(list => list.id === source.droppableId);
    const endList = lists.find(list => list.id === destination.droppableId);

    if (!startList || !endList) {
        return null;
    }

    const startIndex = startList.cards.findIndex(card => card.id === draggableId);

    if (startIndex === -1) {
        return null;
    }

    // `sort` removes the card before inserting it, so within one list the
    // destination index applies to the array that no longer holds it.
    const endCards =
        startList === endList
            ? endList.cards.filter(card => card.id !== draggableId)
            : endList.cards;

    const visible = visibleCards(endCards, filters);
    const indexOf = card => endCards.findIndex(item => item.id === card.id);

    // Land right before the visible card that will follow it. Dropped past the
    // last visible card, it goes straight after that one rather than at the end
    // of the array, so hidden cards trailing the list stay where they are.
    if (destination.index < visible.length) {
        return { startIndex, endIndex: indexOf(visible[destination.index]) };
    }

    if (visible.length > 0) {
        return { startIndex, endIndex: indexOf(visible.at(-1)) + 1 };
    }

    // Nothing visible in the destination: append.
    return { startIndex, endIndex: endCards.length };
};
