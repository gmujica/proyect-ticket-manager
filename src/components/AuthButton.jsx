import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import GitHubIcon from '@mui/icons-material/GitHub';
import LogoutIcon from '@mui/icons-material/Logout';
import { LOGIN_URL, logout } from '../api/client';
import { signedOut } from '../store/authSlice';

const AuthButton = () => {
  const dispatch = useDispatch();
  const { user, status, syncing } = useSelector(state => state.auth);
  const [signingOut, setSigningOut] = useState(false);

  const handleLogout = async () => {
    setSigningOut(true);

    try {
      await logout();
    } finally {
      // Signed out locally either way: if the request failed the cookie may
      // still be live, but leaving the UI claiming a session that may be gone
      // is worse than an extra sign-in.
      setSigningOut(false);
      dispatch(signedOut());
    }
  };

  // Nothing is rendered until /api/me has answered. Showing "Sign in" for a
  // moment to someone who is already signed in reads as a bug, and the gap is
  // one request long.
  if (status === 'checking') {
    return null;
  }

  if (status !== 'authenticated') {
    return (
      <Button
        href={LOGIN_URL}
        color="inherit"
        startIcon={<GitHubIcon />}
        sx={{ mr: 2 }}
      >
        Sign in
      </Button>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
      <Tooltip title={syncing ? 'Saving…' : 'Saved'}>
        <Box sx={{ display: 'flex', width: 16 }}>
          {syncing && <CircularProgress size={14} color="inherit" />}
        </Box>
      </Tooltip>

      <Avatar
        src={user.avatarUrl ?? undefined}
        alt={user.login}
        sx={{ width: 28, height: 28 }}
      >
        {user.login?.[0]?.toUpperCase()}
      </Avatar>

      <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
        {user.login}
      </Typography>

      <Button
        color="inherit"
        size="small"
        startIcon={<LogoutIcon />}
        onClick={handleLogout}
        disabled={signingOut}
      >
        Sign out
      </Button>
    </Box>
  );
};

export default AuthButton;
