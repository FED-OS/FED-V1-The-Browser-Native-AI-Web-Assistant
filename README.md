[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/W3T61ZU5FS)
# FED-V1

Autonomous, browser-native developer factory. Prompt an app; DeepSeek-R1 writes it,
a WebContainer (virtual Linux sandbox running entirely in the browser tab) installs
and runs it, and errors get fed back to the model automatically until it boots.

## Setup

```bash
git clone <your-repo-url>
cd fed-v1
cp .env.example .env   # add your DeepSeek/OpenRouter API key
npm install
npm run dev
```

Open the printed local URL. Note: WebContainers require the browser tab to run in a
cross-origin-isolated context — the required headers are already set in `vite.config.ts`.
If you deploy this app itself (not the apps it generates), make sure your host also
sends `Cross-Origin-Embedder-Policy: require-corp` and `Cross-Origin-Opener-Policy: same-origin`.

## How it works

1. `ChatInterface` collects a prompt.
2. `useDeepSeek` streams a completion from an OpenAI-compatible endpoint.
3. `utils/parser.ts` extracts `File: <path>` + fenced code blocks into structured files.
4. `useWebContainer` boots a sandbox, writes those files, runs `npm install && npm run dev`
   inside it, and surfaces a live preview URL once the server is ready.
5. If the install or dev server errors out, the captured stderr is sent back to the model
   as a follow-up "fix this" prompt, up to `MAX_AUTO_FIX_ATTEMPTS` times.
6. `utils/zipper.ts` lets the user download the generated project as a `.zip`.

## Known gaps to fill in before shipping

- No auth/rate limiting — the API key lives client-side unless you add a backend proxy.
- The parser assumes a fairly disciplined system prompt; loosen/tighten `SYSTEM_PROMPT`
  in `useDeepSeek.ts` if your model's output format drifts.
- No persistence — refreshing the tab loses chat history and files (add IndexedDB/
  localStorage or a backend if you need that).
