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
    }
];

const listsReducer = (state = initialState, action) => {
    switch (action.type) {
        default:
            return state;
    }
};

export default listsReducer;