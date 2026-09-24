import React, { useState } from 'react';
import {
  Box,
  Paper,
  BottomNavigation,
  BottomNavigationAction,
  useMediaQuery,
  useTheme,
  Snackbar,
  Alert,
} from '@mui/material';
import EditNoteIcon from '@mui/icons-material/EditNote';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TopBar from './TopBar';
import NoteComposer from '../notes/NoteComposer';
import NoteList from '../notes/NoteList';
import NoteEditDialog from '../notes/NoteEditDialog';
import ConfirmDialog from '../common/ConfirmDialog';
import ChatPanel from '../chat/ChatPanel';
import { useNotes } from '../../hooks/useNotes';

export default function AppShell() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [mobileTab, setMobileTab] = useState(0); // 0 = Journal, 1 = Ask AI

  // Dialog & Notification States
  const [editingNote, setEditingNote] = useState(null);
  const [deletingNote, setDeletingNote] = useState(null);
  const [deletingLoading, setDeletingLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const {
    notes,
    loading,
    loadingMore,
    error,
    nextCursor,
    refresh,
    loadMore,
    create,
    update,
    remove,
  } = useNotes();

  const showToast = (message, severity = 'success') => {
    setToast({ open: true, message, severity });
  };

  const handleSaveNote = async (newNoteData) => {
    return await create(newNoteData);
  };

  const handleEditSave = async (id, patch) => {
    await update(id, patch);
    showToast('Entry updated');
  };

  const handleDeleteConfirm = async () => {
    if (!deletingNote) return;
    setDeletingLoading(true);
    try {
      await remove(deletingNote.id);
      showToast('Entry deleted');
      setDeletingNote(null);
    } catch (err) {
      if (err?.status === 404) {
        showToast('That entry no longer exists.', 'error');
        refresh();
        setDeletingNote(null);
      } else {
        showToast(err?.message || 'Failed to delete entry.', 'error');
      }
    } finally {
      setDeletingLoading(false);
    }
  };

  const handleNotFound = () => {
    showToast('That entry no longer exists.', 'error');
    refresh();
  };

  return (
    <Box sx={{ height: '100dvh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <TopBar />

      <Box
        component="main"
        sx={{
          flex: 1,
          minHeight: 0, // Mandatory for internal scrolling in flex children
          p: { xs: 2, md: 3 },
          maxWidth: 1400,
          width: '100%',
          mx: 'auto',
          boxSizing: 'border-box',
          display: 'grid',
          gridTemplateColumns: isDesktop ? 'minmax(360px, 5fr) 7fr' : '1fr',
          gap: 3,
        }}
      >
        {/* Left Pane: Journal Notes (Composer + List) */}
        <Box
          component="section"
          aria-label="Journal notes"
          sx={{
            display: isDesktop || mobileTab === 0 ? 'flex' : 'none',
            flexDirection: 'column',
            height: '100%',
            minHeight: 0,
          }}
        >
          <NoteComposer onSaveNote={handleSaveNote} />

          <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', pr: 0.5 }}>
            <NoteList
              notes={notes}
              loading={loading}
              loadingMore={loadingMore}
              error={error}
              nextCursor={nextCursor}
              onLoadMore={loadMore}
              onRefresh={refresh}
              onEditNote={(note) => setEditingNote(note)}
              onDeleteNote={(note) => setDeletingNote(note)}
            />
          </Box>
        </Box>

        {/* Right Pane: AI Chat Interface */}
        <Box
          component="section"
          aria-label="Ask your journal AI chat"
          sx={{
            display: isDesktop || mobileTab === 1 ? 'flex' : 'none',
            flexDirection: 'column',
            height: '100%',
            minHeight: 0,
          }}
        >
          <ChatPanel />
        </Box>
      </Box>

      {/* Mobile Bottom Navigation */}
      {!isDesktop && (
        <Paper elevation={3} component="nav" aria-label="Mobile navigation" sx={{ borderTop: 1, borderColor: 'divider', borderRadius: 0 }}>
          <BottomNavigation
            value={mobileTab}
            onChange={(_event, newValue) => setMobileTab(newValue)}
            showLabels
          >
            <BottomNavigationAction label="Journal" icon={<EditNoteIcon />} />
            <BottomNavigationAction label="Ask AI" icon={<AutoAwesomeIcon />} />
          </BottomNavigation>
        </Paper>
      )}

      {/* Edit Entry Dialog */}
      <NoteEditDialog
        open={Boolean(editingNote)}
        note={editingNote}
        onClose={() => setEditingNote(null)}
        onSave={handleEditSave}
        onNotFound={handleNotFound}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deletingNote)}
        loading={deletingLoading}
        onClose={() => setDeletingNote(null)}
        onConfirm={handleDeleteConfirm}
      />

      {/* Notification Toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          severity={toast.severity}
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
