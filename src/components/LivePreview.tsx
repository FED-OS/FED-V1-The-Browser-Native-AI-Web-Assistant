import { Globe2 } from 'lucide-react';

interface Props {
  url: string | null;
}

export default function LivePreview({ url }: Props) {
  if (!url) {
    return (
      <div className="h-full flex items-center justify-center text-neutral-500 text-sm gap-2">
        <Globe2 className="w-4 h-4" /> No live preview yet
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-1.5 border-b border-neutral-800 text-xs text-neutral-400 truncate">
        {url}
      </div>
      <iframe
        title="live-preview"
        src={url}
        className="flex-1 w-full bg-white"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </div>
  );
}
