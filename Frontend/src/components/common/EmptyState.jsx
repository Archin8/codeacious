import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import EditNoteIcon from '@mui/icons-material/EditNote';

export default function EmptyState({ title = 'No entries yet', message = 'Write your first journal entry above to start building your personal AI memory.' }) {
  return (
    <Card sx={{ p: 4, textAlign: 'center', borderStyle: 'dashed' }}>
      <CardContent>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 48,
            height: 48,
            borderRadius: '50%',
            bgcolor: 'primary.light',
            color: 'primary.contrastText',
            mb: 2,
          }}
        >
          <EditNoteIcon fontSize="medium" />
        </Box>
        <Typography variant="h2" gutterBottom sx={{ fontSize: '1.1rem' }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360, mx: 'auto' }}>
          {message}
        </Typography>
      </CardContent>
    </Card>
  );
}
