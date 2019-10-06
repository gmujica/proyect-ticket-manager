import React from 'react';
import Trellocard from './TrelloCard';
import TrelloActionButton from './TrelloActionButton';
import { Droppable } from 'react-beautiful-dnd';

const TrelloList = ({ title, cards, listID }) => {
    return(
        <Droppable droppableId={String(listID)}>
            { provided => (
                <div 
                    {...provided.droppableProps} ref={provided.innerRef} style={styles.container}>
                    <h4>{title}</h4>
                    {cards.map((card, index) => (
                        <Trellocard 
                            key={card.id} 
                            index={index} 
                            text={card.text} 
                            id={card.id} 
                        /> 
                    ))}
                    <TrelloActionButton listID={listID} />
                    {provided.placeholder}
                </div>
            )}   
        </Droppable>
    );
};

const styles = {
    container: {
        backgroundColor: "#dfe3e6",
        borderRadius: 3,
        width: 300,
        padding: 8,
        height: '100%',
        marginRight: 8
    }
};

export default TrelloList;