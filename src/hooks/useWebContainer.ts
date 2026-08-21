import { useCallback, useRef, useState } from 'react';
import { WebContainer, type WebContainerProcess } from '@webcontainer/api';
import type { BuildStatus, GeneratedFile, TerminalLine } from '../types';

let containerSingleton: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

async function getContainer(): Promise<WebContainer> {
  if (containerSingleton) return containerSingleton;
  if (!bootPromise) bootPromise = WebContainer.boot();
  containerSingleton = await bootPromise;
  return containerSingleton;
}

export function useWebContainer() {
  const [status, setStatus] = useState<BuildStatus>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);
  const devProcessRef = useRef<WebContainerProcess | null>(null);

  const log = useCallback((stream: TerminalLine['stream'], text: string) => {
    setTerminalLines((prev) => [
      ...prev,
      { id: crypto.randomUUID(), stream, text, timestamp: Date.now() },
    ]);
  }, []);

  /** Writes files, npm installs, and boots the dev server. Returns captured
   *  stderr (if any) so the caller can feed it back to the AI for a fix. */
  const applyFilesAndRun = useCallback(
    async (files: GeneratedFile[]): Promise<{ ok: boolean; errorOutput: string }> => {
      setLastError(null);
      try {
        const wc = await getContainer();

        setStatus('writing_files');
        for (const file of files) {
          const parts = file.path.split('/');
          if (parts.length > 1) {
            await wc.fs.mkdir(parts.slice(0, -1).join('/'), { recursive: true }).catch(() => {});
          }
          await wc.fs.writeFile(file.path, file.contents);
        }
        log('system', `Wrote ${files.length} file(s).`);

        setStatus('installing');
        const install = await wc.spawn('npm', ['install']);
        const installErr = await pipeToLog(install, log);
        const installExit = await install.exit;
        if (installExit !== 0) {
          setStatus('error');
          setLastError(installErr);
          return { ok: false, errorOutput: installErr };
        }

        setStatus('starting');
        const dev = await wc.spawn('npm', ['run', 'dev']);
        devProcessRef.current = dev;

        let runtimeErr = '';
        dev.output.pipeTo(
          new WritableStream({
            write(chunk) {
              log('stdout', chunk);
              if (/error/i.test(chunk)) runtimeErr += chunk;
            },
          })
        );

        wc.on('server-ready', (_port, url) => {
          setPreviewUrl(url);
          setStatus('running');
        });

        return { ok: true, errorOutput: runtimeErr };
      } catch (err: any) {
        setStatus('error');
        const message = err?.message ?? String(err);
        setLastError(message);
        log('stderr', message);
        return { ok: false, errorOutput: message };
      }
    },
    [log]
  );

  const reset = useCallback(async () => {
    devProcessRef.current?.kill();
    devProcessRef.current = null;
    setPreviewUrl(null);
    setTerminalLines([]);
    setLastError(null);
    setStatus('idle');
  }, []);

  return { status, previewUrl, terminalLines, lastError, applyFilesAndRun, reset };
}

async function pipeToLog(
  proc: WebContainerProcess,
  log: (stream: TerminalLine['stream'], text: string) => void
): Promise<string> {
  let captured = '';
  await proc.output.pipeTo(
    new WritableStream({
      write(chunk) {
        log('stdout', chunk);
        captured += chunk;
      },
    })
  );
  return captured;
}
