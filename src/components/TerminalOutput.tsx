import { useEffect, useRef } from 'react';
import type { TerminalLine } from '../types';

interface Props {
  lines: TerminalLine[];
}

const colorFor: Record<TerminalLine['stream'], string> = {
  stdout: 'text-neutral-300',
  stderr: 'text-red-400',
  system: 'text-indigo-400',
};

export default function TerminalOutput({ lines }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines.length]);

  return (
    <div className="h-full overflow-y-auto bg-black/60 font-mono text-xs p-3 space-y-0.5">
      {lines.length === 0 && <div className="text-neutral-600">Waiting for build output…</div>}
      {lines.map((l) => (
        <div key={l.id} className={colorFor[l.stream]}>
          {l.text}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
