"use client";

import { useEffect, useRef, useState } from "react";

function slugify(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "golfer"
  );
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function CardCapture({ golferId, name }: { golferId: string; name: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cardBlob = useRef<Promise<Blob> | null>(null);

  useEffect(() => {
    // Fetch the rendered card as soon as the page loads, not on click.
    // navigator.share() below only works within a short window of user
    // activation after the click — fetching first burns that window
    // (that's exactly what caused Safari's "not allowed" error) — so by
    // click time this is usually already resolved.
    cardBlob.current = fetch(`/api/golfers/${golferId}/card`).then((res) => {
      if (!res.ok) throw new Error("Couldn't prepare the card image");
      return res.blob();
    });
  }, [golferId]);

  async function handleDownload() {
    setBusy(true);
    setError(null);

    try {
      const fileName = `${slugify(name)}-stat-card.png`;
      const blob = await (cardBlob.current ??
        fetch(`/api/golfers/${golferId}/card`).then((res) => res.blob()));
      const file = new File([blob], fileName, { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        try {
          // On phones this opens the native share sheet, which includes
          // "Save Image" — the direct path into the Photos app.
          await navigator.share({ files: [file], title: fileName });
          return;
        } catch (shareErr) {
          if (shareErr instanceof Error && shareErr.name === "AbortError") {
            return; // user closed the share sheet themselves
          }
          // Any other share failure (e.g. the browser refusing it) — fall
          // back to a plain download rather than dead-ending.
        }
      }

      triggerDownload(blob, fileName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the card");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
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
