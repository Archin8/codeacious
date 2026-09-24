import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../../context/AuthContext';

export default function TopBar() {
  const { user, signOut } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = () => {
    handleMenuClose();
    signOut();
  };

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'U';

  return (
    <AppBar position="static">
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <MenuBookIcon sx={{ color: 'primary.main', fontSize: 28 }} />
          <Typography variant="h2" component="h1" sx={{ fontSize: '1.25rem' }}>
            AI Journal
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ display: { xs: 'none', sm: 'block' } }}
          >
            {user?.email}
          </Typography>

          <IconButton
            onClick={handleMenuOpen}
            size="small"
            aria-label="User account menu"
            aria-controls={open ? 'account-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
          >
            <Avatar
              sx={{
                width: 34,
                height: 34,
                bgcolor: 'primary.light',
                color: 'primary.contrastText',
                fontSize: '0.9rem',
                fontWeight: 600,
              }}
            >
              {userInitial}
            </Avatar>
          </IconButton>

          <Menu
            id="account-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            slotProps={{ paper: { sx: { minWidth: 180, mt: 1 } } }}
          >
            <MenuItem disabled sx={{ opacity: '1 !important', borderBottom: '1px solid rgba(23,26,38,0.08)', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary" noWrap>
                Signed in as<br />
                <strong>{user?.email}</strong>
              </Typography>
            </MenuItem>
            <MenuItem onClick={handleSignOut}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Sign out</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
