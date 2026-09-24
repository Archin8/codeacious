import { supabase } from './supabase';
import { ApiError } from './api';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function getToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}

/**
 * Stream reader for /api/chat Server-Sent Events.
 * EventSource cannot pass Authorization headers or POST bodies, so we use fetch + ReadableStream.
 */
export async function streamChat({ body, signal, onSources, onToken, onDone }) {
  const token = await getToken();

  const res = await fetch(`${BASE}/api/chat`, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ ...body, stream: true }),
  });

  if (!res.ok) {
    // Check 401 unauthenticated
    if (res.status === 401) {
      supabase.auth.signOut().catch(() => {});
    }
    const j = await res.json().catch(() => null);
    throw new ApiError(
      res.status,
      j?.error?.code || 'chat_error',
      j?.error?.message || 'Request failed'
    );
  }

  // Fallback: The backend returns plain JSON (not SSE) when no relevant entries pass similarity threshold.
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const j = await res.json();
    if (j.sources) onSources?.(j.sources);
    if (j.answer) onToken?.(j.answer);
    onDone?.();
    return;
  }

  // Read response stream as Server-Sent Events
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let i;
      // An SSE event block ends in double newline "\n\n"
      while ((i = buffer.indexOf('\n\n')) !== -1) {
        const block = buffer.slice(0, i);
        buffer = buffer.slice(i + 2);

        const eventMatch = /^event: (.*)$/m.exec(block);
        const dataMatch = /^data: (.*)$/m.exec(block);
        const event = eventMatch?.[1];
        const dataStr = dataMatch?.[1];

        if (!event || dataStr === undefined) continue;

        try {
          const payload = JSON.parse(dataStr);
          if (event === 'sources') {
            onSources?.(payload);
          } else if (event === 'token') {
            if (payload?.t) onToken?.(payload.t);
          } else if (event === 'error') {
            throw new ApiError(500, payload?.code || 'stream_error', payload?.message || 'Stream error');
          } else if (event === 'done') {
            onDone?.();
          }
        } catch (err) {
          if (err instanceof ApiError) throw err;
          // Ignore JSON parse errors for incomplete/malformed blocks
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
