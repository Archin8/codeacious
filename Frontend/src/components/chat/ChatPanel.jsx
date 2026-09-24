import React, { useRef, useEffect, useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  Button,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DeleteIcon from '@mui/icons-material/Delete';
import { useChat } from '../../hooks/useChat';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import NoteViewDialog from '../notes/NoteViewDialog';

const SUGGESTIONS = [
  'What did I eat this week?',
  'How was my mood on Monday?',
  'Summarize my last 5 entries',
];

export default function ChatPanel() {
  const { messages, sending, send, stop, retryLast, clear } = useChat();
  const [viewNoteId, setViewNoteId] = useState(null);

  const scrollRef = useRef(null);

  // Auto-scroll to bottom on new content if user is near bottom
  useEffect(() => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 140;
      if (isNearBottom) {
        scrollRef.current.scrollTop = scrollHeight;
      }
    }
  }, [messages]);

  const handleOpenNote = (noteId) => {
    setViewNoteId(noteId);
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        p: 2.5,
        bgcolor: 'background.paper',
        borderRadius: 3,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesomeIcon sx={{ color: 'primary.main', fontSize: 22 }} />
          <Typography variant="h2" sx={{ fontSize: '1.15rem' }}>
            Ask your journal
          </Typography>
        </Box>

        {messages.length > 0 && (
          <Button
            size="small"
            color="inherit"
            startIcon={<DeleteIcon />}
            onClick={clear}
            disabled={sending}
            sx={{ color: 'text.secondary', textTransform: 'none' }}
          >
            Clear
          </Button>
        )}
      </Box>

      <Divider />

      {/* Messages Scroll Container */}
      <Box
        ref={scrollRef}
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          py: 2,
          pr: 1,
        }}
      >
        {messages.length === 0 ? (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              px: 2,
            }}
          >
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                bgcolor: 'primary.light',
                color: 'primary.contrastText',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              <AutoAwesomeIcon sx={{ fontSize: 28 }} />
            </Box>
            <Typography variant="h2" gutterBottom sx={{ fontSize: '1.2rem' }}>
              What would you like to know?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360, mb: 3 }}>
              Ask questions about your past entries. The AI searches your journal and streams answers in real-time.
            </Typography>

            <Stack direction="column" spacing={1} sx={{ width: '100%', maxWidth: 360 }}>
              {SUGGESTIONS.map((sugg) => (
                <Chip
                  key={sugg}
                  label={sugg}
                  onClick={() => send(sugg)}
                  variant="outlined"
                  sx={{
                    py: 2,
                    borderRadius: 2,
                    fontSize: '0.875rem',
                    justifyContent: 'flex-start',
                    '&:hover': { bgcolor: 'primary.light', borderColor: 'primary.main' },
                  }}
                />
              ))}
            </Stack>
          </Box>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onRetry={retryLast}
              onOpenNote={handleOpenNote}
            />
          ))
        )}
      </Box>

      {/* Chat Input Pinned at Bottom */}
      <ChatInput onSend={send} onStop={stop} sending={sending} />

      {/* Note View Modal */}
      <NoteViewDialog
        open={Boolean(viewNoteId)}
        noteId={viewNoteId}
        onClose={() => setViewNoteId(null)}
      />
    </Paper>
  );
}
