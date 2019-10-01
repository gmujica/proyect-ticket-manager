import React from 'react';
import Trellocard from './TrelloCard';
//import { Card } from '@material-ui/core';

const List = ({ title, cards }) => {
    return(
        <div style={styles.container}>
            <h4>{title}</h4>
            {cards.map(Card => (
            <Trellocard tetx={Card.text} /> 
            ))}
        </div>
    );
};

const styles = {
    container: {
        backgroundColor: "#ccc",
        borderRadius: 3,
        width: 300,
        padding: 8
    }
};

export default List;