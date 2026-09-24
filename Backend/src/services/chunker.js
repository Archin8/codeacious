const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Formats the date header for embedding text using UTC to prevent timezone shifts.
 * Format: "Date: YYYY-MM-DD (Weekday)\n"
 */
function formatDateHeader(entryDate) {
  let dateStr;
  let d;

  if (!entryDate) {
    d = new Date();
    dateStr = d.toISOString().split('T')[0];
  } else if (typeof entryDate === 'string') {
    dateStr = entryDate.split('T')[0];
    d = new Date(`${dateStr}T00:00:00Z`);
  } else if (entryDate instanceof Date) {
    dateStr = entryDate.toISOString().split('T')[0];
    d = new Date(`${dateStr}T00:00:00Z`);
  } else {
    d = new Date();
    dateStr = d.toISOString().split('T')[0];
  }

  const weekday = WEEKDAYS[d.getUTCDay()];
  return `Date: ${dateStr} (${weekday})\n`;
}

/**
 * Chunks a journal note into retrieval-friendly pieces according to Phase 5 rules.
 * @param {Object} param0 { content: string, entryDate?: string | Date }
 * @returns {Array<{ chunk_index: number, content: string, embedText: string }>}
 */
export function chunkNote({ content, entryDate }) {
  if (!content || typeof content !== 'string') return [];

  // Rule 1: Normalize (trim, \r\n -> \n, 3+ newlines -> 2)
  const normalized = content.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (!normalized) return [];

  // Rule 6: Compute UTC date header
  const dateHeader = formatDateHeader(entryDate);

  // Rule 2: Short entries (<= 1200 chars) -> 1 chunk
  if (normalized.length <= 1200) {
    return [
      {
        chunk_index: 0,
        content: normalized,
        embedText: `${dateHeader}${normalized}`,
      },
    ];
  }

  // Rule 3 & 4: Split into units (paragraphs -> sentence boundary -> hard split)
  const paragraphs = normalized.split('\n\n');
  const units = [];

  for (const para of paragraphs) {
    if (para.length <= 1000) {
      units.push(para);
    } else {
      const sentences = para.split(/(?<=[.!?])\s+/);
      for (const sentence of sentences) {
        if (sentence.length <= 1000) {
          units.push(sentence);
        } else {
          for (let i = 0; i < sentence.length; i += 1000) {
            units.push(sentence.slice(i, i + 1000));
          }
        }
      }
    }
  }

  // Rule 5: Overlap (~150 chars snapped to sentence/word boundary)
  function getOverlap(text) {
    if (!text || text.length <= 150) return text || '';
    const slice = text.slice(-150);
    const match = slice.match(/(?<=[.!?\n])\s+/);
    if (match && match.index !== undefined) {
      return slice.slice(match.index + match[0].length).trim();
    }
    const spaceIdx = slice.indexOf(' ');
    if (spaceIdx > 0 && spaceIdx < 50) {
      return slice.slice(spaceIdx + 1).trim();
    }
    return slice.trim();
  }

  const rawChunks = [];
  let currentUnits = [];
  let currentLen = 0;

  for (const unit of units) {
    const addedLen = currentUnits.length > 0 ? unit.length + 2 : unit.length;
    if (currentLen + addedLen <= 1000) {
      currentUnits.push(unit);
      currentLen += addedLen;
    } else {
      if (currentUnits.length > 0) {
        const chunkText = currentUnits.join('\n\n');
        rawChunks.push(chunkText);
        const overlap = getOverlap(chunkText);
        if (overlap) {
          currentUnits = [overlap, unit];
          currentLen = overlap.length + 2 + unit.length;
        } else {
          currentUnits = [unit];
          currentLen = unit.length;
        }
      } else {
        rawChunks.push(unit);
        currentUnits = [];
        currentLen = 0;
      }
    }
  }

  if (currentUnits.length > 0) {
    const chunkText = currentUnits.join('\n\n');
    rawChunks.push(chunkText);
  }

  // Rule 7: Store plain content in chunk, build embedText with date header
  return rawChunks.map((chunkContent, idx) => ({
    chunk_index: idx,
    content: chunkContent,
    embedText: `${dateHeader}${chunkContent}`,
  }));
}
