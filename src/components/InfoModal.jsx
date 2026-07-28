import React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';

import SimpleList from './SimpleList';

const InfoModal = () => {
  const [open, setOpen] = React.useState(true);

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <>
      <IconButton
        onClick={handleClickOpen}
        color="inherit"
        aria-label="about this project"
        sx={{ mr: 2 }}
      >
        <InfoIcon />
      </IconButton>

      <Dialog onClose={handleClose} aria-labelledby="info-dialog-title" open={open}>
        <DialogTitle id="info-dialog-title" sx={{ m: 0, pr: 6 }}>
          Development technologies
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: theme => theme.palette.grey[500]
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Typography gutterBottom>
            This is a task ticket management tool developed to support the management of a
            project using agile methodologies such as Scrum.
          </Typography>

          <SimpleList />

          <Typography gutterBottom>
            You can also view other projects like this in my GitHub repository or you can
            see my linkedin profile for more information.
          </Typography>

          <Stack direction="row" spacing={1} sx={{ justifyContent: 'center' }}>
            <IconButton
              href="https://github.com/gmujica/proyect-ticket-manager"
              target="_blank"
              rel="noopener noreferrer"
              color="inherit"
              aria-label="GitHub repository"
            >
              <GitHubIcon />
            </IconButton>
            <IconButton
              href="https://www.linkedin.com/in/gregory-mujica-2a0400b6/"
              target="_blank"
              rel="noopener noreferrer"
              color="inherit"
              aria-label="LinkedIn profile"
            >
              <LinkedInIcon />
            </IconButton>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button autoFocus onClick={handleClose} color="primary">
            Agree
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default InfoModal;