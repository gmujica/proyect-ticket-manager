import { createSlice, nanoid } from '@reduxjs/toolkit';
import {
    DEFAULT_PRIORITY,
    DEFAULT_TYPE,
    isValidPriority,
    isValidType
} from '../constants/ticket';
import { boardOpened, boardsCleared } from './boardsSlice';
import { normalizeBoard } from './boardSchema';

// IDs come from nanoid rather than incrementing counters: counters reset to their
// initial value on every page load, which would collide with the IDs restored
// from localStorage. They are minted in `prepare` so the reducers stay pure.

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

const listsSlice = createSlice({
    name: 'lists',
    initialState,
    // The bodies below look like mutations but run against an Immer draft, so
    // every dispatch still produces a new state. That matters beyond style:
    // src/store/index.js persists on reference change, so an accidental real
    // mutation would silently stop the board from saving.
    reducers: {
        addList: {
            reducer(state, action) {
                state.push({ ...action.payload, cards: [] });
            },
            prepare(title) {
                return { payload: { id: `list-${nanoid()}`, title } };
            }
        },

        addCard: {
            reducer(state, action) {
                const { listID, ...card } = action.payload;
                const list = state.find(item => item.id === listID);

                if (list) {
                    list.cards.push(card);
                }
            },
            prepare(listID, text, type = DEFAULT_TYPE, priority = DEFAULT_PRIORITY) {
                return {
                    payload: { listID, id: `card-${nanoid()}`, text, type, priority }
                };
            }
        },

        // Blank text and unknown type/priority keys are dropped rather than
        // written: the same rule filtersSlice applies to its own input, and it
        // keeps a card from ending up untitled or rendering without an icon.
        // Each field is checked on its own, so a bad one never discards a good.
        editCard: {
            reducer(state, action) {
                const { listID, cardID, text, type, priority } = action.payload;
                const card = state
                    .find(item => item.id === listID)
                    ?.cards.find(item => item.id === cardID);

                if (!card) {
                    return;
                }

                if (typeof text === 'string' && text.trim()) {
                    card.text = text.trim();
                }

                if (isValidType(type)) {
                    card.type = type;
                }

                if (isValidPriority(priority)) {
                    card.priority = priority;
                }
            },
            prepare(listID, cardID, text, type, priority) {
                return { payload: { listID, cardID, text, type, priority } };
            }
        },

        renameList: {
            reducer(state, action) {
                const { listID, title } = action.payload;
                const list = state.find(item => item.id === listID);

                if (list && typeof title === 'string' && title.trim()) {
                    list.title = title.trim();
                }
            },
            prepare(listID, title) {
                return { payload: { listID, title } };
            }
        },

        // Takes the list's cards with it, which is why the UI confirms first
        // whenever the list is not already empty.
        deleteList: {
            reducer(state, action) {
                const index = state.findIndex(
                    item => item.id === action.payload.listID
                );

                if (index !== -1) {
                    state.splice(index, 1);
                }
            },
            prepare(listID) {
                return { payload: { listID } };
            }
        },

        deleteCard: {
            reducer(state, action) {
                const { listID, cardID } = action.payload;
                const list = state.find(item => item.id === listID);
                const index = list?.cards.findIndex(card => card.id === cardID) ?? -1;

                if (index !== -1) {
                    list.cards.splice(index, 1);
                }
            },
            prepare(listID, cardID) {
                return { payload: { listID, cardID } };
            }
        },

        sort: {
            reducer(state, action) {
                const {
                    droppableIdStart,
                    droppableIdEnd,
                    droppableIndexStart,
                    droppableIndexEnd,
                    type
                } = action.payload;

                // dragging a whole list to a new position
                if (type === 'list') {
                    const [movedList] = state.splice(droppableIndexStart, 1);
                    state.splice(droppableIndexEnd, 0, movedList);
                    return;
                }

                // One path covers both reordering within a list and moving across
                // lists: when the ids match, start and end are the same array.
                const listStart = state.find(item => item.id === droppableIdStart);
                const listEnd = state.find(item => item.id === droppableIdEnd);

                if (!listStart || !listEnd) {
                    return;
                }

                const [movedCard] = listStart.cards.splice(droppableIndexStart, 1);
                listEnd.cards.splice(droppableIndexEnd, 0, movedCard);
            },
            prepare(
                droppableIdStart,
                droppableIdEnd,
                droppableIndexStart,
                droppableIndexEnd,
                draggableId,
                type
            ) {
                return {
                    payload: {
                        droppableIdStart,
                        droppableIdEnd,
                        droppableIndexStart,
                        droppableIndexEnd,
                        draggableId,
                        type
                    }
                };
            }
        }
    },

    // The whole board is swapped from outside this slice, by the two actions
    // `boardsSlice` owns. They are handled here rather than answered with a
    // `replaceBoard` of our own so that the id of the board and its contents can
    // never be set by two separate dispatches — see the note on `boardOpened`.
    extraReducers: builder => {
        builder
            // A board arriving from the server. A response that is not a
            // well-formed board opens as an empty one: the alternative is keeping
            // the previous board's lists under the new board's id, and the
            // subscriber that uploads would then write them over it.
            .addCase(boardOpened, (state, action) =>
                normalizeBoard(action.payload.lists) ?? []
            )

            // Signing out, which puts the board of this browser back on screen.
            // Here there may be nothing to put back — a visitor who signed in on
            // a fresh browser never had a local board — and in that case the
            // board already on screen stays, and becomes the local one.
            .addCase(
                boardsCleared,
                (state, action) => normalizeBoard(action.payload?.lists) ?? state
            );
    }
});

export const {
    addCard,
    addList,
    deleteCard,
    deleteList,
    editCard,
    renameList,
    sort
} = listsSlice.actions;

export default listsSlice.reducer;