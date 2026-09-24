import React from 'react';
import {
  Box,
  Skeleton,
  Alert,
  Button,
  Stack,
  Card,
  CardContent,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import NoteCard from './NoteCard';
import EmptyState from '../common/EmptyState';

export default function NoteList({
  notes,
  loading,
  loadingMore,
  error,
  nextCursor,
  onLoadMore,
  onRefresh,
  onEditNote,
  onDeleteNote,
}) {
  if (loading) {
    return (
      <Stack spacing={2}>
        {[1, 2, 3].map((i) => (
          <Card key={i} sx={{ mb: 2 }}>
            <CardContent>
              <Skeleton variant="rectangular" width={120} height={24} sx={{ borderRadius: 1, mb: 2 }} />
              <Skeleton variant="text" height={20} />
              <Skeleton variant="text" height={20} width="80%" />
              <Skeleton variant="text" height={20} width="60%" />
            </CardContent>
          </Card>
        ))}
      </Stack>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={onRefresh} startIcon={<RefreshIcon />}>
            Retry
          </Button>
        }
        sx={{ mb: 2 }}
      >
        {error}
      </Alert>
    );
  }

  if (!notes || notes.length === 0) {
    return <EmptyState />;
  }

  return (
    <Box>
      <Stack spacing={0}>
        {notes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            onEdit={onEditNote}
            onDelete={onDeleteNote}
          />
        ))}
      </Stack>

      {nextCursor && (
        <Box sx={{ textAlign: 'center', mt: 2, mb: 4 }}>
          <Button
            variant="outlined"
            onClick={onLoadMore}
            disabled={loadingMore}
            fullWidth
          >
            {loadingMore ? 'Loading more…' : 'Load more entries'}
          </Button>
        </Box>
      )}
    </Box>
  );
}
