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
        default:
            return state;
    }
};

export default listsReducer;