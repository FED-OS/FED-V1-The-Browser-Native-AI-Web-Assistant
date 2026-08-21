import { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import CodeEditor from './components/CodeEditor';
import TerminalOutput from './components/TerminalOutput';
import LivePreview from './components/LivePreview';
import { useDeepSeek } from './hooks/useDeepSeek';
import { useWebContainer } from './hooks/useWebContainer';
import { extractFilesFromResponse, stripThinking } from './utils/parser';
import { downloadAsZip } from './utils/zipper';
import type { ChatMessage, GeneratedFile } from './types';

const MAX_AUTO_FIX_ATTEMPTS = 2;

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const { streamCompletion, isStreaming } = useDeepSeek();
  const { status, previewUrl, terminalLines, applyFilesAndRun } = useWebContainer();

  const pushMessage = (role: ChatMessage['role'], content: string) => {
    const msg: ChatMessage = { id: crypto.randomUUID(), role, content, createdAt: Date.now() };
    setMessages((prev) => [...prev, msg]);
    return msg;
  };

  const runBuildLoop = async (history: ChatMessage[], attempt = 0) => {
    let assistantText = '';
    const assistantMsg = pushMessage('assistant', '');
    await streamCompletion(history, (chunk) => {
      assistantText += chunk;
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantMsg.id ? { ...m, content: assistantText } : m))
      );
    });

    const cleaned = stripThinking(assistantText);
    const parsedFiles = extractFilesFromResponse(cleaned);
    if (parsedFiles.length === 0) return; // nothing to build, just a chat reply

    setFiles(parsedFiles);
    const result = await applyFilesAndRun(parsedFiles);

    if (!result.ok && attempt < MAX_AUTO_FIX_ATTEMPTS) {
      const fixPrompt = pushMessage(
        'user',
        `The build failed with this output:\n\n${result.errorOutput.slice(0, 2000)}\n\nFix the code and resend the full file contents.`
      );
      await runBuildLoop([...history, assistantMsg, fixPrompt], attempt + 1);
    }
  };

  const handleSend = async (prompt: string) => {
    const userMsg = pushMessage('user', prompt);
    await runBuildLoop([...messages, userMsg]);
  };

  return (
    <div className="h-screen w-screen grid grid-cols-[360px_1fr] grid-rows-1 bg-neutral-950 text-neutral-100">
      <ChatInterface messages={messages} isStreaming={isStreaming} onSend={handleSend} />

      <div className="grid grid-rows-2 grid-cols-2">
        <div className="col-span-2 border-b border-neutral-800">
          <CodeEditor files={files} onDownloadZip={() => downloadAsZip(files)} />
        </div>
        <div className="border-r border-neutral-800">
          <TerminalOutput lines={terminalLines} />
        </div>
        <div>
          <LivePreview url={previewUrl} />
        </div>
      </div>

      <div className="fixed bottom-2 right-2 text-[10px] uppercase tracking-wide text-neutral-500">
        status: {status}
      </div>
    </div>
  );
}
