import { Droppable, Draggable } from '@hello-pangea/dnd';
import { styled } from '@mui/material/styles';
import TrelloCard from './TrelloCard';
import TrelloActionButton from './TrelloActionButton';

const ListContainer = styled('div')({
    backgroundColor: '#dfe3e6',
    borderRadius: 3,
    width: 300,
    padding: 8,
    height: '100%',
    marginRight: 8,
    flexShrink: 0
});

const TrelloList = ({ title, cards, listID, index }) => {
    return (
        <Draggable draggableId={String(listID)} index={index}>
            {provided => (
                <ListContainer
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    ref={provided.innerRef}
                >
                    <Droppable droppableId={String(listID)} type='card'>
                        {provided => (
                            <div {...provided.droppableProps} ref={provided.innerRef}>
                                <h4>{title}</h4>
                                {cards.map((card, index) => (
                                    <TrelloCard
                                        key={card.id}
                                        index={index}
                                        text={card.text}
                                        id={card.id}
                                        type={card.type}
                                        priority={card.priority}
                                        listID={listID}
                                    />
                                ))}
                                {provided.placeholder}
                                <TrelloActionButton listID={listID} />
                            </div>
                        )}
                    </Droppable>
                </ListContainer>
            )}
        </Draggable>
    );
};

export default TrelloList;