import { CONSTANTS } from '../actions';
import { DEFAULT_PRIORITY, DEFAULT_TYPE } from '../constants/ticket';

export const addCard = (listID, text, type = DEFAULT_TYPE, priority = DEFAULT_PRIORITY) => {
    return {
        type: CONSTANTS.ADD_CARD,
        payload: { text, listID, ticketType: type, priority }
    };
};

export const deleteCard = (listID, cardID) => {
    return {
        type: CONSTANTS.DELETE_CARD,
        payload: { listID, cardID }
    };
};
