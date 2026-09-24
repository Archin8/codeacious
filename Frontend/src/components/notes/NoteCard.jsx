import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  Box,
  Button,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { formatEntryDate } from '../../lib/date';

export default function NoteCard({ note, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  // Check if edited (updated_at is more than 5s past created_at)
  const isEdited =
    note.updated_at &&
    note.created_at &&
    new Date(note.updated_at).getTime() - new Date(note.created_at).getTime() > 5000;

  const contentText = note.content || '';
  const isLongText = contentText.length > 320 || contentText.split('\n').length > 6;

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ pb: '16px !important' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              icon={<CalendarTodayIcon sx={{ fontSize: '0.9rem !important' }} />}
              label={formatEntryDate(note.entry_date)}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 600, fontSize: '0.78rem' }}
            />
            {isEdited && (
              <Typography variant="caption" color="text.secondary">
                (edited)
              </Typography>
            )}
          </Stack>

          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Edit entry">
              <IconButton
                size="small"
                aria-label="Edit entry"
                onClick={() => onEdit && onEdit(note)}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete entry">
              <IconButton
                size="small"
                color="error"
                aria-label="Delete entry"
                onClick={() => onDelete && onDelete(note)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        <Typography
          variant="body1"
          sx={{
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
            ...(isLongText && !expanded && {
              display: '-webkit-box',
              WebkitLineClamp: 6,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }),
          }}
        >
          {contentText}
        </Typography>

        {isLongText && (
          <Box sx={{ mt: 1 }}>
            <Button
              size="small"
              onClick={() => setExpanded((prev) => !prev)}
              sx={{ p: 0, minWidth: 0, textTransform: 'none', fontSize: '0.875rem' }}
            >
              {expanded ? 'Show less' : 'Show more'}
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
