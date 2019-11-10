import React from 'react';
import Trellocard from './TrelloCard';
import TrelloActionButton from './TrelloActionButton';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import styled from 'styled-components';
//import { string } from 'prop-types';

const ListsContainer = styled.div`
    background-color: #dfe3e6;
    border-radius: 3px;
    width: 300px;
    padding: 8px;
    height: 100%;
    margin-right: 8px;
`;

const TrelloList = ({ title, cards, listID, index }) => {
    return(
        <Draggable draggableId={String(listID)} index={index}>
            {provided => (
                <ListsContainer 
                {...provided.draggableProps} 
                ref={provided.innerRef}
                {...provided.dragHandleProps}
                >
                <Droppable droppableId={String(listID)} type='card'>
                { provided => (
                    <div {...provided.droppableProps} ref={provided.innerRef}>
                        <h4>{title}</h4>
                        {cards.map((card, index) => (
                            <Trellocard 
                                key={card.id} 
                                index={index} 
                                text={card.text} 
                                id={card.id} 
                            /> 
                        ))}
                        {provided.placeholder}
                        <TrelloActionButton listID={listID} />
                    </div>
                )}   
                </Droppable>    
            </ListsContainer>    
            )}
        </Draggable>
    );
};

export default TrelloList;