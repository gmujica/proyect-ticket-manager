import { nanoid } from '@reduxjs/toolkit';
import { CONSTANTS } from '../actions';
import { DEFAULT_PRIORITY, DEFAULT_TYPE } from '../constants/ticket';

// IDs come from nanoid rather than incrementing counters: counters reset to their
// initial value on every page load, which would collide with the IDs restored
// from localStorage.

const initialState = [
    {
        title: "To Do List",
        id: 'list-todo',
        cards: [
            {
                id: 'card-seed-1',
                text: "Set up the project board",
                type: 'task',
                priority: 'medium'
            },
            {
                id: 'card-seed-2',
                text: "Login fails with an expired session token",
                type: 'bug',
                priority: 'highest'
            }
        ]
    },
    {
        title: "In Process",
        id: 'list-in-process',
        cards: [
            {
                id: 'card-seed-3',
                text: "As a user I want to filter tickets by priority",
                type: 'story',
                priority: 'high'
            },
            {
                id: 'card-seed-4',
                text: "Update the deployment documentation",
                type: 'task',
                priority: 'low'
            }
        ]
    }
];

const listsReducer = (state = initialState, action) => {
    switch (action.type) {

        case CONSTANTS.ADD_LIST: {
            const newList = {
                title: action.payload,
                cards: [],
                id: `list-${nanoid()}`
            };
            return [...state, newList];
        }

        case CONSTANTS.ADD_CARD: {
            const newCard = {
                id: `card-${nanoid()}`,
                text: action.payload.text,
                type: action.payload.ticketType || DEFAULT_TYPE,
                priority: action.payload.priority || DEFAULT_PRIORITY
            };

            return state.map(list =>
                list.id === action.payload.listID
                    ? { ...list, cards: [...list.cards, newCard] }
                    : list
            );
        }

        case CONSTANTS.DELETE_CARD: {
            const { listID, cardID } = action.payload;

            return state.map(list =>
                list.id === listID
                    ? { ...list, cards: list.cards.filter(card => card.id !== cardID) }
                    : list
            );
        }

        case CONSTANTS.DRAG_HAPPENED: {
            const {
                droppableIdStart,
                droppableIdEnd,
                droppableIndexEnd,
                droppableIndexStart,
                type
            } = action.payload;

            // dragging a whole list to a new position
            if (type === 'list') {
                const newState = [...state];
                const [movedList] = newState.splice(droppableIndexStart, 1);
                newState.splice(droppableIndexEnd, 0, movedList);
                return newState;
            }

            // reordering cards inside the same list
            if (droppableIdStart === droppableIdEnd) {
                return state.map(list => {
                    if (list.id !== droppableIdStart) {
                        return list;
                    }
                    const cards = [...list.cards];
                    const [movedCard] = cards.splice(droppableIndexStart, 1);
                    cards.splice(droppableIndexEnd, 0, movedCard);
                    return { ...list, cards };
                });
            }

            // moving a card from one list to another
            const listStart = state.find(list => list.id === droppableIdStart);
            const movedCard = listStart.cards[droppableIndexStart];

            return state.map(list => {
                if (list.id === droppableIdStart) {
                    return {
                        ...list,
                        cards: list.cards.filter((_, i) => i !== droppableIndexStart)
                    };
                }
                if (list.id === droppableIdEnd) {
                    const cards = [...list.cards];
                    cards.splice(droppableIndexEnd, 0, movedCard);
                    return { ...list, cards };
                }
                return list;
            });
        }

        default:
            return state;
    }
};

export default listsReducer;
