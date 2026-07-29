import { useDispatch } from 'react-redux';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { Draggable } from '@hello-pangea/dnd';
import { styled } from '@mui/material/styles';
import { getPriority, getType } from '../constants/ticketIcons';
import { deleteCard } from '../store/listsSlice';

const CardContainer = styled('div')({
    marginBottom: 8,
    // the delete button stays hidden until the card is hovered or the button
    // itself is focused, so keyboard users can still reach it
    '&:hover .card-delete': { opacity: 1 }
});

const TrelloCard = ({ text, id, index, type, priority, listID }) => {
    const dispatch = useDispatch();

    const { Icon: TypeIcon, label: typeLabel, color: typeColor } = getType(type);
    const {
        Icon: PriorityIcon,
        label: priorityLabel,
        color: priorityColor
    } = getPriority(priority);

    const handleDelete = event => {
        // keep the click from reaching the drag handle wrapping the card
        event.stopPropagation();
        dispatch(deleteCard(listID, id));
    };

    return (
        <Draggable draggableId={String(id)} index={index}>
            {provided => (
                <CardContainer
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                >
                    <Card>
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Typography sx={{ mb: 1 }}>{text}</Typography>

                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                    <Tooltip title={typeLabel}>
                                        <TypeIcon
                                            aria-label={`Type: ${typeLabel}`}
                                            sx={{ color: typeColor, fontSize: 18 }}
                                        />
                                    </Tooltip>
                                    <Tooltip title={`Priority: ${priorityLabel}`}>
                                        <PriorityIcon
                                            aria-label={`Priority: ${priorityLabel}`}
                                            sx={{ color: priorityColor, fontSize: 18 }}
                                        />
                                    </Tooltip>
                                </Box>

                                <Tooltip title="Delete card">
                                    <IconButton
                                        className="card-delete"
                                        size="small"
                                        aria-label={`Delete card: ${text}`}
                                        onClick={handleDelete}
                                        sx={{
                                            opacity: 0,
                                            transition: 'opacity 150ms',
                                            '&:focus-visible': { opacity: 1 },
                                            '&:hover': { color: 'error.main' }
                                        }}
                                    >
                                        <DeleteOutlinedIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </CardContent>
                    </Card>
                </CardContainer>
            )}
        </Draggable>
    );
};

export default TrelloCard;