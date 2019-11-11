import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import MuiDialogContent from '@material-ui/core/DialogContent';
import MuiDialogActions from '@material-ui/core/DialogActions';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Typography from '@material-ui/core/Typography';
import InfoIcon from '@material-ui/icons/Info';
import GitHubIcon from '@material-ui/icons/GitHub';
import LinkedInIcon from '@material-ui/icons/LinkedIn';

import SimpleList from './SimpleList';


const styles = theme => ({
  root: {
    margin: 0,
  },
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.grey[500],
  },
  icon: {
    marginRight: theme.spacing(2),
  }
});

const DialogTitle = withStyles(styles)(props => {
  const { children, classes, onClose, ...other } = props;
  return (
    <MuiDialogTitle disableTypography className={classes.root} {...other}>
      <Typography variant="h6">{children}</Typography>
      {onClose ? (
        <IconButton aria-label="close" className={classes.closeButton} onClick={onClose}>
          <CloseIcon />
        </IconButton>
      ) : null}
    </MuiDialogTitle>
  );
});

const DialogContent = withStyles(theme => ({
  root: {
    padding: theme.spacing(2),
  },
}))(MuiDialogContent);

const DialogActions = withStyles(theme => ({
  root: {
    margin: 0,
    padding: theme.spacing(1),
  },
}))(MuiDialogActions);

const InfoModal = () => {

  const [open, setOpen] = React.useState(true);

  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div>
         <IconButton onClick={handleClickOpen} color="inherit" aria-label="menu">
            <InfoIcon />
        </IconButton>
      <Dialog onClose={handleClose} aria-labelledby="customized-dialog-title" open={open}>
        <DialogTitle id="customized-dialog-title" onClose={handleClose}>
            Development technologies
        </DialogTitle>
        <DialogContent dividers>
          <Typography gutterBottom>
          This is a task ticket management tool developed to support the management of a project using agile methodologies such as Scrum.
          </Typography>
            <SimpleList />
          <Typography gutterBottom>
            You can also view other projects like this in my GitHub repository or you can see my linkedin profile for more information.
          </Typography>
          <DialogActions style={{marginRight: "40%"}}>
            <IconButton edge="start" href="https://github.com/gmujica/proyect-ticket-manager" target="_blank"  color="inherit" aria-label="menu">
              <GitHubIcon />
            </IconButton>
            <IconButton edge="start" href="https://www.linkedin.com/in/gregory-mujica-2a0400b6/" target="_blank" color="inherit" aria-label="menu">
              <LinkedInIcon />
            </IconButton>
          </DialogActions>
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={handleClose} color="primary">
            Agree
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default InfoModal;