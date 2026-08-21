import JSZip from 'jszip';
import type { GeneratedFile } from '../types';

/** Packages generated files into a downloadable .zip and triggers a browser save. */
export async function downloadAsZip(files: GeneratedFile[], zipName = 'fed-v1-project.zip') {
  if (files.length === 0) return;

  const zip = new JSZip();
  for (const file of files) {
    zip.file(file.path, file.contents);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = zipName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
