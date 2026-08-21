export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
}

export interface GeneratedFile {
  path: string;      // e.g. "src/app.js"
  contents: string;
}

export type BuildStatus =
  | 'idle'
  | 'booting'
  | 'writing_files'
  | 'installing'
  | 'starting'
  | 'running'
  | 'error';

export interface TerminalLine {
  id: string;
  stream: 'stdout' | 'stderr' | 'system';
  text: string;
  timestamp: number;
}

export interface WebContainerState {
  status: BuildStatus;
  previewUrl: string | null;
  files: GeneratedFile[];
  terminalLines: TerminalLine[];
  lastError: string | null;
}
