// Notes CRUD + embedding sync — Phase 6
// TENANCY RULES:
// 1. Every function takes userId as its first required argument.
// 2. Every query includes .eq('user_id', userId). Every RPC receives p_user_id / match_user_id.
// 3. Routes pass req.user.id. Nothing else is accepted as identity.
// 4. "Not found" and "not yours" both return 404, so attackers can't probe which ids exist.

import { supabaseAdmin } from '../lib/supabase.js';
import { chunkNote } from './chunker.js';
import { embedTexts } from './embeddings.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../lib/logger.js';

/**
 * Retrieves a single note by ID for the specified user.
 * Returns 404 if the note doesn't exist or doesn't belong to the user.
 */
export async function getNote(userId, noteId) {
  if (!userId) throw new AppError(401, 'unauthorized', 'User ID required');
  if (!noteId) throw new AppError(400, 'invalid_id', 'Note ID required');

  const { data, error } = await supabaseAdmin
    .from('notes')
    .select('id, content, entry_date, created_at, updated_at')
    .eq('id', noteId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    throw new AppError(404, 'not_found', 'Note not found');
  }

  return data;
}

/**
 * Creates a new note with vectors embedded BEFORE writing to DB via atomic RPC.
 */
export async function createNote(userId, { content, entry_date }) {
  if (!userId) throw new AppError(401, 'unauthorized', 'User ID required');

  const entryDate = entry_date || new Date().toISOString().split('T')[0];

  // Step 1: Chunk note
  const chunks = chunkNote({ content, entryDate });

  // Step 2: Embed BEFORE DB write
  const embeddings = await embedTexts(chunks.map((c) => c.embedText));

  const p_chunks = chunks.map((c, i) => ({
    chunk_index: c.chunk_index,
    content: c.content,
    embedding: JSON.stringify(embeddings[i]),
  }));

  // Step 3: Atomic save via RPC
  const { data: noteId, error } = await supabaseAdmin.rpc('save_note_with_chunks', {
    p_user_id: userId,
    p_note_id: null,
    p_content: content,
    p_entry_date: entryDate,
    p_chunks: p_chunks,
  });

  if (error) {
    logger.error({ error }, 'RPC save_note_with_chunks failed during createNote');
    throw new AppError(500, 'database_error', 'Failed to save note');
  }

  // Step 4: Return full note row
  return await getNote(userId, noteId);
}

/**
 * Updates an existing note. Re-chunks and re-embeds before updating via RPC.
 */
export async function updateNote(userId, noteId, { content, entry_date }) {
  if (!userId) throw new AppError(401, 'unauthorized', 'User ID required');

  // Verify ownership and fetch existing note (throws 404 if not found/not yours)
  const existing = await getNote(userId, noteId);

  const updatedContent = content !== undefined ? content : existing.content;
  const updatedDate = entry_date !== undefined ? entry_date : existing.entry_date;

  if (updatedContent === existing.content && updatedDate === existing.entry_date) {
    return existing;
  }

  // Re-chunk & re-embed
  const chunks = chunkNote({ content: updatedContent, entryDate: updatedDate });
  const embeddings = await embedTexts(chunks.map((c) => c.embedText));

  const p_chunks = chunks.map((c, i) => ({
    chunk_index: c.chunk_index,
    content: c.content,
    embedding: JSON.stringify(embeddings[i]),
  }));

  const { data: updatedId, error } = await supabaseAdmin.rpc('save_note_with_chunks', {
    p_user_id: userId,
    p_note_id: noteId,
    p_content: updatedContent,
    p_entry_date: updatedDate,
    p_chunks: p_chunks,
  });

  if (error) {
    if (error.message?.includes('note_not_found')) {
      throw new AppError(404, 'not_found', 'Note not found');
    }
    logger.error({ error }, 'RPC save_note_with_chunks failed during updateNote');
    throw new AppError(500, 'database_error', 'Failed to update note');
  }

  return await getNote(userId, updatedId);
}

/**
 * Deletes a note. Chunks are automatically removed via ON DELETE CASCADE.
 */
export async function deleteNote(userId, noteId) {
  if (!userId) throw new AppError(401, 'unauthorized', 'User ID required');

  const { data, error } = await supabaseAdmin
    .from('notes')
    .delete()
    .eq('id', noteId)
    .eq('user_id', userId)
    .select('id');

  if (error) {
    logger.error({ error }, 'Failed to delete note');
    throw new AppError(500, 'database_error', 'Failed to delete note');
  }

  if (!data || data.length === 0) {
    throw new AppError(404, 'not_found', 'Note not found');
  }
}

/**
 * Lists notes for a user with cursor pagination.
 */
export async function listNotes(userId, { limit = 20, before } = {}) {
  if (!userId) throw new AppError(401, 'unauthorized', 'User ID required');

  const cappedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);

  let query = supabaseAdmin
    .from('notes')
    .select('id, content, entry_date, created_at, updated_at')
    .eq('user_id', userId)
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(cappedLimit + 1);

  if (before) {
    query = query.lt('created_at', before);
  }

  const { data, error } = await query;

  if (error) {
    logger.error({ error }, 'Failed to list notes');
    throw new AppError(500, 'database_error', 'Failed to list notes');
  }

  let next_cursor = null;
  const notes = data || [];

  if (notes.length > cappedLimit) {
    const nextItem = notes.pop();
    next_cursor = nextItem.created_at;
  }

  return { notes, next_cursor };
}
