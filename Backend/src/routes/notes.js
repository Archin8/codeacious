import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { env } from '../config/env.js';
import * as notesService from '../services/notes.js';

const router = Router();

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const validateEntryDate = (val) => {
  if (!val) return true;
  if (!dateRegex.test(val)) return false;
  const d = new Date(`${val}T00:00:00Z`);
  if (isNaN(d.getTime())) return false;
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return d <= tomorrow;
};

const createNoteSchema = z.object({
  body: z.object({
    content: z
      .string()
      .trim()
      .min(1, 'Content is required')
      .max(env.MAX_NOTE_CHARS, `Content length cannot exceed ${env.MAX_NOTE_CHARS} characters`),
    entry_date: z
      .string()
      .optional()
      .refine(validateEntryDate, 'entry_date must be YYYY-MM-DD and not more than 1 day in the future'),
  }),
});

const updateNoteSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid note ID'),
  }),
  body: z.object({
    content: z
      .string()
      .trim()
      .min(1, 'Content cannot be empty')
      .max(env.MAX_NOTE_CHARS, `Content length cannot exceed ${env.MAX_NOTE_CHARS} characters`)
      .optional(),
    entry_date: z
      .string()
      .optional()
      .refine(validateEntryDate, 'entry_date must be YYYY-MM-DD and not more than 1 day in the future'),
  }),
});

const noteIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid note ID'),
  }),
});

const listNotesSchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().min(1).max(50).optional().default(20),
    before: z.string().optional(),
  }),
});

// POST /api/notes - Create a new note
router.post('/', validate(createNoteSchema), async (req, res, next) => {
  try {
    const note = await notesService.createNote(req.user.id, req.body);
    res.status(201).json(note);
  } catch (err) {
    next(err);
  }
});

// GET /api/notes - List notes with cursor pagination
router.get('/', validate(listNotesSchema), async (req, res, next) => {
  try {
    const result = await notesService.listNotes(req.user.id, req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/notes/:id - Get a single note by ID
router.get('/:id', validate(noteIdParamSchema), async (req, res, next) => {
  try {
    const note = await notesService.getNote(req.user.id, req.params.id);
    res.json(note);
  } catch (err) {
    next(err);
  }
});

// PUT /api/notes/:id - Update a note by ID
router.put('/:id', validate(updateNoteSchema), async (req, res, next) => {
  try {
    const note = await notesService.updateNote(req.user.id, req.params.id, req.body);
    res.json(note);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/notes/:id - Delete a note by ID
router.delete('/:id', validate(noteIdParamSchema), async (req, res, next) => {
  try {
    await notesService.deleteNote(req.user.id, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
