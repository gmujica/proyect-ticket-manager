import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Divider from '@material-ui/core/Divider';
import CodeIcon from '@material-ui/icons/Code';
import StyleIcon from '@material-ui/icons/Style';
import StorageIcon from '@material-ui/icons/Storage';

const useStyles = makeStyles(theme => ({
  root: {
    width: '100%',
    backgroundColor: theme.palette.background.paper,
  },
}));

const SimpleList = () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <List component="nav" aria-label="main mailbox folders">
        <ListItem button>
          <ListItemIcon>
            <CodeIcon />
          </ListItemIcon>
          <ListItemText primary="ReactJS" />
        </ListItem>
        <Divider />
        <ListItem button>
          <ListItemIcon>
            <CodeIcon />
          </ListItemIcon>
          <ListItemText primary="Redux" />
        </ListItem>
        <Divider />
        <ListItem button>
          <ListItemIcon>
            <StyleIcon />
          </ListItemIcon>
          <ListItemText primary="Material-UI" />
        </ListItem>
        <Divider />
        <ListItem button>
          <ListItemIcon>
            <StyleIcon />
          </ListItemIcon>
          <ListItemText primary="Styled Components" />
        </ListItem>
        <Divider />
        <ListItem button>
          <ListItemIcon>
            <StorageIcon />
          </ListItemIcon>
          <ListItemText primary="Local Storage" />
        </ListItem>
        <Divider />
        <ListItem button>
          <ListItemIcon>
            <StyleIcon />
          </ListItemIcon>
          <ListItemText primary="React beautiful dnd" />
        </ListItem>
      </List>
    </div>
  );
};

export default SimpleList;