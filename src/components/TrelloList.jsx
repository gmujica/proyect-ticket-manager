import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { styled } from '@mui/material/styles';
import TrelloCard from './TrelloCard';
import TrelloActionButton from './TrelloActionButton';
import { visibleCards } from '../store/filtersSlice';
import { deleteList, renameList } from '../store/listsSlice';

const ListContainer = styled('div')({
    backgroundColor: '#dfe3e6',
    borderRadius: 3,
    width: 300,
    padding: 8,
    height: '100%',
    marginRight: 8,
    flexShrink: 0,
    '&:hover .list-action': { opacity: 1 }
});

const actionSx = {
    opacity: 0,
    transition: 'opacity 150ms',
    '&:focus-visible': { opacity: 1 }
};

const TrelloList = ({ title, cards, listID, index }) => {
    const dispatch = useDispatch();
    const filters = useSelector(state => state.filters);
    const [editingTitle, setEditingTitle] = useState(false);
    const [draftTitle, setDraftTitle] = useState(title);
    const [confirmingDelete, setConfirmingDelete] = useState(false);

    // Filtering happens here rather than in the reducer so the hidden cards stay
    // in the board: clearing the filter brings them back untouched. App maps the
    // indexes below back to store indexes before dispatching a drop.
    const visible = visibleCards(cards, filters);

    const openTitleEditor = () => {
        setDraftTitle(title);
        setEditingTitle(true);
    };

    const saveTitle = () => {
        if (draftTitle.trim()) {
            dispatch(renameList(listID, draftTitle));
        }

        setEditingTitle(false);
    };

    const handleTitleKeyDown = event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            saveTitle();
        }

        if (event.key === 'Escape') {
            setEditingTitle(false);
        }
    };

    // Deleting a list takes its cards with it, so an accidental click on a list
    // that holds work is worth one question. An empty list has nothing to lose.
    const handleDeleteClick = () => {
        if (cards.length === 0) {
            dispatch(deleteList(listID));
            return;
        }

        setConfirmingDelete(true);
    };

    const confirmDelete = () => {
        setConfirmingDelete(false);
        dispatch(deleteList(listID));
    };

    const renderHeader = () =>
        editingTitle ? (
            <TextField
                autoFocus
                fullWidth
                size="small"
                variant="standard"
                inputProps={{ 'aria-label': 'List title' }}
                value={draftTitle}
                onChange={event => setDraftTitle(event.target.value)}
                onKeyDown={handleTitleKeyDown}
                onBlur={saveTitle}
                sx={{ mb: 1 }}
            />
        ) : (
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 1
                }}
            >
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {title}
                </Typography>

                <Box sx={{ flexShrink: 0 }}>
                    <Tooltip title="Rename list">
                        <IconButton
                            className="list-action"
                            size="small"
                            aria-label={`Rename list: ${title}`}
                            onClick={openTitleEditor}
                            sx={{ ...actionSx, '&:hover': { color: 'primary.main' } }}
                        >
                            <EditOutlinedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete list">
                        <IconButton
                            className="list-action"
                            size="small"
                            aria-label={`Delete list: ${title}`}
                            onClick={handleDeleteClick}
                            sx={{ ...actionSx, '&:hover': { color: 'error.main' } }}
                        >
                            <DeleteOutlinedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>
        );

    return (
        // As with a card, the container doubles as the drag handle, so dragging
        // is switched off while the title is being typed into.
        <Draggable
            draggableId={String(listID)}
            index={index}
            isDragDisabled={editingTitle}
        >
            {provided => (
                <ListContainer
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    ref={provided.innerRef}
                >
                    <Droppable droppableId={String(listID)} type='card'>
                        {provided => (
                            <div {...provided.droppableProps} ref={provided.innerRef}>
                                {renderHeader()}
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

                    <Dialog
                        open={confirmingDelete}
                        onClose={() => setConfirmingDelete(false)}
                    >
                        <DialogTitle>Delete this list?</DialogTitle>
                        <DialogContent>
                            <DialogContentText>
                                &quot;{title}&quot; still holds {cards.length}{' '}
                                {cards.length === 1 ? 'card' : 'cards'}. Deleting
                                the list deletes them too, and this cannot be
                                undone.
                            </DialogContentText>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setConfirmingDelete(false)}>
                                Cancel
                            </Button>
                            <Button color="error" onClick={confirmDelete}>
                                Delete list
                            </Button>
                        </DialogActions>
                    </Dialog>
                </ListContainer>
            )}
        </Draggable>
    );
};

export default TrelloList;
