import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  Box,
  Alert,
  Snackbar,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { todayLocal } from '../../lib/date';

const MAX_CHARS = 10000;

export default function NoteComposer({ onSaveNote }) {
  const [content, setContent] = useState('');
  const [entryDate, setEntryDate] = useState(todayLocal());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const charCount = content.length;
  const isOverLimit = charCount > MAX_CHARS;
  const isNearLimit = charCount > MAX_CHARS * 0.9;
  const isDisabled = saving || !content.trim() || isOverLimit;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isDisabled) return;

    setSaving(true);
    setError('');

    try {
      await onSaveNote({ content: content.trim(), entry_date: entryDate });
      setContent('');
      setSnackbarOpen(true);
    } catch (err) {
      setError(err?.message || 'Failed to save note. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    // Save on Cmd+Enter or Ctrl+Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h2" gutterBottom>
          New entry
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={2}>
            <TextField
              multiline
              minRows={4}
              maxRows={12}
              label="What happened today?"
              placeholder="Write your journal entry here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              fullWidth
              disabled={saving}
              error={isOverLimit}
              helperText={
                <Box
                  component="span"
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    width: '100%',
                    color: isOverLimit
                      ? 'error.main'
                      : isNearLimit
                      ? 'warning.main'
                      : 'text.secondary',
                  }}
                >
                  <span>Press Ctrl+Enter to save</span>
                  <span>
                    {charCount} / {MAX_CHARS}
                  </span>
                </Box>
              }
            />

            <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
              <TextField
                type="date"
                label="Date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
                sx={{ width: 170 }}
                disabled={saving}
              />

              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={isDisabled}
              >
                {saving ? 'Saving…' : 'Save entry'}
              </Button>
            </Stack>
          </Stack>
        </Box>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={4000}
          onClose={() => setSnackbarOpen(false)}
          message="Entry saved"
        />
      </CardContent>
    </Card>
  );
}
