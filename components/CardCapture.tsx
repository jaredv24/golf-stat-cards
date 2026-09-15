"use client";

import { useRef, useState, type ReactNode } from "react";
import { toPng } from "html-to-image";

function slugify(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "golfer"
  );
}

export function CardCapture({ name, children }: { name: string; children: ReactNode }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    if (!cardRef.current) return;
    setBusy(true);
    setError(null);

    try {
      await document.fonts.ready.catch(() => {});
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
      });

      const fileName = `${slugify(name)}-stat-card.png`;
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], fileName, { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        // On phones this opens the native share sheet, which includes
        // "Save Image" — the direct path into the Photos app.
        await navigator.share({ files: [file], title: fileName });
      } else {
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = fileName;
        link.click();
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Couldn't save the card");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div ref={cardRef}>{children}</div>

      <button
        type="button"
        onClick={handleDownload}
        disabled={busy}
        className="mx-auto mt-4 block w-full max-w-sm rounded bg-accent px-4 py-3 font-pixel text-[10px] text-ink transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Preparing…" : "Download card"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-center text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
