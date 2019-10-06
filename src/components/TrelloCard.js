import React from 'react';
import Card from '@material-ui/core/Card';
import Typography from '@material-ui/core/Typography';
import CardContent from '@material-ui/core/CardContent';
import {Draggable} from 'react-beautiful-dnd';

const TrelloCard = ({ text, id, index }) => {
    return(
        <Draggable draggableId={String(id)} index={index}>
            {provided => ( 
                <div 
                    ref={provided.innerRef} 
                    {...provided.draggableProps} 
                    {...provided.dragHandleProps}
                >
                    <Card style={styles.CardContainer}>
                        <CardContent>
                            <Typography gutterBottom>{text}</Typography>
                        </CardContent>
                    </Card>
                </div>
            )}
        </Draggable>
    );
};

const styles = {
    CardContainer: {
        marginBottom: 8
    }
}

export default TrelloCard;