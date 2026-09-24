import { useState, useCallback, useRef } from 'react';
import { ApiError } from '../lib/api';
import { streamChat } from '../lib/sse';

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);

  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  // Ref to hold active stream's AbortController
  const abortControllerRef = useRef(null);

  const mapChatError = (err) => {
    if (err instanceof ApiError) {
      if (err.status === 429) return 'Too many questions. Wait a moment and try again.';
      if (err.status === 503 || err.code === 'embedding_rate_limited') {
        return 'The AI service is busy. Try again in a minute.';
      }
      if (err.status === 502 || err.status === 504) return "Couldn't reach the AI. Please retry.";
    }
    return err?.message || "Couldn't reach the AI. Please retry.";
  };

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setSending(false);

    // Mark current streaming message as done
    setMessages((prev) =>
      prev.map((msg) => (msg.status === 'streaming' ? { ...msg, status: 'done' } : msg))
    );
  }, []);

  const send = useCallback(async (questionText) => {
    const text = questionText?.trim();
    if (!text || sending) return;

    // Abort any existing stream before starting a new one
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // 1. Construct user message
    const userMsg = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: text,
    };

    // 2. Extract last 6 completed turns for history (role and content only)
    const history = messagesRef.current
      .filter((m) => m.status !== 'error')
      .slice(-6)
      .map((m) => ({ role: m.role, content: m.content }));

    // 3. Construct streaming assistant message placeholder
    const assistantId = 'assistant-' + Date.now();
    const pendingAssistantMsg = {
      id: assistantId,
      role: 'assistant',
      content: '',
      sources: [],
      status: 'streaming',
    };

    setMessages((prev) => [...prev, userMsg, pendingAssistantMsg]);
    setSending(true);

    try {
      await streamChat({
        body: {
          question: text,
          history,
        },
        signal: abortController.signal,
        onSources: (sources) => {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === assistantId ? { ...msg, sources } : msg))
          );
        },
        onToken: (tokenText) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? { ...msg, content: (msg.content || '') + tokenText }
                : msg
            )
          );
        },
        onDone: () => {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === assistantId ? { ...msg, status: 'done' } : msg))
          );
        },
      });
    } catch (err) {
      if (err.name === 'AbortError') {
        // User clicked Stop button; mark current response as finished
        setMessages((prev) =>
          prev.map((msg) => (msg.id === assistantId ? { ...msg, status: 'done' } : msg))
        );
      } else {
        const errorMsgText = mapChatError(err);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  content: errorMsgText,
                  status: 'error',
                }
              : msg
          )
        );
      }
    } finally {
      setSending(false);
      abortControllerRef.current = null;
    }
  }, [sending]);

  const retryLast = useCallback(() => {
    const currentMsgs = messagesRef.current;
    if (currentMsgs.length < 2) return;

    const lastUserMsg = [...currentMsgs].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg) return;

    setMessages((prev) => prev.filter((m) => m.status !== 'error'));
    send(lastUserMsg.content);
  }, [send]);

  const clear = useCallback(() => {
    stop();
    setMessages([]);
  }, [stop]);

  return {
    messages,
    sending,
    send,
    stop,
    retryLast,
    clear,
  };
}
