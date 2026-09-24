import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';

export default function ConfirmDialog({
  open,
  title = 'Delete this entry?',
  message = "Delete this entry? This also removes it from what the AI can search. This can't be undone.",
  confirmText = 'Delete',
  cancelText = 'Cancel',
  loading = false,
  onConfirm,
  onClose,
}) {
  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          disabled={loading}
        >
          {loading ? 'Deleting…' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
