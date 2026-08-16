import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import TextField from '@mui/material/TextField';
import AddIcon from '@mui/icons-material/Add';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CheckIcon from '@mui/icons-material/Check';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import { MAX_BOARD_NAME_LENGTH } from '../constants/board';
import { activeBoard } from '../store/boardsSlice';
import {
  createBoard,
  openBoard,
  removeBoard,
  renameBoard
} from '../store/boardThunks';

const BoardSwitcher = () => {
  const dispatch = useDispatch();
  const status = useSelector(state => state.auth.status);
  const { items, activeId, busy } = useSelector(state => state.boards);
  const active = useSelector(activeBoard);

  const [anchorEl, setAnchorEl] = useState(null);
  // 'create' | 'rename' | 'delete' | null. One piece of state rather than three
  // booleans: the three dialogs are alternatives, and two of them open at once
  // is not a state worth being able to represent.
  const [dialog, setDialog] = useState(null);
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [working, setWorking] = useState(false);

  const closeMenu = () => setAnchorEl(null);

  const openDialog = kind => {
    closeMenu();
    setError(null);
    setName(kind === 'rename' ? (active?.name ?? '') : '');
    setDialog(kind);
  };

  const closeDialog = () => {
    setDialog(null);
    setError(null);
  };

  // Failures are reported where the person is looking: in the dialog while one
  // is open, and in a snackbar for a plain switch, which has no dialog to speak
  // through and leaves the previous board on screen when it fails.
  const choose = async id => {
    closeMenu();

    const result = await dispatch(openBoard(id));

    if (!result.ok) {
      setNotice(result.error);
    }
  };

  const submit = async event => {
    event.preventDefault();

    const trimmed = name.trim();

    if (!trimmed) {
      return;
    }

    setWorking(true);

    const result = await dispatch(
      dialog === 'create' ? createBoard(trimmed) : renameBoard(activeId, trimmed)
    );

    setWorking(false);

    if (result.ok) {
      closeDialog();
    } else {
      setError(result.error);
    }
  };

  const confirmDelete = async () => {
    setWorking(true);

    const result = await dispatch(removeBoard(activeId));

    setWorking(false);

    if (result.ok) {
      closeDialog();
    } else {
      setError(result.error);
    }
  };

  // There is nothing to switch between until the session has been answered for:
  // an anonymous visitor has the one board this browser holds, and showing a
  // switcher over it would offer them boards they cannot have.
  if (status !== 'authenticated' || items.length === 0) {
    return null;
  }

  return (
    <>
      <Button
        color="inherit"
        onClick={event => setAnchorEl(event.currentTarget)}
        disabled={busy}
        startIcon={<ViewKanbanIcon />}
        endIcon={<ArrowDropDownIcon />}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchorEl)}
        sx={{ mr: 2, maxWidth: 240 }}
      >
        <Box
          component="span"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {active?.name ?? 'Boards'}
        </Box>
      </Button>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
        {items.map(item => (
          <MenuItem
            key={item.id}
            selected={item.id === activeId}
            // The tick is the visual answer to "which one am I on"; this is the
            // same answer for a screen reader, which is not shown the icon.
            aria-current={item.id === activeId ? 'true' : undefined}
            onClick={() => choose(item.id)}
          >
            <ListItemIcon>
              {item.id === activeId && <CheckIcon fontSize="small" />}
            </ListItemIcon>
            <ListItemText>{item.name}</ListItemText>
          </MenuItem>
        ))}

        <Divider />

        <MenuItem onClick={() => openDialog('create')}>
          <ListItemIcon>
            <AddIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>New board</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => openDialog('rename')} disabled={!active}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Rename board</ListItemText>
        </MenuItem>

        {/* Disabled on the last board rather than hidden: the account always has
            somewhere to put its tickets, and a missing item reads as a bug where
            a greyed one reads as a rule. */}
        <MenuItem
          onClick={() => openDialog('delete')}
          disabled={!active || items.length === 1}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete board</ListItemText>
        </MenuItem>
      </Menu>

      <Dialog
        open={dialog === 'create' || dialog === 'rename'}
        onClose={closeDialog}
        component="form"
        onSubmit={submit}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          {dialog === 'rename' ? 'Rename board' : 'New board'}
        </DialogTitle>

        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label="Board name"
            value={name}
            onChange={event => setName(event.target.value)}
            error={Boolean(error)}
            helperText={error ?? ' '}
            slotProps={{
              htmlInput: { maxLength: MAX_BOARD_NAME_LENGTH }
            }}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={closeDialog} color="inherit">
            Cancel
          </Button>
          {/* A name that is only spaces is refused by the API, so it is refused
              here too rather than sent to find out. */}
          <Button type="submit" disabled={working || !name.trim()}>
            {dialog === 'rename' ? 'Rename' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialog === 'delete'} onClose={closeDialog} maxWidth="xs">
        <DialogTitle>Delete board</DialogTitle>

        <DialogContent>
          <DialogContentText>
            {`“${active?.name}” and every list and card on it will be deleted. This cannot be undone.`}
          </DialogContentText>
          {error && (
            <DialogContentText color="error" sx={{ mt: 2 }}>
              {error}
            </DialogContentText>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={closeDialog} color="inherit">
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="error" disabled={working}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={6000}
        onClose={() => setNotice(null)}
        message={notice}
      />
    </>
  );
};

export default BoardSwitcher;
