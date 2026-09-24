import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Box,
  Alert,
  useMediaQuery,
  useTheme,
} from '@mui/material';

const MAX_CHARS = 10000;

export default function NoteEditDialog({
  open,
  note,
  onClose,
  onSave,
  onNotFound,
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [content, setContent] = useState('');
  const [entryDate, setEntryDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (note) {
      setContent(note.content || '');
      setEntryDate(note.entry_date || '');
      setError('');
    }
  }, [note]);

  const charCount = content.length;
  const isOverLimit = charCount > MAX_CHARS;
  const isNearLimit = charCount > MAX_CHARS * 0.9;
  const isDisabled = saving || !content.trim() || isOverLimit;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isDisabled || !note) return;

    setSaving(true);
    setError('');

    try {
      // Only send changed fields to backend
      const patch = {};
      if (content.trim() !== note.content) patch.content = content.trim();
      if (entryDate !== note.entry_date) patch.entry_date = entryDate;

      // If nothing changed, just close
      if (Object.keys(patch).length === 0) {
        onClose();
        return;
      }

      await onSave(note.id, patch);
      onClose();
    } catch (err) {
      if (err?.status === 404) {
        onClose();
        if (onNotFound) onNotFound();
      } else {
        setError(err?.message || 'Failed to update entry.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      fullScreen={fullScreen}
    >
      <DialogTitle sx={{ fontWeight: 600 }}>Edit entry</DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} id="edit-note-form" noValidate sx={{ pt: 1 }}>
          <Stack spacing={2.5}>
            <TextField
              multiline
              minRows={5}
              maxRows={12}
              label="Journal Content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              fullWidth
              disabled={saving}
              error={isOverLimit}
              helperText={
                <Box
                  component="span"
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    width: '100%',
                    color: isOverLimit
                      ? 'error.main'
                      : isNearLimit
                      ? 'warning.main'
                      : 'text.secondary',
                  }}
                >
                  {charCount} / {MAX_CHARS}
                </Box>
              }
            />

            <TextField
              type="date"
              label="Date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{ width: 180 }}
              disabled={saving}
            />
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          type="submit"
          form="edit-note-form"
          variant="contained"
          disabled={isDisabled}
        >
          {saving ? 'Updating…' : 'Save changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
