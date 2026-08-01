import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';

import AuthButton from './AuthButton';
import FilterBar from './FilterBar';
import InfoModal from './InfoModal';

const Header = () => {
  return (
    <Box sx={{ flexGrow: 1, mb: 6 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Proyect Ticket Manager
          </Typography>
          <AuthButton />
          <InfoModal />
          <IconButton
            href="https://github.com/gmujica/proyect-ticket-manager"
            target="_blank"
            rel="noopener noreferrer"
            color="inherit"
            aria-label="GitHub repository"
            sx={{ mr: 2 }}
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
        </Toolbar>
        <FilterBar />
      </AppBar>
    </Box>
  );
};

export default Header;
