import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Stack,
  Button,
  CircularProgress,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import RefreshIcon from '@mui/icons-material/Refresh';
import ReactMarkdown from 'react-markdown';
import SourceChips from './SourceChips';

export default function MessageBubble({ message, onRetry, onOpenNote }) {
  const isUser = message.role === 'user';
  const isError = message.status === 'error';
  const isStreaming = message.status === 'streaming';
  const isLoading = isStreaming && !message.content;

  if (isUser) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            maxWidth: '82%',
            bgcolor: 'rgba(3, 183, 211, 0.14)',
            color: 'text.primary',
            border: '1px solid rgba(3, 183, 211, 0.30)',
            borderRadius: '16px 16px 4px 16px',
          }}
        >
          <Typography
            variant="body1"
            sx={{
              whiteSpace: 'pre-wrap',
              overflowWrap: 'anywhere',
              wordBreak: 'break-word',
            }}
          >
            {message.content}
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, alignItems: 'flex-start' }}>
      <Avatar
        sx={{
          width: 32,
          height: 32,
          bgcolor: 'primary.main',
          color: 'text.primary',
          mt: 0.5,
        }}
        aria-hidden="true"
      >
        <AutoAwesomeIcon sx={{ fontSize: 18 }} />
      </Avatar>

      <Paper
        elevation={0}
        sx={{
          p: 2,
          maxWidth: '85%',
          bgcolor: isError ? 'error.light' : 'background.paper',
          border: 1,
          borderColor: isError ? 'error.main' : 'divider',
          borderRadius: '16px 16px 16px 4px',
        }}
      >
        {isLoading ? (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 0.5 }} aria-label="Searching journal">
            <CircularProgress size={16} color="primary" />
            <Typography variant="body2" color="text.secondary">
              Searching your journal…
            </Typography>
          </Stack>
        ) : isError ? (
          <Stack spacing={1}>
            <Typography variant="body2" color="error.dark">
              {message.content}
            </Typography>
            <Button
              size="small"
              color="error"
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={onRetry}
              aria-label="Retry question"
              sx={{ alignSelf: 'flex-start' }}
            >
              Retry
            </Button>
          </Stack>
        ) : (
          <Box
            aria-live="polite"
            aria-atomic="false"
            sx={{
              overflowWrap: 'anywhere',
              wordBreak: 'break-word',
              '& p': { m: 0, mb: 1, '&:last-child': { mb: 0 } },
              '& ul, & ol': { m: 0, pl: 2.5, mb: 1 },
              '& code': {
                bgcolor: 'rgba(23,26,38,0.06)',
                px: 0.6,
                py: 0.2,
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.875em',
              },
            }}
          >
            <ReactMarkdown>{message.content}</ReactMarkdown>

            {isStreaming && (
              <Box
                component="span"
                aria-hidden="true"
                sx={{
                  display: 'inline-block',
                  width: 8,
                  height: 15,
                  bgcolor: 'primary.main',
                  ml: 0.5,
                  verticalAlign: 'middle',
                  '@keyframes blink': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0 },
                  },
                  animation: 'blink 1s step-start infinite',
                }}
              />
            )}

            {!isStreaming && <SourceChips sources={message.sources} onOpenNote={onOpenNote} />}
          </Box>
        )}
      </Paper>
    </Box>
  );
}
