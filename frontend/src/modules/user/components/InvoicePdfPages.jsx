import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

/**
 * Renders every page of a PDF blob as canvases that fit the container width.
 * Used instead of <iframe> because mobile browsers cannot embed PDFs
 * (they download the file) and the native viewer traps scrolling.
 */
export default function InvoicePdfPages({ blob, onError }) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const pdfRef = useRef(null);
  const canvasRefs = useRef([]);

  // Track container width so pages always fit
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const update = () => setWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Load document
  useEffect(() => {
    let cancelled = false;
    let loadingTask;
    (async () => {
      try {
        const data = new Uint8Array(await blob.arrayBuffer());
        loadingTask = pdfjsLib.getDocument({ data });
        const pdf = await loadingTask.promise;
        if (cancelled) { pdf.destroy(); return; }
        pdfRef.current = pdf;
        setPageCount(pdf.numPages);
      } catch (err) {
        if (!cancelled) onError?.(err);
      }
    })();
    return () => {
      cancelled = true;
      loadingTask?.destroy();
      pdfRef.current = null;
      setPageCount(0);
    };
  }, [blob]);

  // Render pages whenever the document or width changes
  useEffect(() => {
    const pdf = pdfRef.current;
    if (!pdf || !pageCount || !width) return undefined;
    let cancelled = false;
    const tasks = [];
    (async () => {
      for (let n = 1; n <= pageCount; n += 1) {
        const canvas = canvasRefs.current[n - 1];
        if (!canvas || cancelled) return;
        try {
          const page = await pdf.getPage(n);
          const base = page.getViewport({ scale: 1 });
          const scale = width / base.width;
          const dpr = window.devicePixelRatio || 1;
          const viewport = page.getViewport({ scale: scale * dpr });
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = `${width}px`;
          canvas.style.height = `${(base.height * scale)}px`;
          const task = page.render({ canvasContext: canvas.getContext('2d'), viewport });
          tasks.push(task);
          await task.promise;
        } catch (err) {
          if (err?.name !== 'RenderingCancelledException' && !cancelled) onError?.(err);
        }
      }
    })();
    return () => {
      cancelled = true;
      tasks.forEach((t) => t.cancel());
    };
  }, [pageCount, width]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-y-auto overflow-x-hidden no-scrollbar bg-[#4A4A4A] p-2 sm:p-4"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <div className="mx-auto max-w-3xl space-y-3">
        {Array.from({ length: pageCount }, (_, i) => (
          <canvas
            key={i}
            ref={(el) => { canvasRefs.current[i] = el; }}
            className="block w-full bg-white shadow-md"
          />
        ))}
      </div>
    </div>
  );
}
