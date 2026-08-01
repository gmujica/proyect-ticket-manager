import { useState } from 'react';
import { useDispatch } from 'react-redux';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextareaAutosize from '@mui/material/TextareaAutosize';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { Draggable } from '@hello-pangea/dnd';
import { styled } from '@mui/material/styles';
import {
    getPriority,
    getType,
    priorityOptions,
    typeOptions
} from '../constants/ticketIcons';
import { deleteCard, editCard } from '../store/listsSlice';

const CardContainer = styled('div')({
    marginBottom: 8,
    // the action buttons stay hidden until the card is hovered or a button
    // itself is focused, so keyboard users can still reach them
    '&:hover .card-action': { opacity: 1 }
});

const actionSx = {
    opacity: 0,
    transition: 'opacity 150ms',
    '&:focus-visible': { opacity: 1 }
};

const renderOption = ({ key, label, Icon, color }) => (
    <MenuItem key={key} value={key}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Icon sx={{ color, fontSize: 18 }} />
            {label}
        </Box>
    </MenuItem>
);

const TrelloCard = ({ text, id, index, type, priority, listID }) => {
    const dispatch = useDispatch();
    const [editing, setEditing] = useState(false);
    // The draft lives here rather than in the store so abandoning an edit costs
    // nothing: the card in the board is only touched on save.
    const [draft, setDraft] = useState({ text, type, priority });

    const { Icon: TypeIcon, label: typeLabel, color: typeColor } = getType(type);
    const {
        Icon: PriorityIcon,
        label: priorityLabel,
        color: priorityColor
    } = getPriority(priority);

    const openEditor = () => {
        // reseed from props: the card may have changed since the last cancel
        setDraft({ text, type, priority });
        setEditing(true);
    };

    const closeEditor = () => {
        setEditing(false);
    };

    const handleSave = () => {
        if (!draft.text.trim()) {
            return;
        }

        dispatch(editCard(listID, id, draft.text, draft.type, draft.priority));
        setEditing(false);
    };

    const handleKeyDown = event => {
        if (event.key === 'Escape') {
            closeEditor();
        }

        // Enter saves; Shift+Enter is left alone so a card can still hold more
        // than one line.
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSave();
        }
    };

    const handleDelete = event => {
        // keep the click from reaching the drag handle wrapping the card
        event.stopPropagation();
        dispatch(deleteCard(listID, id));
    };

    const renderEditor = () => (
        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <TextareaAutosize
                autoFocus
                aria-label="Card text"
                value={draft.text}
                onChange={event =>
                    setDraft({ ...draft, text: event.target.value })
                }
                onKeyDown={handleKeyDown}
                style={{
                    resize: 'none',
                    width: '100%',
                    overflow: 'hidden',
                    outline: 'none',
                    border: 'none',
                    fontFamily: 'inherit',
                    fontSize: 'inherit'
                }}
            />

            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Select
                    size="small"
                    value={draft.type}
                    onChange={event =>
                        setDraft({ ...draft, type: event.target.value })
                    }
                    aria-label="Ticket type"
                    sx={{ flex: 1 }}
                >
                    {typeOptions().map(renderOption)}
                </Select>
                <Select
                    size="small"
                    value={draft.priority}
                    onChange={event =>
                        setDraft({ ...draft, priority: event.target.value })
                    }
                    aria-label="Ticket priority"
                    sx={{ flex: 1 }}
                >
                    {priorityOptions().map(renderOption)}
                </Select>
            </Stack>

            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Button
                    size="small"
                    variant="contained"
                    onClick={handleSave}
                    disabled={!draft.text.trim()}
                    style={{ color: 'white', backgroundColor: '#5aac44' }}
                >
                    Save
                </Button>
                <Button size="small" color="inherit" onClick={closeEditor}>
                    Cancel
                </Button>
            </Stack>
        </CardContent>
    );

    const renderCard = () => (
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

                <Box>
                    <Tooltip title="Edit card">
                        <IconButton
                            className="card-action"
                            size="small"
                            aria-label={`Edit card: ${text}`}
                            onClick={openEditor}
                            sx={{
                                ...actionSx,
                                '&:hover': { color: 'primary.main' }
                            }}
                        >
                            <EditOutlinedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete card">
                        <IconButton
                            className="card-action"
                            size="small"
                            aria-label={`Delete card: ${text}`}
                            onClick={handleDelete}
                            sx={{
                                ...actionSx,
                                '&:hover': { color: 'error.main' }
                            }}
                        >
                            <DeleteOutlinedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>
        </CardContent>
    );

    return (
        // Dragging is switched off while editing: the whole card is the drag
        // handle, so without this a click meant to place the cursor in the text
        // would start a drag instead.
        <Draggable draggableId={String(id)} index={index} isDragDisabled={editing}>
            {provided => (
                <CardContainer
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                >
                    <Card>{editing ? renderEditor() : renderCard()}</Card>
                </CardContainer>
            )}
        </Draggable>
    );
};

export default TrelloCard;
