import React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import CodeIcon from '@mui/icons-material/Code';
import StyleIcon from '@mui/icons-material/Style';
import StorageIcon from '@mui/icons-material/Storage';

const technologies = [
  { label: 'ReactJS', Icon: CodeIcon },
  { label: 'Redux Toolkit', Icon: CodeIcon },
  { label: 'MUI', Icon: StyleIcon },
  { label: 'Emotion (MUI styled)', Icon: StyleIcon },
  { label: 'Vite', Icon: StorageIcon },
  { label: '@hello-pangea/dnd', Icon: StyleIcon },
  { label: 'Local Storage', Icon: StorageIcon }
];

const SimpleList = () => {
  return (
    <List
      component="nav"
      aria-label="development technologies"
      sx={{ width: '100%', backgroundColor: 'background.paper' }}
    >
      {technologies.map(({ label, Icon }, index) => (
        <React.Fragment key={label}>
          <ListItem disablePadding>
            <ListItemButton>
              <ListItemIcon>
                <Icon />
              </ListItemIcon>
              <ListItemText primary={label} />
            </ListItemButton>
          </ListItem>
          {index < technologies.length - 1 && <Divider />}
        </React.Fragment>
      ))}
    </List>
  );
};

export default SimpleList;
