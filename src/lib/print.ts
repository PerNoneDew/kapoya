/**
 * Print a self-contained HTML document in a hidden iframe.
 *
 * Using window.print() directly on the main document can destabilize the
 * React app (the print dialog blocks the page, and combined with session
 * timers / re-renders this can kick the user back to the login screen).
 * Rendering the printable content inside a detached iframe avoids that.
 *
 * Because print() is called on the iframe's own window, the main window's
 * beforeprint/afterprint events never fire. We set a global flag
 * (window.__healthSysPrinting) so the AuthContext session timer can skip
 * its idle-timeout check while the print dialog is open.
 */
export function printHtml(html: string): void {
  const existing = document.getElementById('print-frame') as HTMLIFrameElement | null;
  if (existing) existing.remove();

  // Signal to the session timer that a print dialog is open
  (window as any).__healthSysPrinting = true;

  const iframe = document.createElement('iframe');
  iframe.id = 'print-frame';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    iframe.remove();
    (window as any).__healthSysPrinting = false;
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  const cleanup = () => {
    const f = document.getElementById('print-frame');
    if (f) f.remove();
    (window as any).__healthSysPrinting = false;
  };

  const trigger = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(cleanup, 1000);
    } catch {
      cleanup();
    }
  };

  iframe.onload = () => setTimeout(trigger, 300);
  setTimeout(() => {
    try {
      if (iframe.contentWindow?.document.readyState === 'complete') trigger();
    } catch {
      cleanup();
    }
  }, 2000);
}
