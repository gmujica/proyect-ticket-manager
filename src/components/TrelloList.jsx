import { useSelector } from 'react-redux';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import TrelloCard from './TrelloCard';
import TrelloActionButton from './TrelloActionButton';
import { visibleCards } from '../store/filtersSlice';

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
    const filters = useSelector(state => state.filters);
    // Filtering happens here rather than in the reducer so the hidden cards stay
    // in the board: clearing the filter brings them back untouched. App maps the
    // indexes below back to store indexes before dispatching a drop.
    const visible = visibleCards(cards, filters);

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
                                {visible.map((card, index) => (
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
                                {/* an all-hidden list would otherwise look empty
                                    rather than filtered */}
                                {visible.length === 0 && cards.length > 0 && (
                                    <Typography
                                        variant="body2"
                                        sx={{ color: 'text.secondary', px: 0.5, pb: 1 }}
                                    >
                                        No cards match the filter
                                    </Typography>
                                )}
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