import { useCallback, useState } from 'react';
import type { ChatMessage } from '../types';

const API_BASE = import.meta.env.VITE_DEEPSEEK_API_BASE ?? 'https://api.deepseek.com/v1';
const API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY ?? '';
const MODEL = import.meta.env.VITE_DEEPSEEK_MODEL ?? 'deepseek-reasoner';

const SYSTEM_PROMPT = `You are FED-V1's build engine. When asked to create or fix an app,
respond ONLY with the files needed, each preceded by a line of the exact form:
File: <relative/path/to/file>
followed immediately by a fenced code block containing that file's full contents.
Do not include explanations outside of file blocks. Keep the app dependency-light
and runnable with "npm install && npm run dev".`;

export function useDeepSeek() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Streams a completion, calling onToken for each text chunk. Returns full text. */
  const streamCompletion = useCallback(
    async (
      history: ChatMessage[],
      onToken: (chunk: string) => void
    ): Promise<string> => {
      setIsStreaming(true);
      setError(null);
      let full = '';

      try {
        const res = await fetch(`${API_BASE}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${API_KEY}`,
          },
          body: JSON.stringify({
            model: MODEL,
            stream: true,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              ...history.map((m) => ({ role: m.role, content: m.content })),
            ],
          }),
        });

        if (!res.ok || !res.body) {
          throw new Error(`DeepSeek request failed: ${res.status} ${res.statusText}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const payload = trimmed.slice(5).trim();
            if (payload === '[DONE]') continue;

            try {
              const json = JSON.parse(payload);
              const delta: string = json.choices?.[0]?.delta?.content ?? '';
              if (delta) {
                full += delta;
                onToken(delta);
              }
            } catch {
              // partial JSON chunk — ignore, next read will complete it
            }
          }
        }

        return full;
      } catch (err: any) {
        const message = err?.message ?? String(err);
        setError(message);
        throw err;
      } finally {
        setIsStreaming(false);
      }
    },
    []
  );

  return { streamCompletion, isStreaming, error };
}
