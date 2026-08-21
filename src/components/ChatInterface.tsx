import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import type { ChatMessage } from '../types';

interface Props {
  messages: ChatMessage[];
  isStreaming: boolean;
  onSend: (prompt: string) => void;
}

export default function ChatInterface({ messages, isStreaming, onSend }: Props) {
  const [input, setInput] = useState('');

  const submit = () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900 border-r border-neutral-800">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
              m.role === 'user'
                ? 'bg-indigo-600/20 text-indigo-100 ml-8'
                : 'bg-neutral-800 text-neutral-200 mr-8'
            }`}
          >
            {m.content}
          </div>
        ))}
        {isStreaming && (
          <div className="flex items-center gap-2 text-neutral-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> thinking…
          </div>
        )}
      </div>
      <div className="p-3 border-t border-neutral-800 flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Describe the app you want to build…"
          rows={2}
          className="flex-1 resize-none rounded-md bg-neutral-800 text-neutral-100 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          onClick={submit}
          disabled={isStreaming}
          className="self-end rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 p-2"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
