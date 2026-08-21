import { useState } from 'react';
import { FileCode2, Download } from 'lucide-react';
import type { GeneratedFile } from '../types';

interface Props {
  files: GeneratedFile[];
  onDownloadZip: () => void;
}

export default function CodeEditor({ files, onDownloadZip }: Props) {
  const [activePath, setActivePath] = useState<string | null>(files[0]?.path ?? null);
  const active = files.find((f) => f.path === activePath) ?? files[0];

  if (files.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-neutral-500 text-sm">
        No files yet — send a prompt to get started.
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="w-48 border-r border-neutral-800 overflow-y-auto">
        <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800">
          <span className="text-xs uppercase text-neutral-500">Files</span>
          <button onClick={onDownloadZip} title="Download .zip">
            <Download className="w-4 h-4 text-neutral-400 hover:text-neutral-100" />
          </button>
        </div>
        {files.map((f) => (
          <button
            key={f.path}
            onClick={() => setActivePath(f.path)}
            className={`w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs truncate ${
              f.path === active?.path
                ? 'bg-neutral-800 text-neutral-100'
                : 'text-neutral-400 hover:bg-neutral-800/60'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5 shrink-0" />
            {f.path}
          </button>
        ))}
      </div>
      <pre className="flex-1 overflow-auto p-4 text-xs text-neutral-200 leading-relaxed">
        <code>{active?.contents}</code>
      </pre>
    </div>
  );
}
