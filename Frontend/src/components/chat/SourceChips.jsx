import React from 'react';
import { Box, Typography, Chip, Tooltip, Stack } from '@mui/material';
import ArticleIcon from '@mui/icons-material/Article';
import { formatEntryDate } from '../../lib/date';

export default function SourceChips({ sources, onOpenNote }) {
  if (!sources || sources.length === 0) return null;

  return (
    <Box sx={{ mt: 1.5, pt: 1, borderTop: '1px dashed rgba(23,26,38,0.12)' }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.8, fontWeight: 600 }}>
        Sources:
      </Typography>
      <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
        {sources.map((src, idx) => {
          const formattedDate = formatEntryDate(src.entry_date);
          const previewTooltip = src.preview ? `"${src.preview}"` : `View note from ${formattedDate}`;

          return (
            <Tooltip key={src.note_id || idx} title={previewTooltip} arrow>
              <Chip
                icon={<ArticleIcon sx={{ fontSize: '0.85rem !important' }} />}
                label={formattedDate}
                size="small"
                variant="outlined"
                onClick={() => onOpenNote && onOpenNote(src.note_id)}
                sx={{
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  bgcolor: 'background.paper',
                  '&:hover': {
                    bgcolor: 'primary.light',
                    borderColor: 'primary.main',
                  },
                }}
              />
            </Tooltip>
          );
        })}
      </Stack>
    </Box>
  );
}
