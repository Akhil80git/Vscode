import { FileItem } from '../types';
import { getAllFilesFlat } from './workspaceUtils';

export function buildLivePreviewDoc(files: FileItem[], activeFilePath?: string): string {
  const flatFiles = getAllFilesFlat(files);

  // 1. Check if user is currently looking at an HTML file
  let htmlFile: FileItem | undefined;
  if (activeFilePath && activeFilePath.endsWith('.html')) {
    htmlFile = flatFiles.find((f) => f.path === activeFilePath);
  }

  // 2. Fallback to index.html in root or anywhere
  if (!htmlFile) {
    htmlFile = flatFiles.find((f) => f.name.toLowerCase() === 'index.html') ||
               flatFiles.find((f) => f.name.toLowerCase().endsWith('.html'));
  }

  if (htmlFile && htmlFile.content) {
    let html = htmlFile.content;

    // Inline CSS links: <link rel="stylesheet" href="style.css">
    html = html.replace(/<link\s+[^>]*href=["']([^"']+)["'][^>]*>/gi, (match, href) => {
      if (!href.includes('://') && !href.startsWith('//')) {
        const cleanHref = href.replace(/^\.\//, '');
        const cssFile = flatFiles.find(
          (f) => f.path === cleanHref || f.name === cleanHref || f.path.endsWith(cleanHref)
        );
        if (cssFile && cssFile.content) {
          return `<style>/* Inlined from ${cleanHref} */\n${cssFile.content}\n</style>`;
        }
      }
      return match;
    });

    // Inline JS scripts: <script src="script.js"></script>
    html = html.replace(/<script\s+[^>]*src=["']([^"']+)["'][^>]*>\s*<\/script>/gi, (match, src) => {
      if (!src.includes('://') && !src.startsWith('//')) {
        const cleanSrc = src.replace(/^\.\//, '');
        const jsFile = flatFiles.find(
          (f) => f.path === cleanSrc || f.name === cleanSrc || f.path.endsWith(cleanSrc)
        );
        if (jsFile && jsFile.content) {
          return `<script>/* Inlined from ${cleanSrc} */\n${jsFile.content}\n</script>`;
        }
      }
      return match;
    });

    // Add Live Reload indicator & error catcher
    const injectedScript = `
      <script>
        window.addEventListener('error', function(e) {
          console.warn('[Live Preview Error]:', e.message);
        });
      </script>
    `;

    if (html.includes('</head>')) {
      return html.replace('</head>', `${injectedScript}</head>`);
    } else if (html.includes('</body>')) {
      return html.replace('</body>', `${injectedScript}</body>`);
    }
    return html + injectedScript;
  }

  // If active file is Markdown
  const activeFile = activeFilePath ? flatFiles.find((f) => f.path === activeFilePath) : null;
  if (activeFile && activeFile.language === 'markdown') {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 32px; color: #f1f5f9; background: #0f172a; line-height: 1.6; }
            h1, h2, h3 { border-bottom: 1px solid #334155; padding-bottom: 8px; color: #38bdf8; }
            pre { background: #1e293b; padding: 14px; border-radius: 8px; border: 1px solid #334155; font-family: monospace; color: #34d399; }
            code { background: #1e293b; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
          </style>
        </head>
        <body>
          <div>${(activeFile.content || '')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/\*\*(.*)\*\*/gim, '<b>$1</b>')
            .replace(/\*(.*)\*/gim, '<i>$1</i>')
            .replace(/\n/gim, '<br/>')}</div>
        </body>
      </html>
    `;
  }

  // If no HTML file found yet
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #090d16;
            color: #94a3b8;
            height: 100vh;
            margin: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 24px;
          }
          .box {
            background: #111827;
            border: 1px solid #1f2937;
            padding: 32px;
            border-radius: 12px;
            max-width: 440px;
          }
          h2 { color: #f8fafc; margin-bottom: 8px; }
          p { font-size: 14px; line-height: 1.5; margin-bottom: 16px; }
          code { background: #1e293b; color: #38bdf8; padding: 3px 6px; border-radius: 4px; font-family: monospace; }
          .badge { display: inline-block; background: #0284c7; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 12px; }
        </style>
      </head>
      <body>
        <div class="box">
          <div class="badge">VS Code Live Server</div>
          <h2>Live Preview Ready</h2>
          <p>Create an <code>index.html</code> in this project to see real-time live preview rendering!</p>
          <p style="font-size: 12px; color: #64748b;">Linked CSS (<code>&lt;link href="style.css"&gt;</code>) and scripts (<code>&lt;script src="script.js"&gt;</code>) will be hot-reloaded automatically.</p>
        </div>
      </body>
    </html>
  `;
}
