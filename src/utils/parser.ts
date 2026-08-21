import type { GeneratedFile } from '../types';

/**
 * DeepSeek-R1 output typically looks like:
 *
 *   Here's the plan...
 *   **File: src/app.js**
 *   ```js
 *   console.log("hello");
 *   ```
 *   Next, package.json:
 *   ```json path="package.json"
 *   { "name": "demo" }
 *   ```
 *
 * This parser is deliberately tolerant of both conventions:
 *   1. A "**File: <path>**" (or "File: <path>") marker on the line
 *      immediately before a fenced code block.
 *   2. A `path="..."` attribute on the fence itself.
 *
 * Anything that isn't inside a recognized, path-tagged fence is treated
 * as prose/reasoning and discarded.
 */

const FENCE_RE = /```([a-zA-Z0-9]*)(?:\s+path=["']([^"']+)["'])?\n([\s\S]*?)```/g;
const FILE_MARKER_RE = /(?:\*\*)?File:\s*([^\n*]+?)(?:\*\*)?\s*$/i;

export function extractFilesFromResponse(raw: string): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const lines = raw.split('\n');

  // Track the last "File: ..." marker seen so we can associate it with
  // the next fenced code block if the fence itself has no path attr.
  let pendingPath: string | null = null;
  for (const line of lines) {
    const match = line.match(FILE_MARKER_RE);
    if (match) pendingPath = match[1].trim();
  }

  let m: RegExpExecArray | null;
  FENCE_RE.lastIndex = 0;
  while ((m = FENCE_RE.exec(raw)) !== null) {
    const [, , attrPath, body] = m;
    const path = attrPath ?? findNearestFileMarker(raw, m.index) ?? pendingPath;
    if (!path) continue; // no idea what file this is — skip it
    files.push({ path: normalizePath(path), contents: body.replace(/\n$/, '') });
  }

  return dedupeByPath(files);
}

function findNearestFileMarker(raw: string, fenceIndex: number): string | null {
  const before = raw.slice(0, fenceIndex);
  const beforeLines = before.split('\n').reverse();
  for (const line of beforeLines.slice(0, 6)) {
    const match = line.match(FILE_MARKER_RE);
    if (match) return match[1].trim();
  }
  return null;
}

function normalizePath(p: string): string {
  return p.replace(/^\.?\//, '').trim();
}

function dedupeByPath(files: GeneratedFile[]): GeneratedFile[] {
  const map = new Map<string, GeneratedFile>();
  for (const f of files) map.set(f.path, f); // last write wins
  return Array.from(map.values());
}

/** Strips <think>...</think> or similar reasoning blocks some R1 endpoints stream. */
export function stripThinking(raw: string): string {
  return raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}
