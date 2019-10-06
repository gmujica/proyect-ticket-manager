import { CONSTANTS } from '../actions';

let listID = 2;
let cardID = 4;

const initialState = [
    {
        title: "To Do List",
        id: 0,
        cards: [
            {
                id: 0,
                text: "lorem de prueba para la lista"
            },
            {
                id: 1,
                text: "lorem de prueba para la lista 2"
            }
        ]
    },
    {
        title: "In Process",
        id: 1,
        cards: [
            {
                id: 0,
                text: "lorem de prueba para la lista"
            },
            {
                id: 1,
                text: "lorem de prueba para la lista 2"
            },
            {
                id: 2,
                text: "lorem de prueba para la lista 3"
            },
            {
                id: 3,
                text: "lorem de prueba para la lista 4"
            }
        ]
    }
];

const listsReducer = (state = initialState, action) => {
    switch (action.type) {

        case CONSTANTS.ADD_LIST:
            const newList = {
                title: action.payload,
                cards: [],
                id: listID
            };
            listID += 1
            return [...state,  newList];

        case CONSTANTS.ADD_CARD:
            const newCard = {
                text: action.payload.text,
                id: cardID
            };
            cardID += 1;

            console.log('action received', action);

        const newState = state.map(list => {
            if(list.id === action.payload.listID) {
                return {
                    ...list,
                    cards: [...list.cards, newCard]
                };
            } else {
                return list;
            }
        });

        return newState;
        
        default:
            return state;
    }
};

export default listsReducer;