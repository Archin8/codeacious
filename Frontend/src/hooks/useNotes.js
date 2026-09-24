import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../lib/api';

export function useNotes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);

  // Request counter ref to prevent race conditions on async responses
  const requestIdRef = useRef(0);

  const fetchNotes = useCallback(async (cursor = null, append = false) => {
    const currentReqId = ++requestIdRef.current;
    
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const path = cursor
        ? `/api/notes?limit=20&before=${encodeURIComponent(cursor)}`
        : '/api/notes?limit=20';

      const data = await api(path);

      // Ignore if a newer request was dispatched
      if (currentReqId !== requestIdRef.current) return;

      if (data) {
        setNotes((prev) => (append ? [...prev, ...(data.notes || [])] : data.notes || []));
        setNextCursor(data.next_cursor || null);
      }
    } catch (err) {
      if (currentReqId === requestIdRef.current) {
        setError(err.message || 'Failed to load notes');
      }
    } finally {
      if (currentReqId === requestIdRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const refresh = useCallback(() => {
    return fetchNotes(null, false);
  }, [fetchNotes]);

  const loadMore = useCallback(() => {
    if (!nextCursor || loadingMore) return;
    return fetchNotes(nextCursor, true);
  }, [fetchNotes, nextCursor, loadingMore]);

  const create = useCallback(async ({ content, entry_date }) => {
    try {
      const newNote = await api('/api/notes', {
        method: 'POST',
        body: { content, entry_date },
      });
      // Refetch full list so the new note is placed in exact chronological sort order
      await refresh();
      return newNote;
    } catch (err) {
      throw err;
    }
  }, [refresh]);

  const update = useCallback(async (id, patch) => {
    try {
      const updatedNote = await api(`/api/notes/${id}`, {
        method: 'PUT',
        body: patch,
      });
      await refresh();
      return updatedNote;
    } catch (err) {
      throw err;
    }
  }, [refresh]);

  const remove = useCallback(async (id) => {
    try {
      await api(`/api/notes/${id}`, {
        method: 'DELETE',
      });
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      throw err;
    }
  }, []);

  return {
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
  };
}
