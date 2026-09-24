import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Chip,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { api } from '../../lib/api';
import { formatEntryDate } from '../../lib/date';

export default function NoteViewDialog({ open, noteId, onClose }) {
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && noteId) {
      setLoading(true);
      setError('');
      setNote(null);

      api(`/api/notes/${noteId}`)
        .then((data) => {
          setNote(data);
        })
        .catch((err) => {
          if (err?.status === 404) {
            setError('This entry is no longer available.');
          } else {
            setError(err?.message || 'Failed to fetch note.');
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, noteId]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Journal Entry</span>
        {note?.entry_date && (
          <Chip
            icon={<CalendarTodayIcon sx={{ fontSize: '0.9rem !important' }} />}
            label={formatEntryDate(note.entry_date)}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
        )}
      </DialogTitle>
      <DialogContent dividers>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress size={32} />
          </Box>
        )}

        {error && <Alert severity="error">{error}</Alert>}

        {note && !loading && (
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
            {note.content}
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
