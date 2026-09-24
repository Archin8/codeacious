import React, { useState } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import StopIcon from '@mui/icons-material/Stop';

const MAX_QUESTION_CHARS = 1000;

export default function ChatInput({ onSend, onStop, sending }) {
  const [input, setInput] = useState('');

  const isInputInvalid = !input.trim() || input.length > MAX_QUESTION_CHARS;

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (sending) {
      onStop && onStop();
      return;
    }
    if (isInputInvalid) return;

    onSend(input.trim());
    setInput('');
  };

  const handleKeyDown = (e) => {
    // Enter sends message, Shift+Enter creates a new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sending && !isInputInvalid) {
        handleSubmit();
      }
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 'auto', pt: 2 }}>
      <TextField
        multiline
        maxRows={5}
        placeholder="Ask about your entries…"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        fullWidth
        size="medium"
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              {sending ? (
                <Tooltip title="Stop generation">
                  <IconButton
                    type="button"
                    onClick={onStop}
                    aria-label="Stop generation"
                    sx={{
                      bgcolor: 'error.main',
                      color: '#ffffff',
                      '&:hover': { bgcolor: 'error.dark' },
                    }}
                  >
                    <StopIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              ) : (
                <IconButton
                  type="submit"
                  color="primary"
                  disabled={isInputInvalid}
                  aria-label="Send question"
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'text.primary',
                    '&:hover': { bgcolor: 'primary.dark' },
                    '&.Mui-disabled': { bgcolor: 'rgba(23,26,38,0.12)', color: 'rgba(23,26,38,0.38)' },
                  }}
                >
                  <SendIcon fontSize="small" />
                </IconButton>
              )}
            </InputAdornment>
          ),
        }}
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.8, px: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          Answers come only from your own entries.
        </Typography>
        <Typography
          variant="caption"
          color={input.length > MAX_QUESTION_CHARS ? 'error.main' : 'text.secondary'}
        >
          {input.length} / {MAX_QUESTION_CHARS}
        </Typography>
      </Box>
    </Box>
  );
}
